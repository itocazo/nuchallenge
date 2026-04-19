import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../src/db/schema';

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
  const [admin] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, 'jardell@gmail.com'))
    .limit(1);
  if (!admin) throw new Error('admin not found');

  const target = await db
    .select()
    .from(schema.attempts)
    .where(and(eq(schema.attempts.userId, admin.id), eq(schema.attempts.challengeId, 'CH-01')));
  console.log(`Found ${target.length} CH-01 attempts for admin`);

  if (target.length === 0) return;
  const ids = target.map((a) => a.id);
  // Delete point_transactions tied to these attempts
  for (const id of ids) {
    await db.delete(schema.pointTransactions).where(eq(schema.pointTransactions.attemptId, id));
  }
  // Delete attempts
  for (const id of ids) {
    await db.delete(schema.attempts).where(eq(schema.attempts.id, id));
  }

  // Recompute user's pointsTotal
  const [{ total }] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.pointTransactions.amount}), 0)` })
    .from(schema.pointTransactions)
    .where(eq(schema.pointTransactions.userId, admin.id));
  await db
    .update(schema.users)
    .set({ pointsTotal: Number(total ?? 0), updatedAt: new Date() })
    .where(eq(schema.users.id, admin.id));
  console.log(`Deleted ${ids.length} attempts. Admin pointsTotal now ${Number(total ?? 0)}`);
}
main().catch(console.error);
