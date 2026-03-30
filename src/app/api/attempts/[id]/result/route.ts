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
    const bonuses = await db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.attemptId, id));

    const bonusMap = {
      quality: bonuses.find(b => b.type === 'quality_bonus')?.amount ?? 0,
      speed: bonuses.find(b => b.type === 'speed_bonus')?.amount ?? 0,
      streak: bonuses.find(b => b.type === 'streak_bonus')?.amount ?? 0,
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
      attemptsRemaining: Math.max(0, 3 - allAttempts.length),
      evaluating: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
