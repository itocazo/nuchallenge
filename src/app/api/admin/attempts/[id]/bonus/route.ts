/**
 * POST /api/admin/attempts/[id]/bonus
 *
 * Additive reviewer credit, distinct from PATCH (which REPLACES the score).
 * Use this when an admin or evaluator wants to award discretionary points
 * for something the auto-grader couldn't see — without rewriting the AI's
 * verdict.
 *
 *   kind='bonus'      → type='manual_bonus'      (positive credit only)
 *   kind='adjustment' → type='appeal_adjustment' (corrective, may be negative)
 */
import { NextRequest } from 'next/server';
import { db } from '@/db';
import { attempts, pointTransactions } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { adminAttemptBonusSchema } from '@/lib/validators/admin';
import {
  jsonResponse,
  errorResponse,
  handleApiError,
  requireEvaluator,
} from '@/lib/api-utils';
import { logAuditEvent } from '@/lib/services/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: actor, roles: actorRoles } = await requireEvaluator();
    const { id } = await params;
    const body = adminAttemptBonusSchema.parse(await req.json());

    if (body.kind === 'bonus' && body.amount < 0) {
      return errorResponse('Bonuses must be positive — use kind="adjustment" for negative credit', 400);
    }

    const [current] = await db
      .select()
      .from(attempts)
      .where(eq(attempts.id, id))
      .limit(1);

    if (!current) return errorResponse('Attempt not found', 404);
    if (current.status !== 'completed' && current.status !== 'failed') {
      return errorResponse('Can only award bonuses on completed or failed attempts', 400);
    }

    const txType = body.kind === 'bonus' ? 'manual_bonus' : 'appeal_adjustment';
    const descPrefix = body.kind === 'bonus' ? 'Reviewer bonus' : 'Reviewer adjustment';

    const [tx] = await db
      .insert(pointTransactions)
      .values({
        userId: current.userId,
        attemptId: id,
        amount: body.amount,
        type: txType,
        description: `${descPrefix}: ${body.reason}`,
        awardedByUserId: actor.id,
      })
      .returning();

    await db.execute(
      sql`UPDATE users SET points_total = points_total + ${body.amount}, updated_at = now() WHERE id = ${current.userId}`
    );

    await logAuditEvent({
      eventType: 'admin.attempt.bonus_awarded',
      actorId: actor.id,
      targetType: 'attempt',
      targetId: id,
      metadata: {
        amount: body.amount,
        kind: body.kind,
        txType,
        reason: body.reason,
        actorRoles,
      },
    });

    return jsonResponse({ transaction: tx });
  } catch (error) {
    return handleApiError(error);
  }
}
