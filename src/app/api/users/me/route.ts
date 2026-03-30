import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users, attempts, challenges } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { updateProfileSchema } from '@/lib/validators/users';
import { jsonResponse, handleApiError, requireAuth } from '@/lib/api-utils';
import { logAuditEvent } from '@/lib/services/audit';

export async function GET() {
  try {
    const sessionUser = await requireAuth();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, sessionUser.id!))
      .limit(1);

    if (!user) {
      return jsonResponse({ error: 'User not found' }, 404);
    }

    // Get challenge stats
    const userAttempts = await db
      .select({
        challengeId: attempts.challengeId,
        status: attempts.status,
        qualityScore: attempts.qualityScore,
        difficulty: challenges.difficulty,
        tags: challenges.tags,
      })
      .from(attempts)
      .innerJoin(challenges, eq(attempts.challengeId, challenges.id))
      .where(eq(attempts.userId, user.id));

    const completed = userAttempts.filter(a => a.status === 'completed');
    const inProgress = userAttempts.filter(a => a.status === 'in_progress');

    // Calculate tag affinity
    const tagMap = new Map<string, { completed: number; total: number; scores: number[] }>();
    for (const attempt of userAttempts) {
      const tags = (attempt.tags ?? []) as string[];
      for (const tag of tags) {
        const existing = tagMap.get(tag) ?? { completed: 0, total: 0, scores: [] };
        existing.total++;
        if (attempt.status === 'completed') {
          existing.completed++;
          if (attempt.qualityScore) {
            existing.scores.push(Number(attempt.qualityScore));
          }
        }
        tagMap.set(tag, existing);
      }
    }

    const tagAffinity = Array.from(tagMap.entries()).map(([tag, data]) => ({
      tag,
      completed: data.completed,
      total: data.total,
      avgScore: data.scores.length > 0
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0,
    }));

    // Difficulty breakdown
    const byDifficulty: Record<string, number> = {};
    for (const a of completed) {
      byDifficulty[a.difficulty] = (byDifficulty[a.difficulty] ?? 0) + 1;
    }

    return jsonResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      department: user.department,
      title: user.title,
      level: user.level,
      levelName: user.levelName,
      pointsTotal: user.pointsTotal,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      badges: user.badges,
      interests: user.interests,
      challengeStats: {
        total: 50,
        completed: completed.length,
        inProgress: inProgress.length,
        byDifficulty,
      },
      tagAffinity,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await requireAuth();
    const body = updateProfileSchema.parse(await req.json());

    const [updated] = await db
      .update(users)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(users.id, sessionUser.id!))
      .returning();

    await logAuditEvent({
      eventType: 'user.profile_updated',
      actorId: sessionUser.id!,
      targetType: 'user',
      targetId: sessionUser.id!,
      metadata: { fields: Object.keys(body) },
    });

    return jsonResponse({ user: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
