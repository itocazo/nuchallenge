import { NextRequest } from 'next/server';
import { db } from '@/db';
import { auditLog, users } from '@/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { adminAuditLogQuerySchema } from '@/lib/validators/admin';
import { jsonResponse, handleApiError, requireAdmin } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = adminAuditLogQuerySchema.parse(params);

    const conditions = [];

    if (query.eventType) {
      conditions.push(eq(auditLog.eventType, query.eventType));
    }
    if (query.actorId) {
      conditions.push(eq(auditLog.actorId, query.actorId));
    }
    if (query.dateFrom) {
      conditions.push(gte(auditLog.createdAt, new Date(query.dateFrom)));
    }
    if (query.dateTo) {
      conditions.push(lte(auditLog.createdAt, new Date(query.dateTo)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [events, countResult] = await Promise.all([
      db
        .select({
          id: auditLog.id,
          eventType: auditLog.eventType,
          actorId: auditLog.actorId,
          actorName: users.name,
          actorEmail: users.email,
          targetType: auditLog.targetType,
          targetId: auditLog.targetId,
          metadata: auditLog.metadata,
          createdAt: auditLog.createdAt,
        })
        .from(auditLog)
        .leftJoin(users, eq(auditLog.actorId, users.id))
        .where(where)
        .orderBy(desc(auditLog.createdAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      db
        .select({ count: sql<number>`count(*)` })
        .from(auditLog)
        .where(where),
    ]);

    return jsonResponse({
      events,
      total: Number(countResult[0]?.count ?? 0),
      page: query.page,
      limit: query.limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
