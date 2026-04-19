/**
 * POST /api/attempts/[id]/advance
 *
 * Drives the guided-flow tutored loop. Each call appends ONE learner stage to
 * the work-log stored on `attempts.iterations` (reusing the previously-unused
 * jsonb column). If the stage has a tutor counterpart, the matching AI judge
 * call runs inline and its output is appended as the next stage.
 *
 * Final stage (`user-final` → `tutor-final-review`) finalizes the attempt:
 * writes evaluationResult, marks completed/failed, and inserts point
 * transactions — the same end-state the single-shot inngest function produces.
 *
 * Request body: `{ kind: LearnerStageKind, text: string }` where
 * LearnerStageKind is one of:
 *   - 'user-prompt'        → then runs tutor-prompt-critique
 *   - 'user-raw-response'  → no tutor response (just persisted)
 *   - 'user-critique'      → then runs tutor-critique-of-critique
 *   - 'user-final'         → then runs tutor-final-review + finalizes
 *
 * Response: `{ workLog: GuidedStage[], finalized?: { pointsAwarded, qualityScore, status } }`
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { attempts, challenges, users, pointTransactions } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { errorResponse, jsonResponse, handleApiError, requireAuth } from '@/lib/api-utils';
import {
  critiquePrompt,
  critiqueUserCritique,
  finalPMReview,
} from '@/lib/services/evaluation/ai-judge';
import { calculateScore, getLevelForPoints } from '@/lib/services/evaluation/scoring';
import { logAuditEvent } from '@/lib/services/audit';
import type { GuidedStage, GuidedStageKind, GuidedFlowConfig, RubricCriterion } from '@/lib/types';

/** The fixed learner-stage order. Each expects the prior one to be present. */
const LEARNER_ORDER: readonly GuidedStageKind[] = [
  'user-prompt',
  'user-raw-response',
  'user-critique',
  'user-final',
] as const;

const bodySchema = z.object({
  kind: z.enum(['user-prompt', 'user-raw-response', 'user-critique', 'user-final']),
  text: z.string().min(1, 'Stage text is required').max(20000),
});

function nextExpectedLearnerKind(workLog: GuidedStage[]): GuidedStageKind {
  const completed = workLog
    .filter((s) => LEARNER_ORDER.includes(s.kind))
    .map((s) => s.kind);
  for (const k of LEARNER_ORDER) {
    if (!completed.includes(k)) return k;
  }
  // All learner stages done
  return 'user-final';
}

