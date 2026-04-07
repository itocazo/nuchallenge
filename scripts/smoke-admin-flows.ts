/**
 * End-to-end smoke test for admin flows.
 *
 * Verifies (against the local dev server + DB):
 *   1. PATCH /api/admin/attempts/[id]   — score override creates an
 *      appeal_adjustment transaction with the correct delta and updates
 *      users.pointsTotal.
 *   2. PATCH /api/admin/users/[id]      — role add/remove writes platformRole
 *      and emits an audit event.
 *
 * Auth strategy: rather than juggle CSRF + cookies via NextAuth's web flow,
 * we mint a real JWT directly with the same secret the server uses, then
 * send it as the Authorization-equivalent session cookie.
 *
 * Run with:
 *   DATABASE_URL=... NEXTAUTH_SECRET=... npx tsx scripts/smoke-admin-flows.ts
 */
import { db } from '../src/db';
import { users, attempts, pointTransactions, auditLog, challenges } from '../src/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { encode } from 'next-auth/jwt';

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:3001';
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? 'jardell@gmail.com';

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function ok(msg: string) {
  console.log(`✓ ${msg}`);
}

async function mintSessionCookie(userId: string, email: string, name: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) fail('NEXTAUTH_SECRET not set');
  // Match the auth.ts session shape: token has { id, email, name }
  const token = await encode({
    token: { sub: userId, id: userId, email, name },
    secret: secret!,
    salt: 'authjs.session-token',
  });
  return `authjs.session-token=${token}`;
}

