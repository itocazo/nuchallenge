/**
 * Real UI smoke test for the 19 auto-graded challenges (CH-01, CH-02, CH-04,
 * CH-06, CH-07, CH-09, CH-10, CH-12, CH-13, CH-17, CH-19, CH-20, CH-21, CH-22,
 * CH-23, CH-24, CH-28, CH-29, CH-30).
 *
 * Hits the running dev server's HTTP API end-to-end:
 *   1. POST /api/challenges/:id/start  → creates an attempt
 *   2. POST /api/challenges/:id/submit → triggers inline evaluation
 *   3. read attempts row from DB     → verifies the persisted score
 *
 * Auth: mints a real next-auth JWT for a demo user (same trick used by
 * smoke-admin-flows.ts) so we don't have to juggle CSRF + the credentials
 * provider's web flow.
 *
 * Prereqs:
 *   - Dev server running on http://localhost:3001 (configurable via SMOKE_BASE)
 *   - DATABASE_URL + NEXTAUTH_SECRET in env
 *   - DB seeded with the 30 challenges (run `npx tsx src/db/seed.ts` first)
 *
 * Run with:
 *   set -a && source .env.local && set +a && npx tsx scripts/smoke-ui-19.ts
 */
import { db } from '../src/db';
import { users, attempts, pointTransactions } from '../src/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { encode } from 'next-auth/jwt';

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:3001';
const SMOKE_USER_EMAIL = process.env.SMOKE_USER_EMAIL ?? 'camila@nubank.com';

let passed = 0;
let failed = 0;

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
  passed++;
}
function fail(msg: string) {
  console.log(`  ✗ ${msg}`);
  failed++;
}

interface SmokeCase {
  id: string;
  submission: string;
  minScore: number;
}

