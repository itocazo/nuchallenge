import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users, attempts, pointTransactions, assets, auditLog } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { handleApiError, requireAdmin } from '@/lib/api-utils';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const [userAttempts, userTransactions, userAssets, userAudit] = await Promise.all([
      db.select().from(attempts).where(eq(attempts.userId, id)),
      db.select().from(pointTransactions).where(eq(pointTransactions.userId, id)),
      db.select().from(assets).where(eq(assets.userId, id)),
      db
        .select()
        .from(auditLog)
        .where(or(eq(auditLog.actorId, id), eq(auditLog.targetId, id))),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        title: user.title,
        level: user.level,
        pointsTotal: user.pointsTotal,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        badges: user.badges,
        interests: user.interests,
        createdAt: user.createdAt,
      },
      attempts: userAttempts,
      pointTransactions: userTransactions,
      assets: userAssets,
      auditEvents: userAudit,
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nuchallenge-export-${user.email}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
