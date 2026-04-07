import { NextRequest } from 'next/server';
import { db } from '@/db';
import { attempts, challenges, pointTransactions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { jsonResponse, errorResponse, handleApiError, requireAuth } from '@/lib/api-utils';

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
      .where(
        and(
          eq(attempts.id, id),
          eq(attempts.userId, user.id!)
        )
      )
      .limit(1);

    if (!attempt) {
      return errorResponse('Attempt not found', 404);
    }

    // If still evaluating, return status
    if (attempt.status === 'evaluating' || attempt.status === 'submitted') {
      return jsonResponse({
        attemptId: attempt.id,
        status: attempt.status,
        evaluating: true,
      });
    }

    // Get challenge info
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, attempt.challengeId))
      .limit(1);

    // Get point transactions for this attempt
    const txs = await db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.attemptId, id));

    // Real breakdown: base (challenge_complete) + each bonus type.
    // These always sum to pointsAwarded, so the UI can render a ledger
    // that actually ties out instead of fabricating a "bonus = total - max" line.
    const baseAmount = txs.find((b) => b.type === 'challenge_complete')?.amount ?? 0;
    const qualityAmount = txs.find((b) => b.type === 'quality_bonus')?.amount ?? 0;
    const speedAmount = txs.find((b) => b.type === 'speed_bonus')?.amount ?? 0;
    const streakAmount = txs.find((b) => b.type === 'streak_bonus')?.amount ?? 0;

    const bonusMap = {
      quality: qualityAmount,
      speed: speedAmount,
      streak: streakAmount,
    };

    const scoreBreakdown = {
      base: baseAmount,
      qualityBonus: qualityAmount,
      speedBonus: speedAmount,
      streakBonus: streakAmount,
      total: baseAmount + qualityAmount + speedAmount + streakAmount,
      challengeMaxBase: challenge?.pointsBase ?? null,
    };

    // Count remaining attempts
    const allAttempts = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.userId, user.id!),
          eq(attempts.challengeId, attempt.challengeId)
        )
      );

    return jsonResponse({
      attemptId: attempt.id,
      challengeId: attempt.challengeId,
      challengeTitle: challenge?.title,
      status: attempt.status,
      qualityScore: attempt.qualityScore ? Number(attempt.qualityScore) : null,
      pointsAwarded: attempt.pointsAwarded,
      evaluation: attempt.evaluationResult,
      bonuses: bonusMap,
      scoreBreakdown,
      attemptsRemaining: Math.max(0, 3 - allAttempts.length),
      evaluating: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
