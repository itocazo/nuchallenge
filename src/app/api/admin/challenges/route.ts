import { NextRequest } from 'next/server';
import { db } from '@/db';
import { challenges, attempts } from '@/db/schema';
import { eq, ilike, sql, and, desc } from 'drizzle-orm';
import { adminChallengeCreateSchema } from '@/lib/validators/admin';
import { jsonResponse, handleApiError, requireAdmin } from '@/lib/api-utils';
import { logAuditEvent } from '@/lib/services/audit';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const search = params.search;
    const difficulty = params.difficulty;
    const active = params.active;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));

    const conditions = [];

    if (search) {
      conditions.push(ilike(challenges.title, `%${search}%`));
    }
    if (difficulty) {
      conditions.push(eq(challenges.difficulty, difficulty as 'beginner' | 'intermediate' | 'advanced' | 'expert'));
    }
    if (active === 'true') {
      conditions.push(eq(challenges.active, true));
    } else if (active === 'false') {
      conditions.push(eq(challenges.active, false));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Get challenges with attempt stats
    const challengeStats = db
      .select({
        challengeId: attempts.challengeId,
        totalAttempts: sql<number>`count(*)`.as('total_attempts'),
        completedAttempts: sql<number>`count(*) filter (where ${attempts.status} = 'completed')`.as('completed_attempts'),
        avgScore: sql<number>`avg(${attempts.qualityScore}::numeric) filter (where ${attempts.qualityScore} is not null)`.as('avg_score'),
      })
      .from(attempts)
      .groupBy(attempts.challengeId)
      .as('stats');

    const [allChallenges, countResult] = await Promise.all([
      db
        .select({
          id: challenges.id,
          title: challenges.title,
          difficulty: challenges.difficulty,
          tags: challenges.tags,
          active: challenges.active,
          pointsBase: challenges.pointsBase,
          timeMinutes: challenges.timeMinutes,
          evaluationMethod: challenges.evaluationMethod,
          createdAt: challenges.createdAt,
          totalAttempts: challengeStats.totalAttempts,
          completedAttempts: challengeStats.completedAttempts,
          avgScore: challengeStats.avgScore,
        })
        .from(challenges)
        .leftJoin(challengeStats, eq(challenges.id, challengeStats.challengeId))
        .where(where)
        .orderBy(desc(challenges.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)` })
        .from(challenges)
        .where(where),
    ]);

    return jsonResponse({
      challenges: allChallenges,
      total: Number(countResult[0]?.count ?? 0),
      page,
      limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = adminChallengeCreateSchema.parse(await req.json());

    // Generate a slug-based ID
    const id = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);

    // Check for duplicate
    const [existing] = await db
      .select({ id: challenges.id })
      .from(challenges)
      .where(eq(challenges.id, id))
      .limit(1);

    if (existing) {
      return jsonResponse({ error: 'A challenge with this ID already exists' }, 409);
    }

    const [created] = await db
      .insert(challenges)
      .values({
        id,
        title: body.title,
        description: body.description,
        instructions: body.instructions,
        tags: body.tags,
        difficulty: body.difficulty,
        timeMinutes: body.timeMinutes,
        pointsBase: body.pointsBase,
        submissionFormat: body.submissionFormat,
        evaluationMethod: body.evaluationMethod,
        rubric: body.rubric,
        antiCheatTier: body.antiCheatTier,
        prerequisites: body.prerequisites,
        producesAsset: body.producesAsset,
        assetType: body.assetType,
        hints: body.hints,
        active: body.active,
      })
      .returning();

    await logAuditEvent({
      eventType: 'admin.challenge.created',
      actorId: admin.id,
      targetType: 'challenge',
      targetId: id,
      metadata: { title: body.title, difficulty: body.difficulty },
    });

    return jsonResponse({ challenge: created }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
