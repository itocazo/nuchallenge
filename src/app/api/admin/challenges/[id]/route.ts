import { NextRequest } from 'next/server';
import { db } from '@/db';
import { challenges, attempts } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { adminChallengeUpdateSchema } from '@/lib/validators/admin';
import { jsonResponse, errorResponse, handleApiError, requireAdmin } from '@/lib/api-utils';
import { logAuditEvent } from '@/lib/services/audit';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, id))
      .limit(1);

    if (!challenge) return errorResponse('Challenge not found', 404);

    // Get attempt stats
    const [stats] = await db
      .select({
        totalAttempts: sql<number>`count(*)`,
        completedAttempts: sql<number>`count(*) filter (where ${attempts.status} = 'completed')`,
        failedAttempts: sql<number>`count(*) filter (where ${attempts.status} = 'failed')`,
        avgScore: sql<number>`avg(${attempts.qualityScore}::numeric) filter (where ${attempts.qualityScore} is not null)`,
        avgPoints: sql<number>`avg(${attempts.pointsAwarded}) filter (where ${attempts.pointsAwarded} is not null)`,
      })
      .from(attempts)
      .where(eq(attempts.challengeId, id));

    return jsonResponse({
      challenge,
      stats: {
        totalAttempts: Number(stats?.totalAttempts ?? 0),
        completedAttempts: Number(stats?.completedAttempts ?? 0),
        failedAttempts: Number(stats?.failedAttempts ?? 0),
        completionRate: stats?.totalAttempts
          ? Math.round((Number(stats.completedAttempts) / Number(stats.totalAttempts)) * 100)
          : 0,
        avgScore: stats?.avgScore ? Math.round(Number(stats.avgScore)) : null,
        avgPoints: stats?.avgPoints ? Math.round(Number(stats.avgPoints)) : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = adminChallengeUpdateSchema.parse(await req.json());

    const [updated] = await db
      .update(challenges)
      .set(body)
      .where(eq(challenges.id, id))
      .returning();

    if (!updated) return errorResponse('Challenge not found', 404);

    // Determine audit event type
    const eventType = 'active' in body && Object.keys(body).length === 1
      ? 'admin.challenge.toggled' as const
      : 'admin.challenge.updated' as const;

    await logAuditEvent({
      eventType,
      actorId: admin.id,
      targetType: 'challenge',
      targetId: id,
      metadata: body,
    });

    return jsonResponse({ challenge: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
