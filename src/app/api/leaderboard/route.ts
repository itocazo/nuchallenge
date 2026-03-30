import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users, attempts, challenges } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { jsonResponse, handleApiError, getAuthUser } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthUser();
    const view = req.nextUrl.searchParams.get('view') ?? 'overall';
    const limitParam = req.nextUrl.searchParams.get('limit') ?? '50';
    const limit = Math.min(parseInt(limitParam, 10) || 50, 100);

    // Fetch top users by points with challenge count
    const leaderboardRows = await db
      .select({
        id: users.id,
        name: users.name,
        department: users.department,
        level: users.level,
        pointsTotal: users.pointsTotal,
        currentStreak: users.currentStreak,
        challengesCompleted: sql<number>`(
          SELECT COUNT(DISTINCT ${attempts.challengeId})
          FROM ${attempts}
          WHERE ${attempts.userId} = ${users.id}
          AND ${attempts.status} = 'completed'
        )`.as('challenges_completed'),
      })
      .from(users)
      .orderBy(desc(users.pointsTotal))
      .limit(limit);

    const entries = leaderboardRows.map((row, i) => ({
      rank: i + 1,
      userId: row.id,
      name: row.name,
      department: row.department ?? '',
      level: row.level ?? 1,
      points: row.pointsTotal ?? 0,
      challengesCompleted: Number(row.challengesCompleted) || 0,
      streak: row.currentStreak ?? 0,
      isCurrentUser: currentUser?.id === row.id,
    }));

    // Find current user's rank if not in top N
    let currentUserRank: number | null = null;
    if (currentUser?.id) {
      const found = entries.find(e => e.isCurrentUser);
      if (found) {
        currentUserRank = found.rank;
      } else {
        // Count users with more points
        const [rankResult] = await db
          .select({
            rank: sql<number>`(
              SELECT COUNT(*) + 1 FROM ${users}
              WHERE ${users.pointsTotal} > (
                SELECT ${users.pointsTotal} FROM ${users}
                WHERE ${users.id} = ${currentUser.id}
              )
            )`.as('user_rank'),
          })
          .from(users)
          .where(eq(users.id, currentUser.id))
          .limit(1);

        currentUserRank = rankResult ? Number(rankResult.rank) : null;
      }
    }

    return jsonResponse({
      entries,
      currentUserRank,
      view,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