async function main() {
  // 1. Find the admin user
  const [admin] = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);
  if (!admin) fail(`admin user ${ADMIN_EMAIL} not found`);
  if (!admin.platformRole?.includes('admin')) fail(`${ADMIN_EMAIL} is not an admin`);
  ok(`admin found: ${admin.id} (${admin.platformRole?.join(',')})`);

  const cookie = await mintSessionCookie(admin.id, admin.email, admin.name);
  ok(`session cookie minted (${cookie.length} chars)`);

  // Smoke A: hit a guarded admin endpoint to verify auth round-trips
  const meRes = await fetch(`${BASE}/api/users/me`, {
    headers: { cookie },
  });
  if (meRes.status !== 200) fail(`/api/users/me returned ${meRes.status} (expected 200)`);
  const meBody = await meRes.json();
  if (meBody.email !== admin.email) fail(`/api/users/me returned wrong user: ${meBody.email}`);
  ok(`session round-trip works: /api/users/me -> ${meBody.email}`);

  // 2. Find a completed attempt to override. Prefer the most recent one.
  const [recent] = await db
    .select()
    .from(attempts)
    .where(eq(attempts.status, 'completed'))
    .orderBy(desc(attempts.completedAt))
    .limit(1);
  if (!recent) fail('no completed attempts to override');
  ok(`target attempt: ${recent.id} status=${recent.status} score=${recent.qualityScore} pts=${recent.pointsAwarded}`);

  // 3. Snapshot user totals + transaction count BEFORE
  const [targetUserBefore] = await db.select().from(users).where(eq(users.id, recent.userId)).limit(1);
  const txsBefore = await db.select().from(pointTransactions).where(eq(pointTransactions.attemptId, recent.id));
  const totalBefore = targetUserBefore.pointsTotal ?? 0;
  ok(`before: target user pointsTotal=${totalBefore}, attempt has ${txsBefore.length} transactions`);

  // 4. Hit PATCH /api/admin/attempts/[id] with a score override
  const oldPoints = recent.pointsAwarded ?? 0;
  const newPoints = oldPoints + 7; // additive delta to verify diff math
  const newScore = Math.min(100, Math.round(Number(recent.qualityScore ?? '0')) + 1);
  const overrideRes = await fetch(`${BASE}/api/admin/attempts/${recent.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({
      qualityScore: newScore,
      pointsAwarded: newPoints,
      reason: 'smoke test: verifying admin override flow end-to-end',
    }),
  });
  if (overrideRes.status !== 200) {
    const text = await overrideRes.text();
    fail(`PATCH attempt returned ${overrideRes.status}: ${text}`);
  }
  ok(`PATCH /api/admin/attempts/${recent.id} -> 200`);

  // 5. Re-read DB and verify diff math + new transaction + audit log
  const [targetUserAfter] = await db.select().from(users).where(eq(users.id, recent.userId)).limit(1);
  const totalAfter = targetUserAfter.pointsTotal ?? 0;
  if (totalAfter !== totalBefore + 7) {
    fail(`pointsTotal expected ${totalBefore + 7}, got ${totalAfter}`);
  }
  ok(`pointsTotal updated: ${totalBefore} -> ${totalAfter} (delta +7)`);

  const txsAfter = await db.select().from(pointTransactions).where(eq(pointTransactions.attemptId, recent.id));
  if (txsAfter.length !== txsBefore.length + 1) {
    fail(`expected ${txsBefore.length + 1} transactions, got ${txsAfter.length}`);
  }
  const newTx = txsAfter.find((t) => !txsBefore.find((b) => b.id === t.id));
  if (!newTx) fail('could not find new transaction');
  if (newTx.amount !== 7) fail(`new tx amount expected 7, got ${newTx.amount}`);
  if (newTx.type !== 'appeal_adjustment') fail(`new tx type expected appeal_adjustment, got ${newTx.type}`);
  ok(`new transaction: type=${newTx.type} amount=${newTx.amount} desc="${newTx.description}"`);

  const [auditRow] = await db
    .select()
    .from(auditLog)
    .where(and(eq(auditLog.targetType, 'attempt'), eq(auditLog.targetId, recent.id)))
    .orderBy(desc(auditLog.createdAt))
    .limit(1);
  if (!auditRow || auditRow.eventType !== 'admin.attempt.score_override') {
    fail(`expected admin.attempt.score_override audit event, got ${auditRow?.eventType ?? 'none'}`);
  }
  ok(`audit event recorded: ${auditRow.eventType} by ${auditRow.actorId}`);

  // 6. Revert the test attempt back to its original state
  await db
    .update(attempts)
    .set({
      qualityScore: recent.qualityScore,
      pointsAwarded: oldPoints,
    })
    .where(eq(attempts.id, recent.id));
  await db.delete(pointTransactions).where(eq(pointTransactions.id, newTx.id));
  await db
    .update(users)
    .set({ pointsTotal: totalBefore })
    .where(eq(users.id, recent.userId));
  await db.delete(auditLog).where(eq(auditLog.id, auditRow.id));
  ok(`reverted test changes`);

  // ── Test 2: role add/remove ────────────────────────────────────────
  // Find a non-admin test user (any user that is NOT the admin running the test)
  const candidates = await db.select().from(users).limit(20);
  const target = candidates.find((u) => u.id !== admin.id);
  if (!target) fail('no other user to test role toggle on');
  ok(`role-test target: ${target.email} current=[${target.platformRole?.join(',')}]`);

  const originalRoles = target.platformRole ?? [];
  const hasEvaluator = originalRoles.includes('evaluator');
  const nextRoles = hasEvaluator
    ? originalRoles.filter((r) => r !== 'evaluator')
    : [...originalRoles, 'evaluator'];

  const roleRes = await fetch(`${BASE}/api/admin/users/${target.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ platformRole: nextRoles }),
  });
  if (roleRes.status !== 200) {
    const text = await roleRes.text();
    fail(`PATCH user returned ${roleRes.status}: ${text}`);
  }
  ok(`PATCH /api/admin/users/${target.id} -> 200`);

  const [targetAfter] = await db.select().from(users).where(eq(users.id, target.id)).limit(1);
  const sameSet = (a: string[], b: string[]) =>
    a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
  if (!sameSet(targetAfter.platformRole ?? [], nextRoles)) {
    fail(`role mismatch: expected [${nextRoles.join(',')}], got [${targetAfter.platformRole?.join(',')}]`);
  }
  ok(`role updated: [${originalRoles.join(',')}] -> [${targetAfter.platformRole?.join(',')}]`);

  const [roleAudit] = await db
    .select()
    .from(auditLog)
    .where(and(eq(auditLog.targetType, 'user'), eq(auditLog.targetId, target.id)))
    .orderBy(desc(auditLog.createdAt))
    .limit(1);
  if (!roleAudit || roleAudit.eventType !== 'admin.user.role_changed') {
    fail(`expected admin.user.role_changed audit, got ${roleAudit?.eventType ?? 'none'}`);
  }
  ok(`audit event: ${roleAudit.eventType}`);

  // Revert
  await db
    .update(users)
    .set({ platformRole: originalRoles })
    .where(eq(users.id, target.id));
  await db.delete(auditLog).where(eq(auditLog.id, roleAudit.id));
  ok(`reverted role changes`);

  // ── Test 3: evaluator role grants attempt-review access ───────────
  // Promote a non-admin to evaluator, mint their session, hit the
  // attempt routes, then revert.
  const promoteTarget = candidates.find(
    (u) => u.id !== admin.id && !u.platformRole?.includes('admin')
  );
  if (!promoteTarget) fail('no non-admin user to promote');
  const originalEvalRoles = promoteTarget.platformRole ?? [];
  await db
    .update(users)
    .set({ platformRole: [...originalEvalRoles, 'evaluator'] })
    .where(eq(users.id, promoteTarget.id));

  const evalCookie = await mintSessionCookie(
    promoteTarget.id,
    promoteTarget.email,
    promoteTarget.name
  );
  ok(`promoted ${promoteTarget.email} to evaluator and minted session`);

  // Evaluator should be able to LIST attempts
  const listRes = await fetch(`${BASE}/api/admin/attempts?limit=5`, {
    headers: { cookie: evalCookie },
  });
  if (listRes.status !== 200) {
    const text = await listRes.text();
    fail(`evaluator GET /api/admin/attempts returned ${listRes.status}: ${text}`);
  }
  ok(`evaluator can list attempts (200)`);

  // Evaluator should be able to GET attempt detail
  const detailRes = await fetch(`${BASE}/api/admin/attempts/${recent.id}`, {
    headers: { cookie: evalCookie },
  });
  if (detailRes.status !== 200) fail(`evaluator GET attempt detail returned ${detailRes.status}`);
  ok(`evaluator can read attempt detail (200)`);

  // Evaluator should be able to PATCH (override) and the audit should
  // record actorRoles=['evaluator', ...].
  const evalOverrideRes = await fetch(`${BASE}/api/admin/attempts/${recent.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', cookie: evalCookie },
    body: JSON.stringify({
      qualityScore: Math.round(Number(recent.qualityScore ?? '0')),
      pointsAwarded: (recent.pointsAwarded ?? 0) + 3,
      reason: 'smoke: evaluator-side override',
    }),
  });
  if (evalOverrideRes.status !== 200) {
    const text = await evalOverrideRes.text();
    fail(`evaluator PATCH attempt returned ${evalOverrideRes.status}: ${text}`);
  }
  ok(`evaluator can override score (200)`);

  // Verify the audit row records the evaluator as actor and includes
  // actorRoles in metadata
  const [evalAudit] = await db
    .select()
    .from(auditLog)
    .where(and(eq(auditLog.targetType, 'attempt'), eq(auditLog.targetId, recent.id)))
    .orderBy(desc(auditLog.createdAt))
    .limit(1);
  if (!evalAudit || evalAudit.actorId !== promoteTarget.id) {
    fail(`evaluator audit actor mismatch: ${evalAudit?.actorId ?? 'none'}`);
  }
  const meta = evalAudit.metadata as { actorRoles?: string[] } | null;
  if (!meta?.actorRoles?.includes('evaluator')) {
    fail(`evaluator audit metadata missing actorRoles=evaluator: ${JSON.stringify(meta)}`);
  }
  ok(`audit records evaluator actor with roles=[${meta.actorRoles.join(',')}]`);

  // A non-evaluator non-admin user must be REJECTED with 403
  const peasant = candidates.find(
    (u) =>
      u.id !== admin.id &&
      u.id !== promoteTarget.id &&
      !u.platformRole?.includes('admin') &&
      !u.platformRole?.includes('evaluator')
  );
  if (peasant) {
    const peasantCookie = await mintSessionCookie(peasant.id, peasant.email, peasant.name);
    const rejectRes = await fetch(`${BASE}/api/admin/attempts/${recent.id}`, {
      headers: { cookie: peasantCookie },
    });
    if (rejectRes.status !== 403) {
      fail(`non-evaluator GET attempt expected 403, got ${rejectRes.status}`);
    }
    ok(`non-evaluator correctly rejected with 403`);
  } else {
    console.log('  (skipped 403 check — no non-admin non-evaluator user found)');
  }

  // Revert all eval-test changes
  await db
    .update(users)
    .set({ platformRole: originalEvalRoles })
    .where(eq(users.id, promoteTarget.id));
  // Revert the +3 from the evaluator override
  const evalTxs = await db
    .select()
    .from(pointTransactions)
    .where(eq(pointTransactions.attemptId, recent.id));
  const evalNewTx = evalTxs.find(
    (t) =>
      t.type === 'appeal_adjustment' &&
      t.amount === 3 &&
      t.description?.includes('smoke: evaluator-side override')
  );
  if (evalNewTx) {
    await db.delete(pointTransactions).where(eq(pointTransactions.id, evalNewTx.id));
    await db
      .update(users)
      .set({ pointsTotal: targetUserBefore.pointsTotal ?? 0 })
      .where(eq(users.id, recent.userId));
  }
  await db
    .update(attempts)
    .set({ pointsAwarded: oldPoints, qualityScore: recent.qualityScore })
    .where(eq(attempts.id, recent.id));
  await db.delete(auditLog).where(eq(auditLog.id, evalAudit.id));
  ok(`reverted evaluator-test changes`);

  console.log('\n✓✓✓ all admin + evaluator smoke tests passed');
  // Suppress unused-import warning
  void challenges;
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
