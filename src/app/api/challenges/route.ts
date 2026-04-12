import { NextRequest } from 'next/server';
import { db } from '@/db';
import { challenges, attempts } from '@/db/schema';
import { eq, and, sql, ilike, inArray } from 'drizzle-orm';
import { challengeListQuerySchema } from '@/lib/validators/challenges';
import { jsonResponse, handleApiError, getAuthUser } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = challengeListQuerySchema.parse(params);
    const user = await getAuthUser();

    // Build base query
    let conditions = [eq(challenges.active, true)];

    // Filter by difficulty
    if (query.difficulty) {
      conditions.push(eq(challenges.difficulty, query.difficulty));
    }

    // Filter by search
    if (query.search) {
      conditions.push(
        sql`(${ilike(challenges.title, `%${query.search}%`)} OR ${ilike(challenges.description, `%${query.search}%`)})`
      );
    }

    // Fetch challenges
    const allChallenges = await db
      .select()
      .from(challenges)
      .where(and(...conditions))
      .orderBy(challenges.id)
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    // If authenticated, fetch user's attempt statuses
    let userAttempts: { challengeId: string; status: string; qualityScore: string | null }[] = [];
    if (user?.id) {
      userAttempts = await db
        .select({
          challengeId: attempts.challengeId,
          status: attempts.status,
          qualityScore: attempts.qualityScore,
        })
        .from(attempts)
        .where(eq(attempts.userId, user.id));
    }

    // Build response with user status
    const challengeList = allChallenges.map(c => {
      const challengeAttempts = userAttempts.filter(a => a.challengeId === c.id);
      const completedAttempt = challengeAttempts.find(a => a.status === 'completed');
      const activeAttempt = challengeAttempts.find(a => a.status === 'in_progress');
      // 'failed' / 'evaluating' attempts don't lock the challenge — user can still retry
      let userStatus: string = 'available';
      if (completedAttempt) {
        userStatus = 'completed';
      } else if (activeAttempt) {
        userStatus = 'in_progress';
      }

      // Check prerequisites
      const prereqs = (c.prerequisites ?? []) as string[];
      const completedIds = userAttempts
        .filter(a => a.status === 'completed')
        .map(a => a.challengeId);
      const prerequisitesMet = prereqs.every(p => completedIds.includes(p));

      if (!prerequisitesMet && prereqs.length > 0) {
        userStatus = 'locked';
      }

      // Filter by status if requested
      if (query.status && userStatus !== query.status) return null;

      // Filter by tags if requested
      if (query.tags) {
        const requestedTags = query.tags.split(',');
        const challengeTags = (c.tags ?? []) as string[];
        if (!requestedTags.some(t => challengeTags.includes(t))) return null;
      }

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        tags: c.tags,
        difficulty: c.difficulty,
        timeMinutes: c.timeMinutes,
        pointsBase: c.pointsBase,
        evaluationMethod: c.evaluationMethod,
        antiCheatTier: c.antiCheatTier,
        prerequisites: c.prerequisites,
        producesAsset: c.producesAsset,
        userStatus,
        bestScore: completedAttempt?.qualityScore ? Number(completedAttempt.qualityScore) : null,
        prerequisitesMet,
      };
    }).filter(Boolean);

    return jsonResponse({ challenges: challengeList });
  } catch (error) {
    return handleApiError(error);
  }
}
