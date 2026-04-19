import { NextRequest } from 'next/server';
import { db } from '@/db';
import { challenges, attempts, assets } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { jsonResponse, errorResponse, handleApiError, getAuthUser } from '@/lib/api-utils';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, id))
      .limit(1);

    if (!challenge) {
      return errorResponse('Challenge not found', 404);
    }

    // Get user's attempts if authenticated
    let userAttempts: typeof attempts.$inferSelect[] = [];
    let contextAssets: { challengeId: string; challengeTitle: string; contentText: string | null; completedAt: Date | null; score: string | null }[] = [];

    if (user?.id) {
      userAttempts = await db
        .select()
        .from(attempts)
        .where(
          and(
            eq(attempts.userId, user.id),
            eq(attempts.challengeId, id)
          )
        );

      // Get prerequisite assets
      const prereqs = (challenge.prerequisites ?? []) as string[];
      if (prereqs.length > 0) {
        contextAssets = await db
          .select({
            challengeId: assets.challengeId,
            challengeTitle: challenges.title,
            contentText: assets.contentText,
            completedAt: attempts.completedAt,
            score: attempts.qualityScore,
          })
          .from(assets)
          .innerJoin(challenges, eq(assets.challengeId, challenges.id))
          .innerJoin(attempts, eq(assets.attemptId, attempts.id))
          .where(eq(assets.userId, user.id));
      }
    }

    // Determine which prerequisites the user has completed
    const prereqIds = (challenge.prerequisites ?? []) as string[];
    let completedPrereqIds: string[] = [];
    if (user?.id && prereqIds.length > 0) {
      const prereqAttempts = await db
        .select({ challengeId: attempts.challengeId })
        .from(attempts)
        .where(
          and(
            eq(attempts.userId, user.id),
            inArray(attempts.challengeId, prereqIds),
            eq(attempts.status, 'completed')
          )
        );
      completedPrereqIds = [...new Set(prereqAttempts.map(a => a.challengeId))];
    }

    const completedAttempt = userAttempts.find(a => a.status === 'completed');
    const activeAttempt = userAttempts.find(a => a.status === 'in_progress');
    // Failed attempts (grader errors, malformed submissions) don't burn quota —
    // only completed / in_progress / evaluating count toward the 3-attempt cap.
    const attemptsCount = userAttempts.filter(a => a.status !== 'failed').length;

    return jsonResponse({
      challenge: {
        ...challenge,
        userStatus: completedAttempt ? 'completed' : activeAttempt ? 'in_progress' : 'available',
        bestScore: completedAttempt?.qualityScore ? Number(completedAttempt.qualityScore) : null,
        attemptsRemaining: Math.max(0, 3 - attemptsCount),
        activeAttemptId: activeAttempt?.id ?? null,
        completedPrereqIds,
      },
      contextAssets,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
