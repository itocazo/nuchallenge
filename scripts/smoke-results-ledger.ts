/**
 * Smoke: prove the user-facing results card receives a real
 * humanAdjustment from /api/attempts/[id]/result after an override.
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

  const adminCookie = await mint(admin.id, admin.email, admin.name);
  const oldPts = target.pointsAwarded ?? 0;
  const totalBefore = admin.pointsTotal ?? 0;

  // 1. Apply an override of +13 with a reviewer-style reason
  const overrideRes = await fetch(`${BASE}/api/admin/attempts/${target.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({
      qualityScore: Math.round(Number(target.qualityScore ?? '0')),
      pointsAwarded: oldPts + 13,
      reason: 'Novel framing the auto-grader missed',
    }),
  });
  if (overrideRes.status !== 200) fail(`override failed: ${overrideRes.status}`);
  ok('applied +13 override with reviewer reason');

  // 2. Hit the user-facing results endpoint
  const resultRes = await fetch(`${BASE}/api/attempts/${target.id}/result`, {
    headers: { cookie: adminCookie },
  });
  if (resultRes.status !== 200) fail(`result fetch failed: ${resultRes.status}`);
  const body = await resultRes.json();

  if (!body.scoreBreakdown) fail('scoreBreakdown missing from response');
  ok(`scoreBreakdown returned: ${JSON.stringify(body.scoreBreakdown)}`);

  if (body.scoreBreakdown.humanAdjustment !== 13) {
    fail(`humanAdjustment expected 13, got ${body.scoreBreakdown.humanAdjustment}`);
  }
  ok(`humanAdjustment = +13`);

  if (body.scoreBreakdown.humanAdjustmentReason !== 'Novel framing the auto-grader missed') {
    fail(
      `humanAdjustmentReason expected stripped reason, got "${body.scoreBreakdown.humanAdjustmentReason}"`
    );
  }
  ok(`humanAdjustmentReason = "${body.scoreBreakdown.humanAdjustmentReason}" (prefix stripped)`);

  if (
    body.scoreBreakdown.total !==
    body.scoreBreakdown.base +
      body.scoreBreakdown.qualityBonus +
      body.scoreBreakdown.speedBonus +
      body.scoreBreakdown.streakBonus +
      body.scoreBreakdown.humanAdjustment
  ) {
    fail(`ledger does not tie out: ${JSON.stringify(body.scoreBreakdown)}`);
  }
  ok(`ledger ties out: total = base + bonuses + adjustment`);

  if (body.pointsAwarded !== oldPts) {
    // pointsAwarded on attempts is the auto-eval result, not including
    // adjustments — the adjustments live in transactions only. That's
    // expected, we just note it.
    ok(`note: attempts.pointsAwarded=${body.pointsAwarded} unchanged (adjustments live in tx ledger)`);
  }

  // 3. Revert
  const txs = await db
    .select()
    .from(pointTransactions)
    .where(eq(pointTransactions.attemptId, target.id));
  const adj = txs.find(
    (t) => t.type === 'appeal_adjustment' && t.amount === 13
  );
  if (adj) await db.delete(pointTransactions).where(eq(pointTransactions.id, adj.id));
  await db
    .update(attempts)
    .set({ pointsAwarded: oldPts, qualityScore: target.qualityScore })
    .where(eq(attempts.id, target.id));
  await db.update(users).set({ pointsTotal: totalBefore }).where(eq(users.id, admin.id));
  const [lastAudit] = await db
    .select()
    .from(auditLog)
    .where(and(eq(auditLog.targetType, 'attempt'), eq(auditLog.targetId, target.id)))
    .orderBy(desc(auditLog.createdAt))
    .limit(1);
  if (lastAudit) await db.delete(auditLog).where(eq(auditLog.id, lastAudit.id));
  ok('reverted');

  console.log('\n✓✓✓ result-ledger smoke passed');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