const CASES: SmokeCase[] = [
  {
    id: 'CH-04',
    submission: JSON.stringify([
      'The founding year 1999 is wrong — Nubank was founded in 2013.',
      'Buenos Aires / Mexico City is wrong — Nubank is headquartered in São Paulo, Brazil.',
      'The London Stock Exchange claim is wrong — Nubank IPO\'d on the NYSE (New York) under ticker NU.',
      'PostgreSQL is wrong — the ledger database is actually Apache Cassandra.',
      'The Argentina expansion is fabricated — Nubank does not operate in Argentina.',
    ]),
    minScore: 100,
  },
  {
    id: 'CH-06',
    submission: JSON.stringify({
      entities: ['customer', 'account', 'transaction', 'card', 'notification'],
      customerPiiFields: ['cpf', 'name', 'email', 'phone', 'birth_date'],
      accountTypeEnum: ['checking', 'savings'],
      transactionTypeEnum: ['credit', 'debit', 'pix', 'transfer'],
      cardTypeEnum: ['virtual', 'physical'],
      nullableForeignKeys: ['transaction.card_id'],
      oneToManyRelations: [
        'customer->account',
        'account->transaction',
        'account->card',
        'customer->notification',
      ],
    }),
    minScore: 100,
  },
  {
    id: 'CH-10',
    submission: `function normalizeBrPhone(input) {
  if (typeof input !== 'string') return null;
  const digits = input.replace(/\\D/g, '');
  if (!digits) return null;
  let local = digits;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    local = digits.slice(2);
  }
  if (local.length !== 10 && local.length !== 11) return null;
  const ddd = parseInt(local.slice(0, 2), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) return null;
  if (local.length === 11 && local[2] !== '9') return null;
  return '+55' + local;
}`,
    minScore: 100,
  },
  {
    id: 'CH-12',
    submission: `function runTests(validator) {
  const cases = [
    { input: '52998224725', expected: true },
    { input: '45317828791', expected: true },
    { input: '00000000000', expected: false },
    { input: '11111111111', expected: false },
    { input: '12345678900', expected: false },
    { input: '', expected: false },
    { input: 'abc', expected: false },
    { input: '5299822472', expected: false },
    { input: '529.982.247-25', expected: true },
  ];
  let passed = 0, failed = 0;
  for (const c of cases) {
    let actual;
    try { actual = validator(c.input); } catch { actual = null; }
    if (actual === c.expected) passed++; else failed++;
  }
  return { total: cases.length, passed, failed };
}`,
    minScore: 100,
  },
  {
    id: 'CH-09',
    submission:
      '/^[^\\n]+\\[ERROR\\][^\\n]*ip=(?!10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.)\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/',
    minScore: 90,
  },
  {
    id: 'CH-07',
    submission: JSON.stringify([
      'The ledger uses Cassandra (DataStax), not PostgreSQL — Nubank is famous for its Cassandra-based ledger',
      'Berlin is wrong — Nubank does not have a Berlin engineering hub; Mexico City is one of their major hubs',
      'Mastercard is not the sole network — Nubank also issues Visa cards on multiple networks',
      'There is no biometric mandate above R$200 — that requirement is fabricated',
    ]),
    minScore: 90,
  },
  {
    id: 'CH-13',
    submission: `function formatBRL(value) {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value).toFixed(2);
  const [intPart, decPart] = abs.split('.');
  const withSeparators = intPart.replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
  return sign + 'R$ ' + withSeparators + ',' + decPart;
}`,
    minScore: 100,
  },
  {
    id: 'CH-19',
    submission: `function classifyPixKey(key) {
  if (typeof key !== 'string' || key.length === 0) return 'invalid';
  if (/^\\d{11}$/.test(key)) return 'cpf';
  if (/^\\d{14}$/.test(key)) return 'cnpj';
  if (/^\\+55\\d{10,11}$/.test(key)) return 'phone';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(key)) return 'random';
  if (/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(key)) return 'email';
  return 'invalid';
}`,
    minScore: 100,
  },
  {
    id: 'CH-20',
    submission: JSON.stringify({
      answers: {
        q1: 'vulnerable',
        q2: 'safe',
        q3: 'safe',
        q4: 'vulnerable',
        q5: 'vulnerable',
        q6: ['parameterized-queries', 'allowlist-identifiers'],
      },
    }),
    minScore: 100,
  },
  {
    id: 'CH-21',
    submission: JSON.stringify({
      method: 'post',
      path: '/v1/rewards/redeem',
      operationId: 'redeemReward',
      security: ['bearerAuth'],
      requestBodyRequired: ['rewardId', 'idempotencyKey'],
      responseStatuses: ['200', '400', '401', '409'],
      successFields: ['transactionId', 'pointsSpent'],
    }),
    minScore: 100,
  },
  {
    id: 'CH-22',
    submission: JSON.stringify({
      participants: ['user', 'client', 'authServer', 'resourceServer'],
      step1: { from: 'user', to: 'client' },
      step2: { from: 'client', to: 'authServer', label: 'authorization_request' },
      step3: { from: 'authServer', to: 'client', label: 'authorization_code' },
      step4: { from: 'client', to: 'authServer', label: 'token_request' },
      step5: { from: 'authServer', to: 'client', label: 'access_token' },
      step6: { from: 'client', to: 'resourceServer', label: 'access_token' },
    }),
    minScore: 100,
  },
  {
    id: 'CH-23',
    submission: `function aggregateTransactions(csv) {
  const lines = csv.split('\\n').filter(l => l.trim().length > 0);
  if (lines.length <= 1) return {};
  const totals = {};
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(';');
    const category = parts[2];
    const amount = parseFloat(parts[3].replace(',', '.'));
    totals[category] = (totals[category] || 0) + amount;
  }
  for (const k of Object.keys(totals)) {
    totals[k] = Math.round(totals[k] * 100) / 100;
  }
  return totals;
}`,
    minScore: 100,
  },
  {
    id: 'CH-28',
    submission: `function isValidCPF(cpf) {
  const digits = String(cpf || '').replace(/\\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\\d)\\1{10}$/.test(digits)) return false;
  function calc(len) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(digits[i], 10) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  }
  return calc(9) === parseInt(digits[9], 10) && calc(10) === parseInt(digits[10], 10);
}`,
    minScore: 100,
  },
  {
    id: 'CH-29',
    submission: JSON.stringify({
      answers: {
        q1: 'vulnerable',
        q2: 'safe',
        q3: 'vulnerable',
        q4: 'safe',
        q5: 'vulnerable',
        q6: ['structured-roles', 'output-encoding', 'least-privilege-tools', 'input-validation'],
      },
    }),
    minScore: 100,
  },
  {
    id: 'CH-30',
    submission: `function createRateLimiter(capacity, refillPerSec) {
  let tokens = capacity;
  let lastNowMs = null;
  return {
    tryAcquire(nowMs) {
      if (lastNowMs !== null) {
        const elapsedSec = (nowMs - lastNowMs) / 1000;
        tokens = Math.min(capacity, tokens + elapsedSec * refillPerSec);
      }
      lastNowMs = nowMs;
      if (tokens >= 1) { tokens -= 1; return true; }
      return false;
    }
  };
}`,
    minScore: 100,
  },
  {
    id: 'CH-01',
    submission: JSON.stringify([
      'The problem statement is vague — no 12 notifications/day baseline, no 68% dismissal number.',
      'No user stories in As-a / I-want / so-that format — just a feature list.',
      'The "users feel happy" metric is not measurable — needs a numeric KPI.',
      'Scope creep: SMS fallback, admin dashboard, and the SNS migration do not belong here.',
      'No explicit out-of-scope / boundary section — readers cannot tell what is excluded.',
    ]),
    minScore: 90,
  },
  {
    id: 'CH-02',
    submission: JSON.stringify({
      answers: {
        q1: 't',
        q2: 's',
        q3: 'n',
        q4: 'i',
        q5: 'v',
        q6: 'e',
        q7: 't',
      },
    }),
    minScore: 100,
  },
  {
    id: 'CH-17',
    submission: JSON.stringify({
      answers: { q1: 'b', q2: 'b', q3: 'b', q4: 'c', q5: 'b', q6: 'b' },
    }),
    minScore: 100,
  },
  {
    id: 'CH-24',
    submission: `function createIdempotencyStore() {
  const cache = new Map();
  function canonical(obj) {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return '[' + obj.map(canonical).join(',') + ']';
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canonical(obj[k])).join(',') + '}';
  }
  return {
    handle(key, body, compute) {
      const bodyKey = canonical(body);
      const entry = cache.get(key);
      if (entry) {
        if (entry.bodyKey === bodyKey) return entry.response;
        return { error: 'idempotency_key_conflict' };
      }
      const response = compute();
      cache.set(key, { bodyKey: bodyKey, response: response });
      return response;
    }
  };
}`,
    minScore: 100,
  },
];

