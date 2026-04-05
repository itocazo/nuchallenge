import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users, attempts } from '@/db/schema';
import { eq, ilike, sql, and, isNotNull, isNull } from 'drizzle-orm';
import { adminUserListQuerySchema, adminCreateUserSchema } from '@/lib/validators/admin';
import { jsonResponse, handleApiError, requireAdmin } from '@/lib/api-utils';
import { logAuditEvent } from '@/lib/services/audit';
import { generatePassword, hashPassword } from '@/lib/services/password';
import { sendWelcomeEmail } from '@/lib/services/email';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = adminUserListQuerySchema.parse(params);

    const conditions = [];

    if (query.search) {
      conditions.push(
        sql`(${ilike(users.name, `%${query.search}%`)} OR ${ilike(users.email, `%${query.search}%`)})`
      );
    }

    if (query.role) {
      conditions.push(sql`${query.role} = ANY(${users.platformRole})`);
    }

    if (query.suspended === 'true') {
      conditions.push(isNotNull(users.suspendedAt));
    } else if (query.suspended === 'false') {
      conditions.push(isNull(users.suspendedAt));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [allUsers, countResult] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          department: users.department,
          title: users.title,
          platformRole: users.platformRole,
          level: users.level,
          pointsTotal: users.pointsTotal,
          suspendedAt: users.suspendedAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(users.createdAt)
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(where),
    ]);

    return jsonResponse({
      users: allUsers,
      total: Number(countResult[0]?.count ?? 0),
      page: query.page,
      limit: query.limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = adminCreateUserSchema.parse(await req.json());

    // Check for duplicate email
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (existing) {
      return jsonResponse({ error: 'A user with this email already exists' }, 409);
    }

    // Generate password and hash
    const password = generatePassword();
    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        department: body.department,
        title: body.title,
        platformRole: body.platformRole,
        passwordHash,
        level: 1,
        levelName: 'Novice',
        pointsTotal: 0,
        currentStreak: 0,
        longestStreak: 0,
        badges: [],
        interests: [],
      })
      .returning();

    // Send welcome email with credentials
    await sendWelcomeEmail({ to: body.email, name: body.name, password });

    await logAuditEvent({
      eventType: 'admin.user.created',
      actorId: admin.id,
      targetType: 'user',
      targetId: newUser.id,
      metadata: { email: body.email, roles: body.platformRole },
    });

    return jsonResponse({ user: newUser, passwordSent: true }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
