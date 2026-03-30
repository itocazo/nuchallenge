import { NextRequest } from 'next/server';
import { db } from '@/db';
import { attempts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { submitChallengeSchema } from '@/lib/validators/challenges';
import { jsonResponse, errorResponse, handleApiError, requireAuth } from '@/lib/api-utils';
import { logAuditEvent } from '@/lib/services/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = submitChallengeSchema.parse(await req.json());

    // Verify attempt belongs to user and is in progress
    const [attempt] = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.id, body.attemptId),
          eq(attempts.userId, user.id!),
          eq(attempts.challengeId, id),
          eq(attempts.status, 'in_progress')
        )
      )
      .limit(1);

    if (!attempt) {
      return errorResponse('Active attempt not found', 404);
    }

    // Update attempt status to submitted
    await db
      .update(attempts)
      .set({
        status: 'evaluating',
        submissionText: body.submissionText,
        submittedAt: new Date(),
      })
      .where(eq(attempts.id, body.attemptId));

    await logAuditEvent({
      eventType: 'challenge.submitted',
      actorId: user.id!,
      targetType: 'attempt',
      targetId: body.attemptId,
      metadata: { challengeId: id, textLength: body.submissionText?.length ?? 0 },
    });

    // TODO: Trigger Inngest evaluation job
    // await inngest.send({
    //   name: 'submission/created',
    //   data: { attemptId: body.attemptId, challengeId: id, submissionText: body.submissionText },
    // });

    return jsonResponse({
      attemptId: body.attemptId,
      status: 'evaluating',
      estimatedWaitSeconds: 15,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
