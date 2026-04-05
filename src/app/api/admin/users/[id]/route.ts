import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users, attempts, pointTransactions, auditLog } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { adminUpdateUserRoleSchema, adminToggleSuspendSchema } from '@/lib/validators/admin';
import { jsonResponse, errorResponse, handleApiError, requireAdmin } from '@/lib/api-utils';
import { logAuditEvent } from '@/lib/services/audit';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) return errorResponse('User not found', 404);

    const [userAttempts, userTransactions, userAudit] = await Promise.all([
      db
        .select()
        .from(attempts)
        .where(eq(attempts.userId, id))
        .orderBy(desc(attempts.createdAt))
        .limit(50),
      db
        .select()
        .from(pointTransactions)
        .where(eq(pointTransactions.userId, id))
        .orderBy(desc(pointTransactions.createdAt))
        .limit(50),
      db
        .select()
        .from(auditLog)
        .where(eq(auditLog.actorId, id))
        .orderBy(desc(auditLog.createdAt))
        .limit(50),
    ]);

    return jsonResponse({
      user,
      attempts: userAttempts,
      transactions: userTransactions,
      auditEvents: userAudit,
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
    const body = await req.json();

    // Determine which update to apply
    const roleResult = adminUpdateUserRoleSchema.safeParse(body);
    const suspendResult = adminToggleSuspendSchema.safeParse(body);

    if (roleResult.success) {
      const [updated] = await db
        .update(users)
        .set({ platformRole: roleResult.data.platformRole, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      if (!updated) return errorResponse('User not found', 404);

      await logAuditEvent({
        eventType: 'admin.user.role_changed',
        actorId: admin.id,
        targetType: 'user',
        targetId: id,
        metadata: { newRoles: roleResult.data.platformRole },
      });

      return jsonResponse({ user: updated });
    }

    if (suspendResult.success) {
      const suspendedAt = suspendResult.data.suspended ? new Date() : null;
      const [updated] = await db
        .update(users)
        .set({ suspendedAt, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      if (!updated) return errorResponse('User not found', 404);

      await logAuditEvent({
        eventType: suspendResult.data.suspended ? 'admin.user.suspended' : 'admin.user.reactivated',
        actorId: admin.id,
        targetType: 'user',
        targetId: id,
      });

      return jsonResponse({ user: updated });
    }

    return errorResponse('Invalid request body', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
