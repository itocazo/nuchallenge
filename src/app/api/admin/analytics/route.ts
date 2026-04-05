import { db } from '@/db';
import { users, attempts, challenges, pointTransactions } from '@/db/schema';
import { sql, eq, gte } from 'drizzle-orm';
import { jsonResponse, handleApiError, requireAdmin } from '@/lib/api-utils';

export async function GET() {
  try {
    await requireAdmin();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      userStats,
      attemptStats,
      challengeStats,
      difficultyBreakdown,
      tagPopularity,
      topPerformers,
      recentCompletions,
    ] = await Promise.all([
      // User KPIs
      db
        .select({
          totalUsers: sql<number>`count(*)`,
          activeUsers30d: sql<number>`count(*) filter (where ${users.lastActivityDate}::timestamp >= ${thirtyDaysAgo})`,
          suspendedUsers: sql<number>`count(*) filter (where ${users.suspendedAt} is not null)`,
        })
        .from(users),

      // Attempt KPIs
      db
        .select({
          totalAttempts: sql<number>`count(*)`,
          completedAttempts: sql<number>`count(*) filter (where ${attempts.status} = 'completed')`,
          avgScore: sql<number>`avg(${attempts.qualityScore}::numeric) filter (where ${attempts.qualityScore} is not null)`,
          avgPointsAwarded: sql<number>`avg(${attempts.pointsAwarded}) filter (where ${attempts.pointsAwarded} is not null)`,
        })
        .from(attempts),

      // Challenge KPIs
      db
        .select({
          totalChallenges: sql<number>`count(*)`,
          activeChallenges: sql<number>`count(*) filter (where ${challenges.active} = true)`,
        })
        .from(challenges),

      // Completions by difficulty
      db
        .select({
          difficulty: challenges.difficulty,
          completed: sql<number>`count(*)`,
        })
        .from(attempts)
        .innerJoin(challenges, eq(attempts.challengeId, challenges.id))
        .where(eq(attempts.status, 'completed'))
        .groupBy(challenges.difficulty),

      // Tag popularity (across all challenges)
      db.execute(sql`
        SELECT tag, count(*) as challenge_count
        FROM challenges, unnest(tags) AS tag
        WHERE active = true
        GROUP BY tag
        ORDER BY challenge_count DESC
        LIMIT 10
      `),

      // Top 5 performers
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          pointsTotal: users.pointsTotal,
          level: users.level,
        })
        .from(users)
        .orderBy(sql`${users.pointsTotal} desc nulls last`)
        .limit(5),

      // Recent completions (last 10)
      db
        .select({
          attemptId: attempts.id,
          userName: users.name,
          challengeTitle: challenges.title,
          qualityScore: attempts.qualityScore,
          pointsAwarded: attempts.pointsAwarded,
          completedAt: attempts.completedAt,
        })
        .from(attempts)
        .innerJoin(users, eq(attempts.userId, users.id))
        .innerJoin(challenges, eq(attempts.challengeId, challenges.id))
        .where(eq(attempts.status, 'completed'))
        .orderBy(sql`${attempts.completedAt} desc nulls last`)
        .limit(10),
    ]);

    return jsonResponse({
      kpis: {
        totalUsers: Number(userStats[0]?.totalUsers ?? 0),
        activeUsers30d: Number(userStats[0]?.activeUsers30d ?? 0),
        suspendedUsers: Number(userStats[0]?.suspendedUsers ?? 0),
        totalChallenges: Number(challengeStats[0]?.totalChallenges ?? 0),
        activeChallenges: Number(challengeStats[0]?.activeChallenges ?? 0),
        totalAttempts: Number(attemptStats[0]?.totalAttempts ?? 0),
        completedAttempts: Number(attemptStats[0]?.completedAttempts ?? 0),
        avgScore: attemptStats[0]?.avgScore ? Math.round(Number(attemptStats[0].avgScore)) : null,
        avgPointsAwarded: attemptStats[0]?.avgPointsAwarded ? Math.round(Number(attemptStats[0].avgPointsAwarded)) : null,
      },
      charts: {
        completionsByDifficulty: difficultyBreakdown.map((d) => ({
          difficulty: d.difficulty,
          completed: Number(d.completed),
        })),
        tagPopularity: (tagPopularity.rows as { tag: string; challenge_count: number }[]).map((t) => ({
          tag: t.tag,
          count: Number(t.challenge_count),
        })),
      },
      topPerformers,
      recentCompletions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
