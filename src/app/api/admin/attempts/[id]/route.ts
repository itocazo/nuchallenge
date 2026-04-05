import { NextRequest } from 'next/server';
import { db } from '@/db';
import { attempts, users, challenges, pointTransactions } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { adminScoreOverrideSchema } from '@/lib/validators/admin';
import { jsonResponse, errorResponse, handleApiError, requireAdmin } from '@/lib/api-utils';
import { logAuditEvent } from '@/lib/services/audit';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [attempt] = await db
      .select({
        id: attempts.id,
        userId: attempts.userId,
        userName: users.name,
        userEmail: users.email,
        challengeId: attempts.challengeId,
        challengeTitle: challenges.title,
        attemptNumber: attempts.attemptNumber,
        status: attempts.status,
        startedAt: attempts.startedAt,
        submittedAt: attempts.submittedAt,
        completedAt: attempts.completedAt,
        submissionText: attempts.submissionText,
        submissionUrl: attempts.submissionUrl,
        evaluationResult: attempts.evaluationResult,
        evaluatorType: attempts.evaluatorType,
        qualityScore: attempts.qualityScore,
        pointsAwarded: attempts.pointsAwarded,
        appealStatus: attempts.appealStatus,
        appealText: attempts.appealText,
        createdAt: attempts.createdAt,
      })
      .from(attempts)
      .leftJoin(users, eq(attempts.userId, users.id))
      .leftJoin(challenges, eq(attempts.challengeId, challenges.id))
      .where(eq(attempts.id, id))
      .limit(1);

    if (!attempt) return errorResponse('Attempt not found', 404);

    // Get point transactions for this attempt
    const transactions = await db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.attemptId, id))
      .orderBy(desc(pointTransactions.createdAt));

    return jsonResponse({ attempt, transactions });
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
    const body = adminScoreOverrideSchema.parse(await req.json());

    // Get the current attempt
    const [current] = await db
      .select()
      .from(attempts)
      .where(eq(attempts.id, id))
      .limit(1);

    if (!current) return errorResponse('Attempt not found', 404);
    if (current.status !== 'completed' && current.status !== 'failed') {
      return errorResponse('Can only override score on completed or failed attempts', 400);
    }

    const oldPoints = current.pointsAwarded ?? 0;
    const pointsDiff = body.pointsAwarded - oldPoints;

    // Update attempt
    const [updated] = await db
      .update(attempts)
      .set({
        qualityScore: String(body.qualityScore),
        pointsAwarded: body.pointsAwarded,
        status: 'completed',
      })
      .where(eq(attempts.id, id))
      .returning();

    // Create adjustment transaction if points changed
    if (pointsDiff !== 0) {
      await db.insert(pointTransactions).values({
        userId: current.userId,
        attemptId: id,
        amount: pointsDiff,
        type: 'appeal_adjustment',
        description: `Admin score override: ${body.reason}`,
      });

      // Update user total points
      await db.execute(
        sql`UPDATE users SET points_total = points_total + ${pointsDiff}, updated_at = now() WHERE id = ${current.userId}`
      );
    }

    await logAuditEvent({
      eventType: 'admin.attempt.score_override',
      actorId: admin.id,
      targetType: 'attempt',
      targetId: id,
      metadata: {
        oldScore: current.qualityScore,
        newScore: body.qualityScore,
        oldPoints,
        newPoints: body.pointsAwarded,
        reason: body.reason,
      },
    });

    return jsonResponse({ attempt: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