async function mintSessionCookie(userId: string, email: string, name: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET not set');
  const token = await encode({
    token: { sub: userId, id: userId, email, name },
    secret,
    salt: 'authjs.session-token',
  });
  return `authjs.session-token=${token}`;
}

async function clearAttemptsFor(userId: string, challengeIds: string[]) {
  // FK: point_transactions.attempt_id → attempts.id, so cascade by hand.
  const rows = await db
    .select({ id: attempts.id })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        inArray(attempts.challengeId, challengeIds)
      )
    );
  if (rows.length === 0) return;
  const attemptIds = rows.map((r) => r.id);
  await db
    .delete(pointTransactions)
    .where(inArray(pointTransactions.attemptId, attemptIds));
  await db.delete(attempts).where(inArray(attempts.id, attemptIds));
}

async function runOne(c: SmokeCase, cookie: string, userId: string) {
  // Clear prior attempts (and their point_transactions) for this user+challenge
  // so the smoke can rerun cleanly without hitting the 3-attempt cap.
  await clearAttemptsFor(userId, [c.id]);

  const startRes = await fetch(`${BASE}/api/challenges/${c.id}/start`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
  });
  if (!startRes.ok) {
    fail(`${c.id}: start returned ${startRes.status} ${await startRes.text()}`);
    return;
  }
  const { attemptId } = await startRes.json();
  if (!attemptId) {
    fail(`${c.id}: start did not return attemptId`);
    return;
  }

  const submitRes = await fetch(`${BASE}/api/challenges/${c.id}/submit`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ attemptId, submissionText: c.submission }),
  });
  if (!submitRes.ok) {
    const txt = await submitRes.text();
    fail(`${c.id}: submit returned ${submitRes.status} ${txt.slice(0, 200)}`);
    return;
  }

  // Read persisted attempt to get the real score (submit returns evaluating)
  const [persisted] = await db
    .select()
    .from(attempts)
    .where(eq(attempts.id, attemptId))
    .limit(1);
  if (!persisted) {
    fail(`${c.id}: attempt ${attemptId} not found post-submit`);
    return;
  }
  const q = Number(persisted.qualityScore ?? 0);
  if (q >= c.minScore) {
    ok(
      `${c.id} status=${persisted.status} score=${q} pts=${persisted.pointsAwarded} evaluator=${persisted.evaluatorType}`
    );
  } else {
    fail(
      `${c.id} status=${persisted.status} score=${q} (< ${c.minScore}) result=${JSON.stringify(persisted.evaluationResult).slice(0, 200)}`
    );
  }
}

async function main() {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, SMOKE_USER_EMAIL))
    .limit(1);
  if (!user) {
    console.error(`smoke user ${SMOKE_USER_EMAIL} not found`);
    process.exit(1);
  }
  console.log(`smoke user: ${user.email} (${user.id})`);

  // Wipe ALL attempts (and their point_transactions) for the smoke user
  // up front so reruns are clean.
  await clearAttemptsFor(user.id, CASES.map((c) => c.id));

  const cookie = await mintSessionCookie(user.id, user.email, user.name);

  console.log(`\nrunning ${CASES.length} cases against ${BASE}\n`);
  for (const c of CASES) {
    await runOne(c, cookie, user.id);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
