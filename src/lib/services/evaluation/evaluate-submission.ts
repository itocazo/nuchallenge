import { inngest } from './inngest-client';
import { dispatchEvaluation } from './dispatch';
import { calculateScore, getLevelForPoints, evaluateBadges } from './scoring';
import type { GraderConfig } from './auto-graders';
import { getDb } from '@/db';
import { attempts, challenges, users, pointTransactions } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logAuditEvent } from '@/lib/services/audit';

export const evaluateSubmission = inngest.createFunction(
  {
    id: 'evaluate-submission',
    retries: 2,
    triggers: [{ event: 'submission/created' }],
  },
  async ({ event, step }) => {
    const { attemptId, challengeId, submissionText } = event.data as {
      attemptId: string;
      challengeId: string;
      submissionText: string;
    };

    const db = getDb();

    // Step 1: Load challenge and rubric
    const challenge = await step.run('load-challenge', async () => {
      const [c] = await db
        .select()
        .from(challenges)
        .where(eq(challenges.id, challengeId))
        .limit(1);
      if (!c) throw new Error(`Challenge ${challengeId} not found`);
      return c;
    });

    // Step 2: Load attempt to get timing data
    const attempt = await step.run('load-attempt', async () => {
      const [a] = await db
        .select()
        .from(attempts)
        .where(eq(attempts.id, attemptId))
        .limit(1);
      if (!a) throw new Error(`Attempt ${attemptId} not found`);
      return a;
    });

    // Step 3: Dispatch to the right evaluator (ai-judge / automated-test / hybrid)
    const evaluation = await step.run('evaluate', async () => {
      return dispatchEvaluation({
        challengeTitle: challenge.title,
        challengeDescription: challenge.description,
        instructions: challenge.instructions,
        submissionText,
        rubric: challenge.rubric as {
          criteria: { name: string; weight: number; description: string }[];
          grader?: GraderConfig;
          hybridWeights?: { auto: number; ai: number };
        },
        difficulty: challenge.difficulty,
        evaluationMethod: challenge.evaluationMethod,
      });
    });

    // Step 4: Calculate scoring
    const scoring = await step.run('calculate-score', async () => {
      const startedAt = attempt.startedAt ? new Date(attempt.startedAt).getTime() : Date.now();
      const submittedAt = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() : Date.now();
      const actualMinutes = (submittedAt - startedAt) / 60000;

      // Get user's current streak
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, attempt.userId))
        .limit(1);

      return calculateScore({
        evaluation,
        challengePointsBase: challenge.pointsBase,
        timeMinutes: challenge.timeMinutes,
        actualMinutes,
        currentStreak: user?.currentStreak ?? 0,
        hintsUsed: 0, // TODO: track hints used in attempt metadata
      });
    });

    // Step 5: Save results and update user
    await step.run('save-results', async () => {
      const evaluatorType: 'ai' | 'automated' | 'hybrid' =
        evaluation.meta?.evaluator === 'ai-judge'
          ? 'ai'
          : evaluation.meta?.evaluator === 'hybrid'
            ? 'hybrid'
            : 'automated';

      // Update attempt with evaluation results
      await db
        .update(attempts)
        .set({
          status: scoring.qualityScore >= 40 ? 'completed' : 'failed',
          evaluationResult: evaluation,
          evaluatorType,
          pointsAwarded: scoring.totalPoints,
          qualityScore: scoring.qualityScore.toString(),
          completedAt: new Date(),
        })
        .where(eq(attempts.id, attemptId));

      // Insert point transactions
      type TxType = 'challenge_complete' | 'quality_bonus' | 'speed_bonus' | 'streak_bonus' | 'appeal_adjustment';
      const transactions: { userId: string; attemptId: string; amount: number; type: TxType; description: string }[] = [
        { userId: attempt.userId, attemptId, amount: scoring.basePoints, type: 'challenge_complete', description: `Completed ${challengeId}` },
      ];
      if (scoring.qualityBonus > 0) {
        transactions.push({ userId: attempt.userId, attemptId, amount: scoring.qualityBonus, type: 'quality_bonus', description: `Quality bonus for ${challengeId}` });
      }
      if (scoring.speedBonus > 0) {
        transactions.push({ userId: attempt.userId, attemptId, amount: scoring.speedBonus, type: 'speed_bonus', description: `Speed bonus for ${challengeId}` });
      }
      if (scoring.streakBonus > 0) {
        transactions.push({ userId: attempt.userId, attemptId, amount: scoring.streakBonus, type: 'streak_bonus', description: `Streak bonus for ${challengeId}` });
      }

      if (transactions.length > 0) {
        await db.insert(pointTransactions).values(transactions);
      }

      // Update user points and level
      const newTotal = await db
        .select({ total: sql<number>`COALESCE(SUM(${pointTransactions.amount}), 0)` })
        .from(pointTransactions)
        .where(eq(pointTransactions.userId, attempt.userId));

      const totalPoints = Number(newTotal[0]?.total ?? 0);
      const levelInfo = getLevelForPoints(totalPoints);

      await db
        .update(users)
        .set({
          pointsTotal: totalPoints,
          level: levelInfo.level,
          levelName: levelInfo.name,
          lastActivityDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date(),
        })
        .where(eq(users.id, attempt.userId));

      // Audit log
      await logAuditEvent({
        eventType: 'challenge.evaluated',
        actorId: attempt.userId,
        targetType: 'attempt',
        targetId: attemptId,
        metadata: {
          challengeId,
          overallScore: evaluation.overallScore,
          confidence: evaluation.confidence,
          pointsAwarded: scoring.totalPoints,
        },
      });
    });

    return {
      attemptId,
      challengeId,
      overallScore: evaluation.overallScore,
      pointsAwarded: scoring.totalPoints,
      status: scoring.qualityScore >= 40 ? 'completed' : 'failed',
    };
  }
);