/**
 * GET /api/attempts/[id]/advance
 *
 * Returns the current work-log and what learner-stage is expected next, so the
 * workspace UI can render the right input box on open/refresh.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const [attempt] = await db
      .select()
      .from(attempts)
      .where(eq(attempts.id, id))
      .limit(1);
    if (!attempt || attempt.userId !== user.id) {
      return errorResponse('Attempt not found', 404);
    }
    const workLog: GuidedStage[] = Array.isArray(attempt.iterations)
      ? (attempt.iterations as GuidedStage[])
      : [];
    return jsonResponse({
      workLog,
      status: attempt.status,
      expectedNext: attempt.status === 'in_progress' ? nextExpectedLearnerKind(workLog) : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = bodySchema.parse(await req.json());

    // 1) Load attempt + challenge, verify ownership and state
    const [attempt] = await db
      .select()
      .from(attempts)
      .where(eq(attempts.id, id))
      .limit(1);

    if (!attempt || attempt.userId !== user.id) {
      return errorResponse('Attempt not found', 404);
    }
    if (attempt.status !== 'in_progress') {
      return errorResponse(`Attempt is ${attempt.status}, cannot advance`, 409);
    }

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, attempt.challengeId))
      .limit(1);

    if (!challenge) {
      return errorResponse('Challenge not found', 404);
    }

    // 2) Verify this is a guided-flow challenge. `flow` and `guidedConfig`
    //    live on `contextTemplate` to avoid a schema migration.
    const ctx = (challenge.contextTemplate ?? {}) as {
      flow?: 'single-shot' | 'guided';
      guidedConfig?: GuidedFlowConfig;
    };
    if (ctx.flow !== 'guided' || !ctx.guidedConfig) {
      return errorResponse('Challenge is not a guided-flow challenge', 400);
    }
    const guidedConfig = ctx.guidedConfig;

    // 3) Validate the requested stage matches the expected next stage
    const workLog: GuidedStage[] = Array.isArray(attempt.iterations)
      ? (attempt.iterations as GuidedStage[])
      : [];
    const expected = nextExpectedLearnerKind(workLog);
    if (body.kind !== expected) {
      return errorResponse(
        `Out-of-order stage. Expected ${expected}, received ${body.kind}`,
        409
      );
    }

    const now = () => new Date().toISOString();

    // 4) Append the learner stage
    const newLog: GuidedStage[] = [...workLog, { kind: body.kind, text: body.text, at: now() }];

    // 5) Run the matching tutor stage (if any)
    const tutorCtx = {
      challengeTitle: challenge.title,
      briefRequest: guidedConfig.briefRequest,
      referenceAnswer: guidedConfig.referenceAnswer,
    };

    let finalized: { pointsAwarded: number; qualityScore: number; status: 'completed' | 'failed' } | undefined;

    if (body.kind === 'user-prompt') {
      const critique = await critiquePrompt(tutorCtx, body.text);
      newLog.push({ kind: 'tutor-prompt-critique', text: critique, at: now() });
    } else if (body.kind === 'user-critique') {
      // Need the raw response from the log
      const rawResp = newLog.find((s) => s.kind === 'user-raw-response')?.text ?? '';
      const critique = await critiqueUserCritique(tutorCtx, rawResp, body.text);
      newLog.push({ kind: 'tutor-critique-of-critique', text: critique, at: now() });
    } else if (body.kind === 'user-final') {
      // Pull earlier stages for the full PM review transcript
      const userPrompt = newLog.find((s) => s.kind === 'user-prompt')?.text ?? '';
      const rawResponse = newLog.find((s) => s.kind === 'user-raw-response')?.text ?? '';
      const userCritique = newLog.find((s) => s.kind === 'user-critique')?.text ?? '';
      const rubric = challenge.rubric as { criteria: RubricCriterion[] };

      const evaluation = await finalPMReview(
        tutorCtx,
        { criteria: rubric.criteria },
        { userPrompt, rawResponse, userCritique, finalVersion: body.text }
      );

      newLog.push({
        kind: 'tutor-final-review',
        text: evaluation.feedback,
        at: now(),
        scores: evaluation.criteria,
      });

      // 6) Finalize attempt: mirror evaluate-submission.ts end-state
      const startedAt = attempt.startedAt ? new Date(attempt.startedAt).getTime() : Date.now();
      const submittedAtMs = Date.now();
      const actualMinutes = (submittedAtMs - startedAt) / 60000;

      const [userRow] = await db
        .select({ currentStreak: users.currentStreak })
        .from(users)
        .where(eq(users.id, attempt.userId))
        .limit(1);

      const scoring = calculateScore({
        evaluation,
        challengePointsBase: challenge.pointsBase,
        timeMinutes: challenge.timeMinutes,
        actualMinutes,
        currentStreak: userRow?.currentStreak ?? 0,
        hintsUsed: 0,
      });

      const status: 'completed' | 'failed' = scoring.qualityScore >= 40 ? 'completed' : 'failed';

      await db
        .update(attempts)
        .set({
          status,
          iterations: newLog,
          evaluationResult: evaluation,
          evaluatorType: 'ai',
          submissionText: body.text, // the final version IS the submission
          submittedAt: new Date(submittedAtMs),
          completedAt: new Date(submittedAtMs),
          pointsAwarded: scoring.totalPoints,
          qualityScore: scoring.qualityScore.toString(),
        })
        .where(eq(attempts.id, attempt.id));

      // Insert point transactions
      type TxType = 'challenge_complete' | 'quality_bonus' | 'speed_bonus' | 'streak_bonus';
      const txs: { userId: string; attemptId: string; amount: number; type: TxType; description: string }[] = [
        {
          userId: attempt.userId,
          attemptId: attempt.id,
          amount: scoring.basePoints,
          type: 'challenge_complete',
          description: `Completed ${attempt.challengeId}`,
        },
      ];
      if (scoring.speedBonus > 0) {
        txs.push({
          userId: attempt.userId,
          attemptId: attempt.id,
          amount: scoring.speedBonus,
          type: 'speed_bonus',
          description: `Speed bonus for ${attempt.challengeId}`,
        });
      }
      if (scoring.streakBonus > 0) {
        txs.push({
          userId: attempt.userId,
          attemptId: attempt.id,
          amount: scoring.streakBonus,
          type: 'streak_bonus',
          description: `Streak bonus for ${attempt.challengeId}`,
        });
      }
      if (txs.length) await db.insert(pointTransactions).values(txs);

      // Recompute user points + level from point_transactions
      const [{ total }] = await db
        .select({ total: sql<number>`COALESCE(SUM(${pointTransactions.amount}), 0)` })
        .from(pointTransactions)
        .where(eq(pointTransactions.userId, attempt.userId));
      const totalPoints = Number(total ?? 0);
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

      await logAuditEvent({
        eventType: 'challenge.evaluated',
        actorId: attempt.userId,
        targetType: 'attempt',
        targetId: attempt.id,
        metadata: {
          challengeId: attempt.challengeId,
          flow: 'guided',
          overallScore: evaluation.overallScore,
          confidence: evaluation.confidence,
          pointsAwarded: scoring.totalPoints,
        },
      });

      finalized = { pointsAwarded: scoring.totalPoints, qualityScore: scoring.qualityScore, status };
    } else {
      // user-raw-response: no tutor stage, just persist the log
      await db
        .update(attempts)
        .set({ iterations: newLog })
        .where(eq(attempts.id, attempt.id));
    }

    // For non-final stages that DID produce a tutor response, persist the log.
    if (!finalized && (body.kind === 'user-prompt' || body.kind === 'user-critique')) {
      await db
        .update(attempts)
        .set({ iterations: newLog })
        .where(eq(attempts.id, attempt.id));
    }

    return jsonResponse({ workLog: newLog, finalized });
  } catch (error) {
    return handleApiError(error);
  }
}
