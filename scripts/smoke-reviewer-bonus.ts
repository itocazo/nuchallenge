/**
 * Smoke: prove POST /api/admin/attempts/[id]/bonus writes a manual_bonus
 * row with reviewer attribution, and that /api/attempts/[id]/result returns
 * a reviewerEntries array with the reviewer's name.
 */
import { db } from '../src/db';
import { users, attempts, pointTransactions, auditLog } from '../src/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { encode } from 'next-auth/jwt';

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:3001';
const ADMIN_EMAIL = 'jardell@gmail.com';

function fail(m: string): never {
  console.error(`✗ ${m}`);
  process.exit(1);
}
function ok(m: string) {
  console.log(`✓ ${m}`);
}

async function mint(userId: string, email: string, name: string) {
  return `authjs.session-token=${await encode({
    token: { sub: userId, id: userId, email, name },
    secret: process.env.NEXTAUTH_SECRET!,
    salt: 'authjs.session-token',
  })}`;
}

async function main() {
  const [admin] = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
  if (!admin) fail('admin not found');

  const [target] = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.userId, admin.id), eq(attempts.status, 'completed')))
    .orderBy(desc(attempts.completedAt))
    .limit(1);
  if (!target) fail('no completed attempt for admin');

  const cookie = await mint(admin.id, admin.email, admin.name);
  const totalBefore = admin.pointsTotal ?? 0;

  // 1. POST a +5 manual_bonus
  const bonusRes = await fetch(`${BASE}/api/admin/attempts/${target.id}/bonus`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({
      amount: 5,
      reason: 'Elegant framing the auto-grader missed entirely',
      kind: 'bonus',
    }),
  });
  if (bonusRes.status !== 200) {
    const text = await bonusRes.text();
    fail(`POST bonus returned ${bonusRes.status}: ${text}`);
  }
  const bonusBody = await bonusRes.json();
  ok(`POST bonus -> 200 (tx ${bonusBody.transaction.id})`);

  // 2. Verify the row in DB
  const [tx] = await db
    .select()
    .from(pointTransactions)
    .where(eq(pointTransactions.id, bonusBody.transaction.id))
    .limit(1);
  if (!tx) fail('inserted tx not found in DB');
  if (tx.type !== 'manual_bonus') fail(`tx.type expected manual_bonus, got ${tx.type}`);
  if (tx.amount !== 5) fail(`tx.amount expected 5, got ${tx.amount}`);
  if (tx.awardedByUserId !== admin.id) fail(`awardedByUserId mismatch: ${tx.awardedByUserId}`);
  ok(`tx persisted: type=manual_bonus amount=5 awardedBy=${admin.id}`);

  // 3. user.pointsTotal should be +5
  const [adminAfter] = await db.select().from(users).where(eq(users.id, admin.id)).limit(1);
  if ((adminAfter.pointsTotal ?? 0) !== totalBefore + 5) {
    fail(`pointsTotal expected ${totalBefore + 5}, got ${adminAfter.pointsTotal}`);
  }
  ok(`pointsTotal: ${totalBefore} -> ${adminAfter.pointsTotal}`);

  // 4. /api/attempts/[id]/result should expose reviewerEntries with name
  const resultRes = await fetch(`${BASE}/api/attempts/${target.id}/result`, {
    headers: { cookie },
  });
  if (resultRes.status !== 200) fail(`result fetch returned ${resultRes.status}`);
  const resultBody = await resultRes.json();
  const entries = resultBody.scoreBreakdown?.reviewerEntries;
  if (!Array.isArray(entries)) fail('reviewerEntries missing from response');
  const ourEntry = entries.find((e: { id: string }) => e.id === tx.id);
  if (!ourEntry) fail(`our bonus entry not found in reviewerEntries`);
  if (ourEntry.kind !== 'bonus') fail(`entry.kind expected bonus, got ${ourEntry.kind}`);
  if (ourEntry.amount !== 5) fail(`entry.amount expected 5, got ${ourEntry.amount}`);
  if (ourEntry.reviewerName !== admin.name) {
    fail(`reviewerName expected ${admin.name}, got ${ourEntry.reviewerName}`);
  }
  if (ourEntry.reason !== 'Elegant framing the auto-grader missed entirely') {
    fail(`reason mismatch: "${ourEntry.reason}"`);
  }
  ok(`reviewerEntries[].reviewerName = "${ourEntry.reviewerName}" (prefix stripped)`);

  // 5. Ledger should still tie out
  const sb = resultBody.scoreBreakdown;
  if (sb.total !== sb.base + sb.qualityBonus + sb.speedBonus + sb.streakBonus + sb.humanAdjustment) {
    fail(`ledger does not tie out: ${JSON.stringify(sb)}`);
  }
  ok('ledger ties out');

  // 6. Validation: reason too short should 400
  const badRes = await fetch(`${BASE}/api/admin/attempts/${target.id}/bonus`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ amount: 1, reason: 'short', kind: 'bonus' }),
  });
  if (badRes.status === 200) fail('expected validation failure for short reason, got 200');
  ok(`short reason rejected with ${badRes.status}`);

  // 7. Validation: negative amount with kind=bonus should 400
  const negBonusRes = await fetch(`${BASE}/api/admin/attempts/${target.id}/bonus`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({
      amount: -5,
      reason: 'this should be an adjustment not a bonus',
      kind: 'bonus',
    }),
  });
  if (negBonusRes.status === 200) fail('expected 400 for negative bonus, got 200');
  ok(`negative bonus rejected with ${negBonusRes.status}`);

  // 8. kind='adjustment' with negative amount should succeed
  const adjRes = await fetch(`${BASE}/api/admin/attempts/${target.id}/bonus`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({
      amount: -2,
      reason: 'corrective deduction for fabricated metric',
      kind: 'adjustment',
    }),
  });
  if (adjRes.status !== 200) fail(`adjustment expected 200, got ${adjRes.status}`);
  const adjBody = await adjRes.json();
  ok(`negative adjustment accepted (tx ${adjBody.transaction.id})`);

  // 9. Cleanup
  await db.delete(pointTransactions).where(eq(pointTransactions.id, tx.id));
  await db.delete(pointTransactions).where(eq(pointTransactions.id, adjBody.transaction.id));
  await db.update(users).set({ pointsTotal: totalBefore }).where(eq(users.id, admin.id));
  // Delete audit rows for this attempt that we created
  const auditRows = await db
    .select()
    .from(auditLog)
    .where(and(eq(auditLog.targetType, 'attempt'), eq(auditLog.targetId, target.id)))
    .orderBy(desc(auditLog.createdAt))
    .limit(2);
  for (const row of auditRows) {
    if (row.eventType === 'admin.attempt.bonus_awarded') {
      await db.delete(auditLog).where(eq(auditLog.id, row.id));
    }
  }
  ok('reverted');

  console.log('\n✓✓✓ reviewer-bonus smoke passed');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
