import { NextRequest } from 'next/server';
import { db } from '@/db';
import { attempts, users, challenges } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { adminAttemptListQuerySchema } from '@/lib/validators/admin';
import { jsonResponse, handleApiError, requireAdmin } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = adminAttemptListQuerySchema.parse(params);

    const conditions = [];

    if (query.userId) {
      conditions.push(eq(attempts.userId, query.userId));
    }
    if (query.challengeId) {
      conditions.push(eq(attempts.challengeId, query.challengeId));
    }
    if (query.status) {
      conditions.push(eq(attempts.status, query.status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [allAttempts, countResult] = await Promise.all([
      db
        .select({
          id: attempts.id,
          userId: attempts.userId,
          userName: users.name,
          userEmail: users.email,
          challengeId: attempts.challengeId,
          challengeTitle: challenges.title,
          status: attempts.status,
          qualityScore: attempts.qualityScore,
          pointsAwarded: attempts.pointsAwarded,
          submittedAt: attempts.submittedAt,
          completedAt: attempts.completedAt,
          createdAt: attempts.createdAt,
        })
        .from(attempts)
        .leftJoin(users, eq(attempts.userId, users.id))
        .leftJoin(challenges, eq(attempts.challengeId, challenges.id))
        .where(where)
        .orderBy(desc(attempts.createdAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      db
        .select({ count: sql<number>`count(*)` })
        .from(attempts)
        .where(where),
    ]);

    return jsonResponse({
      attempts: allAttempts,
      total: Number(countResult[0]?.count ?? 0),
      page: query.page,
      limit: query.limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
