import { NextRequest } from 'next/server';
import { db } from '@/db';
import { attempts, challenges, users, pointTransactions } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { submitChallengeSchema } from '@/lib/validators/challenges';
import { jsonResponse, errorResponse, handleApiError, requireAuth } from '@/lib/api-utils';
import { logAuditEvent } from '@/lib/services/audit';
import { inngest } from '@/lib/services/evaluation/inngest-client';
import { dispatchEvaluation } from '@/lib/services/evaluation/dispatch';
import { calculateScore, getLevelForPoints } from '@/lib/services/evaluation/scoring';

// Claude ai-judge calls can take 10-15s; bump Vercel function timeout
// (Hobby plan max is 60s for Node runtime).
export const maxDuration = 60;

// Feature flag: only use Inngest when explicitly opted in AND a plausible
// Inngest Cloud event key is configured. Otherwise we run evaluation inline
// so the route returns a real result (or a real error) to the user.
function shouldUseInngest(): boolean {
  if (process.env.USE_INNGEST !== 'true') return false;
  const key = process.env.INNGEST_EVENT_KEY ?? '';
  // Real Inngest Cloud event keys are long; local-dev placeholders are short.
  return key.length >= 32;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = submitChallengeSchema.parse(await req.json());

    // Verify attempt belongs to user and is in progress
    const [attempt] = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.id, body.attemptId),
          eq(attempts.userId, user.id!),
          eq(attempts.challengeId, id),
          eq(attempts.status, 'in_progress')
        )
      )
      .limit(1);

    if (!attempt) {
      return errorResponse('Active attempt not found', 404);
    }

    // Update attempt status to submitted
    await db
      .update(attempts)
      .set({
        status: 'evaluating',
        submissionText: body.submissionText,
        submittedAt: new Date(),
      })
      .where(eq(attempts.id, body.attemptId));

    await logAuditEvent({
      eventType: 'challenge.submitted',
      actorId: user.id!,
      targetType: 'attempt',
      targetId: body.attemptId,
      metadata: { challengeId: id, textLength: body.submissionText?.length ?? 0 },
    });

    // Trigger evaluation. Inngest is opt-in (requires a real Inngest Cloud
    // event key AND USE_INNGEST=true). Otherwise run inline so the Vercel
    // function returns a real result and errors surface to the user instead
    // of the attempt silently staying in 'evaluating' forever.
    if (shouldUseInngest()) {
      await inngest.send({
        name: 'submission/created',
        data: {
          attemptId: body.attemptId,
          challengeId: id,
          submissionText: body.submissionText ?? '',
        },
      });
    } else {
      try {
        await runEvaluationInline(body.attemptId, id, body.submissionText ?? '', user.id!);
      } catch (evalError) {
        console.error('Evaluation error:', evalError);
        // Mark attempt as failed so UI stops polling
        await db
          .update(attempts)
          .set({
            status: 'failed',
            evaluationResult: {
              error: evalError instanceof Error ? evalError.message : String(evalError),
            },
            completedAt: new Date(),
          })
          .where(eq(attempts.id, body.attemptId));
        return errorResponse(
          `Evaluation failed: ${evalError instanceof Error ? evalError.message : String(evalError)}`,
          500
        );
      }
    }

    return jsonResponse({
      attemptId: body.attemptId,
      status: 'evaluating',
      estimatedWaitSeconds: 15,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

async function runEvaluationInline(attemptId: string, challengeId: string, submissionText: string, userId: string) {
  // Load challenge
  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1);
  if (!challenge) throw new Error(`Challenge ${challengeId} not found`);

  // Load attempt
  const [attempt] = await db
    .select()
    .from(attempts)
    .where(eq(attempts.id, attemptId))
    .limit(1);
  if (!attempt) throw new Error(`Attempt ${attemptId} not found`);

  // Dispatch to the right evaluator (ai-judge / automated-test / hybrid)
  const evaluation = await dispatchEvaluation({
    challengeTitle: challenge.title,
    challengeDescription: challenge.description,
    instructions: challenge.instructions,
    submissionText,
    rubric: challenge.rubric as {
      criteria: { name: string; weight: number; description: string }[];
      grader?: import('@/lib/services/evaluation/auto-graders').GraderConfig;
    },
    difficulty: challenge.difficulty,
    evaluationMethod: challenge.evaluationMethod,
  });

  // Calculate scoring
  const startedAt = attempt.startedAt ? new Date(attempt.startedAt).getTime() : Date.now();
  const submittedAt = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() : Date.now();
  const actualMinutes = (submittedAt - startedAt) / 60000;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const scoring = calculateScore({
    evaluation,
    challengePointsBase: challenge.pointsBase,
    timeMinutes: challenge.timeMinutes,
    actualMinutes,
    currentStreak: user?.currentStreak ?? 0,
    hintsUsed: 0,
  });

  // Save results
  const evaluatorType: 'ai' | 'automated' | 'hybrid' =
    evaluation.meta?.evaluator === 'ai-judge'
      ? 'ai'
      : evaluation.meta?.evaluator === 'hybrid'
        ? 'hybrid'
        : 'automated';

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

  // Point transactions
  type TxType = 'challenge_complete' | 'quality_bonus' | 'speed_bonus' | 'streak_bonus' | 'appeal_adjustment';
  const transactions: { userId: string; attemptId: string; amount: number; type: TxType; description: string }[] = [
    { userId, attemptId, amount: scoring.basePoints, type: 'challenge_complete', description: `Completed ${challengeId}` },
  ];
  if (scoring.qualityBonus > 0) {
    transactions.push({ userId, attemptId, amount: scoring.qualityBonus, type: 'quality_bonus', description: `Quality bonus for ${challengeId}` });
  }
  if (scoring.speedBonus > 0) {
    transactions.push({ userId, attemptId, amount: scoring.speedBonus, type: 'speed_bonus', description: `Speed bonus for ${challengeId}` });
  }
  if (scoring.streakBonus > 0) {
    transactions.push({ userId, attemptId, amount: scoring.streakBonus, type: 'streak_bonus', description: `Streak bonus for ${challengeId}` });
  }
  if (transactions.length > 0) {
    await db.insert(pointTransactions).values(transactions);
  }

  // Update user points/level
  const newTotal = await db
    .select({ total: sql<number>`COALESCE(SUM(${pointTransactions.amount}), 0)` })
    .from(pointTransactions)
    .where(eq(pointTransactions.userId, userId));

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
    .where(eq(users.id, userId));

  await logAuditEvent({
    eventType: 'challenge.evaluated',
    actorId: userId,
    targetType: 'attempt',
    targetId: attemptId,
    metadata: {
      challengeId,
      overallScore: evaluation.overallScore,
      confidence: evaluation.confidence,
      pointsAwarded: scoring.totalPoints,
    },
  });

  console.log(`✓ Evaluation complete: score=${evaluation.overallScore}, points=${scoring.totalPoints}`);
}
