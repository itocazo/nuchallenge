import { NextRequest } from 'next/server';
import { db } from '@/db';
import { challenges, attempts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { jsonResponse, errorResponse, handleApiError, requireAuth } from '@/lib/api-utils';
import { logAuditEvent } from '@/lib/services/audit';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify challenge exists
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, id))
      .limit(1);

    if (!challenge) {
      return errorResponse('Challenge not found', 404);
    }

    // Check for existing in-progress attempt
    const [existingAttempt] = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.userId, user.id!),
          eq(attempts.challengeId, id),
          eq(attempts.status, 'in_progress')
        )
      )
      .limit(1);

    if (existingAttempt) {
      return jsonResponse({
        attemptId: existingAttempt.id,
        instructions: challenge.instructions,
        contextData: existingAttempt.contextData,
        draftText: existingAttempt.draftText,
        resumed: true,
      });
    }

    // Check attempt limit (max 3)
    const previousAttempts = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.userId, user.id!),
          eq(attempts.challengeId, id)
        )
      );

    if (previousAttempts.length >= 3) {
      return errorResponse('Maximum attempts reached for this challenge', 429);
    }

    // Check prerequisites
    const prereqs = (challenge.prerequisites ?? []) as string[];
    if (prereqs.length > 0) {
      const completedAttempts = await db
        .select()
        .from(attempts)
        .where(
          and(
            eq(attempts.userId, user.id!),
            eq(attempts.status, 'completed')
          )
        );
      const completedIds = completedAttempts.map(a => a.challengeId);
      const unmet = prereqs.filter(p => !completedIds.includes(p));
      if (unmet.length > 0) {
        return errorResponse(`Prerequisites not met: ${unmet.join(', ')}`, 403);
      }
    }

    // Create new attempt
    const [newAttempt] = await db
      .insert(attempts)
      .values({
        userId: user.id!,
        challengeId: id,
        attemptNumber: previousAttempts.length + 1,
        status: 'in_progress',
      })
      .returning();

    await logAuditEvent({
      eventType: 'challenge.started',
      actorId: user.id!,
      targetType: 'challenge',
      targetId: id,
      metadata: { attemptId: newAttempt.id, attemptNumber: newAttempt.attemptNumber },
    });

    return jsonResponse({
      attemptId: newAttempt.id,
      instructions: challenge.instructions,
      contextData: null,
      draftText: null,
      resumed: false,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
