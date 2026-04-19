import { db } from '../src/db';
import { users, pointTransactions } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const [u] = await db.select().from(users).where(eq(users.email, 'jardell@gmail.com')).limit(1);
  if (!u) { console.log('user not found'); return; }
  console.log('Before: pointsTotal=', u.pointsTotal);

  // Sum remaining point_transactions for this user
  const [row] = await db
    .select({ sum: sql<string>`COALESCE(SUM(${pointTransactions.amount}), 0)` })
    .from(pointTransactions)
    .where(eq(pointTransactions.userId, u.id));
  const trueSum = Number(row?.sum ?? 0);
  console.log('Real sum of point_transactions:', trueSum);

  await db.update(users).set({ pointsTotal: trueSum }).where(eq(users.id, u.id));

  const [after] = await db.select().from(users).where(eq(users.id, u.id)).limit(1);
  console.log('After: pointsTotal=', after.pointsTotal);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
