/**
 * End-to-end smoke test for auto-graded challenges.
 *
 * Loads the three Wave 1 challenges from SEED_CHALLENGES, runs the
 * dispatcher against representative submissions, and verifies the scoring.
 *
 * Run with: npx tsx src/lib/services/evaluation/__e2e_smoke_test__.ts
 *
 * No DB, no Claude — pure in-process smoke test for the auto-grader path.
 */

import { SEED_CHALLENGES } from '../../data';
import { dispatchEvaluation } from './dispatch';
import { runAutoGrader, toEvaluationOutput } from './auto-graders';
import type { ChallengeGraderConfig } from '../../types';

let passed = 0;
let failed = 0;

/**
 * Runs only the auto-grader portion of a challenge — bypasses the dispatcher
 * so hybrid challenges can be smoke-tested without an Anthropic API key.
 * The dispatcher's hybrid blending logic is already covered by its own path
 * once an API key is present.
 */
async function runAutoOnly(
  id: string,
  submission: string,
  expectScoreMin: number,
  expectScoreMax: number
) {
  const challenge = SEED_CHALLENGES.find((c) => c.id === id);
  if (!challenge) {
    failed++;
    console.log(`  ✗ ${id}: not found in SEED_CHALLENGES`);
    return;
  }
  if (!challenge.rubric.grader) {
    failed++;
    console.log(`  ✗ ${id}: no grader config`);
    return;
  }
  try {
    const raw = runAutoGrader(submission, challenge.rubric.grader);
    const out = toEvaluationOutput(raw, challenge.rubric.criteria);
    const ok =
      out.overallScore >= expectScoreMin && out.overallScore <= expectScoreMax;
    if (ok) {
      passed++;
      console.log(
        `  ✓ ${id} auto-score=${out.overallScore} (expected ${expectScoreMin}-${expectScoreMax})`
      );
    } else {
      failed++;
      console.log(
        `  ✗ ${id} auto-score=${out.overallScore} expected ${expectScoreMin}-${expectScoreMax}`
      );
      console.log(`    feedback: ${out.feedback.slice(0, 200)}`);
    }
  } catch (e) {
    failed++;
    console.log(`  ✗ ${id} threw: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function runChallenge(
  id: string,
  submission: string,
  expectScoreMin: number,
  expectScoreMax: number
) {
  const challenge = SEED_CHALLENGES.find((c) => c.id === id);
  if (!challenge) {
    failed++;
    console.log(`  ✗ ${id}: not found in SEED_CHALLENGES`);
    return;
  }
  try {
    const result = await dispatchEvaluation({
      challengeTitle: challenge.title,
      challengeDescription: challenge.description,
      instructions: challenge.instructions,
      submissionText: submission,
      rubric: challenge.rubric as {
        criteria: { name: string; weight: number; description: string }[];
        grader?: ChallengeGraderConfig;
      },
      difficulty: challenge.difficulty,
      evaluationMethod: challenge.evaluationMethod,
    });
    const ok =
      result.overallScore >= expectScoreMin &&
      result.overallScore <= expectScoreMax;
    if (ok) {
      passed++;
      console.log(
        `  ✓ ${id} score=${result.overallScore} (expected ${expectScoreMin}-${expectScoreMax}) evaluator=${result.meta?.evaluator}`
      );
    } else {
      failed++;
      console.log(
        `  ✗ ${id} score=${result.overallScore} expected ${expectScoreMin}-${expectScoreMax}`
      );
      console.log(`    feedback: ${result.feedback.slice(0, 200)}`);
    }
  } catch (e) {
    failed++;
    console.log(`  ✗ ${id} threw: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function main() {
  console.log('\n[CH-09 — Log Anomaly Regex]');
  // Correct answer: ERROR level + non-private IP, using [^\n]* instead of .*
  await runChallenge(
    'CH-09',
    '/^[^\\n]+\\[ERROR\\][^\\n]*ip=(?!10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.)\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/',
    100,
    100
  );
  // Lazy wildcard answer (should score low — matches everything AND penalized)
  await runChallenge('CH-09', '/.*/', 0, 50);
  // Bad answer: only checks ERROR (matches private-IP errors too)
  await runChallenge('CH-09', '/\\[ERROR\\]/', 30, 80);

  console.log('\n[CH-07 — Spot the Hallucination — Structured]');
  // Strong answer: hits all 4 keywords
  await runChallenge(
    'CH-07',
    JSON.stringify([
      'The ledger uses Cassandra (DataStax), not PostgreSQL — Nubank is famous for its Cassandra-based ledger',
      'Berlin is wrong — Nubank does not have a Berlin engineering hub; Mexico City is one of their major hubs',
      'Mastercard is not the sole network — Nubank also issues Visa cards on multiple networks',
      'There is no biometric mandate above R$200 — that requirement is fabricated',
    ]),
    90,
    100
  );
  // Empty list
  await runChallenge('CH-07', '[]', 0, 10);
  // Junk
  await runChallenge('CH-07', 'not json', 0, 0);

  console.log('\n[CH-13 — BRL Currency Formatter]');
  // Correct implementation
  const correctImpl = `
function formatBRL(value) {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value).toFixed(2);
  const [intPart, decPart] = abs.split('.');
  const withSeparators = intPart.replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
  return sign + 'R$ ' + withSeparators + ',' + decPart;
}
`;
  await runChallenge('CH-13', correctImpl, 100, 100);

  // Broken impl: forgets thousands separator
  const brokenImpl = `
function formatBRL(value) {
  const sign = value < 0 ? '-' : '';
  return sign + 'R$ ' + Math.abs(value).toFixed(2).replace('.', ',');
}
`;
  await runChallenge('CH-13', brokenImpl, 20, 70);

  // Forbidden token
  const cheating = `
function formatBRL(value) {
  return process.env.SECRET;
}
`;
  await runChallenge('CH-13', cheating, 0, 0);

  console.log('\n[CH-19 — Pix Key Validator]');
  // Correct implementation covering all Pix key types
  const pixCorrect = `
function classifyPixKey(key) {
  if (typeof key !== 'string' || key.length === 0) return 'invalid';
  if (/^\\d{11}$/.test(key)) return 'cpf';
  if (/^\\d{14}$/.test(key)) return 'cnpj';
  if (/^\\+55\\d{10,11}$/.test(key)) return 'phone';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(key)) return 'random';
  if (/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(key)) return 'email';
  return 'invalid';
}
`;
  await runChallenge('CH-19', pixCorrect, 100, 100);

  // Naive impl: misses the UUID v4 version check + phone +55 prefix
  const pixNaive = `
function classifyPixKey(key) {
  if (/^\\d{11}$/.test(key)) return 'cpf';
  if (/^\\d{14}$/.test(key)) return 'cnpj';
  if (key.includes('@')) return 'email';
  if (key.length === 36) return 'random';
  return 'invalid';
}
`;
  await runChallenge('CH-19', pixNaive, 30, 85);

  // Broken: always returns 'cpf'
  const pixBroken = `
function classifyPixKey(key) {
  return 'cpf';
}
`;
  await runChallenge('CH-19', pixBroken, 0, 20);

  console.log('\n[CH-20 — SQL Injection Triage]');
  // All correct answers
  await runChallenge(
    'CH-20',
    JSON.stringify({
      answers: {
        q1: 'vulnerable',
        q2: 'safe',
        q3: 'safe',
        q4: 'vulnerable',
        q5: 'vulnerable',
        q6: ['parameterized-queries', 'allowlist-identifiers'],
      },
    }),
    100,
    100
  );
  // Case-insensitive single-select
  await runChallenge(
    'CH-20',
    JSON.stringify({
      answers: {
        q1: 'VULNERABLE',
        q2: 'SAFE',
        q3: 'safe',
        q4: 'vulnerable',
        q5: 'vulnerable',
        q6: ['allowlist-identifiers', 'parameterized-queries'], // reverse order
      },
    }),
    100,
    100
  );
  // All wrong
  await runChallenge(
    'CH-20',
    JSON.stringify({
      answers: {
        q1: 'safe',
        q2: 'vulnerable',
        q3: 'vulnerable',
        q4: 'safe',
        q5: 'safe',
        q6: ['escape-quotes'],
      },
    }),
    0,
    5
  );
  // Mixed: 3 right on snippets, q6 wrong → (3/5)*70 + 0 = 42
  await runChallenge(
    'CH-20',
    JSON.stringify({
      answers: {
        q1: 'vulnerable',
        q2: 'safe',
        q3: 'safe',
        q4: 'safe',
        q5: 'safe',
        q6: ['escape-quotes'],
      },
    }),
    30,
    60
  );

  console.log('\n[CH-21 — OpenAPI Contract Designer]');
  // All correct
  await runChallenge(
    'CH-21',
    JSON.stringify({
      method: 'post',
      path: '/v1/rewards/redeem',
      operationId: 'redeemReward',
      security: ['bearerAuth'],
      requestBodyRequired: ['rewardId', 'idempotencyKey'],
      responseStatuses: ['200', '400', '401', '409'],
      successFields: ['transactionId', 'pointsSpent'],
    }),
    100,
    100
  );
  // Missing 401 + wrong operationId
  await runChallenge(
    'CH-21',
    JSON.stringify({
      method: 'post',
      path: '/v1/rewards/redeem',
      operationId: 'postRedeem',
      security: ['bearerAuth'],
      requestBodyRequired: ['rewardId', 'idempotencyKey'],
      responseStatuses: ['200', '400', '409'],
      successFields: ['transactionId', 'pointsSpent'],
    }),
    60,
    80
  );
  // Empty submission
  await runChallenge('CH-21', '{}', 0, 5);

  console.log('\n[CH-22 — OAuth Sequence Diagram]');
  // All correct
  await runChallenge(
    'CH-22',
    JSON.stringify({
      participants: ['user', 'client', 'authServer', 'resourceServer'],
      step1: { from: 'user', to: 'client' },
      step2: { from: 'client', to: 'authServer', label: 'authorization_request' },
      step3: { from: 'authServer', to: 'client', label: 'authorization_code' },
      step4: { from: 'client', to: 'authServer', label: 'token_request' },
      step5: { from: 'authServer', to: 'client', label: 'access_token' },
      step6: { from: 'client', to: 'resourceServer', label: 'access_token' },
    }),
    100,
    100
  );
  // Swap the auth_code and token_request steps (two steps wrong)
  await runChallenge(
    'CH-22',
    JSON.stringify({
      participants: ['user', 'client', 'authServer', 'resourceServer'],
      step1: { from: 'user', to: 'client' },
      step2: { from: 'client', to: 'authServer', label: 'authorization_request' },
      step3: { from: 'authServer', to: 'client', label: 'token_request' }, // wrong label
      step4: { from: 'client', to: 'authServer', label: 'authorization_code' }, // wrong label
      step5: { from: 'authServer', to: 'client', label: 'access_token' },
      step6: { from: 'client', to: 'resourceServer', label: 'access_token' },
    }),
    50,
    85
  );
  // Missing resourceServer in participants
  await runChallenge(
    'CH-22',
    JSON.stringify({
      participants: ['user', 'client', 'authServer'],
    }),
    0,
    20
  );
  // Empty object
  await runChallenge('CH-22', '{}', 0, 5);

  console.log('\n[CH-23 — Transaction CSV Aggregator]');
  const csvCorrect = `
function aggregateTransactions(csv) {
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
}
`;
  await runChallenge('CH-23', csvCorrect, 100, 100);

  // Broken: forgets to replace comma with dot
  const csvBroken = `
function aggregateTransactions(csv) {
  const lines = csv.split('\\n').filter(l => l.trim().length > 0);
  if (lines.length <= 1) return {};
  const totals = {};
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(';');
    const category = parts[2];
    const amount = parseFloat(parts[3]); // missing .replace
    totals[category] = (totals[category] || 0) + amount;
  }
  return totals;
}
`;
  await runChallenge('CH-23', csvBroken, 0, 60);

  // Forbidden token attempt
  const csvCheating = `
function aggregateTransactions(csv) {
  return process.env.CATEGORIES;
}
`;
  await runChallenge('CH-23', csvCheating, 0, 0);

  console.log('\n[CH-24 — Idempotency Key Middleware]');
  const idempCorrect = `
function createIdempotencyStore() {
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
}
`;
  await runChallenge('CH-24', idempCorrect, 100, 100);

  // Broken: doesn't check body equality (always returns cached if key exists)
  const idempBroken = `
function createIdempotencyStore() {
  const cache = new Map();
  return {
    handle(key, body, compute) {
      if (cache.has(key)) return cache.get(key);
      const r = compute();
      cache.set(key, r);
      return r;
    }
  };
}
`;
  await runChallenge('CH-24', idempBroken, 30, 85);

  // Broken: re-runs compute every time
  const idempAlwaysRun = `
function createIdempotencyStore() {
  return {
    handle(key, body, compute) {
      return compute();
    }
  };
}
`;
  await runChallenge('CH-24', idempAlwaysRun, 10, 60);

  console.log('\n[CH-25 — Refactor Spaghetti Code (hybrid, auto portion)]');
  const refactorCorrect = `
const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.97;

function discountedAmount(amount) {
  return amount > DISCOUNT_THRESHOLD ? amount * DISCOUNT_RATE : amount;
}

function summarizeOrders(orders) {
  const byStatus = { paid: 0, cancelled: 0, failed: 0 };
  let revenue = 0;
  for (const order of orders) {
    if (order.status === 'paid') {
      byStatus.paid += 1;
      revenue += discountedAmount(order.amount);
    } else if (order.status === 'cancelled') {
      byStatus.cancelled += 1;
    } else if (order.status === 'failed') {
      byStatus.failed += 1;
    }
  }
  return {
    totalRevenue: Math.round(revenue * 100) / 100,
    byStatus,
    count: orders.length,
  };
}
`;
  await runAutoOnly('CH-25', refactorCorrect, 100, 100);

  // Broken refactor: forgets discount on amounts > 100
  const refactorBroken = `
function summarizeOrders(orders) {
  const byStatus = { paid: 0, cancelled: 0, failed: 0 };
  let revenue = 0;
  for (const order of orders) {
    if (order.status === 'paid') { byStatus.paid += 1; revenue += order.amount; }
    else if (order.status === 'cancelled') { byStatus.cancelled += 1; }
    else if (order.status === 'failed') { byStatus.failed += 1; }
  }
  return { totalRevenue: Math.round(revenue * 100) / 100, byStatus, count: orders.length };
}
`;
  await runAutoOnly('CH-25', refactorBroken, 30, 80);

  // Forbidden token cheat
  await runAutoOnly(
    'CH-25',
    `function summarizeOrders(o) { return process.env.X; }`,
    0,
    0
  );

  console.log('\n[CH-26 — Optimize a Slow Function (hybrid, auto portion)]');
  // Linear-time correct
  const dupLinear = `
// Replaced O(n^2) nested loops with a single Set pass — O(n) time, O(n) space.
function findDuplicates(arr) {
  const seen = new Set();
  const dupes = new Set();
  for (const v of arr) {
    if (seen.has(v)) dupes.add(v);
    else seen.add(v);
  }
  return Array.from(dupes);
}
`;
  await runAutoOnly('CH-26', dupLinear, 100, 100);

  // Quadratic — should fail the perf test (TLE) but pass correctness
  const dupQuadratic = `
function findDuplicates(arr) {
  const dupes = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !dupes.includes(arr[i])) {
        dupes.push(arr[i]);
      }
    }
  }
  return dupes;
}
`;
  // Expect: 6/7 pass (correctness OK, perf test exceeds budget) → ~85
  await runAutoOnly('CH-26', dupQuadratic, 70, 90);

  // Wrong: returns [1, 1, 1] for [1, 1, 1] (no dedup)
  const dupNoDedup = `
function findDuplicates(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) out.push(arr[i]);
    }
  }
  return out;
}
`;
  await runAutoOnly('CH-26', dupNoDedup, 0, 90);

  console.log('\n[CH-27 — AI Code Review Checklist (hybrid, auto portion)]');
  // All required fields correct
  await runAutoOnly(
    'CH-27',
    JSON.stringify({
      issuesFound: ['sql-injection', 'missing-input-validation', 'missing-auth', 'no-error-handling', 'no-idempotency'],
      severity: 'critical',
      categories: ['security', 'validation', 'reliability'],
      recommendations: 'Use parameterized queries, validate amount and card token, require auth, wrap the provider call in try/catch, and key on an idempotency header.',
    }),
    100,
    100
  );

  // Reordered arrays still correct (order-insensitive)
  await runAutoOnly(
    'CH-27',
    JSON.stringify({
      issuesFound: ['no-idempotency', 'sql-injection', 'no-error-handling', 'missing-auth', 'missing-input-validation'],
      severity: 'critical',
      categories: ['reliability', 'security', 'validation'],
      recommendations: 'reordered',
    }),
    100,
    100
  );

  // Missing one issue + wrong severity → 1/3 fields correct
  await runAutoOnly(
    'CH-27',
    JSON.stringify({
      issuesFound: ['sql-injection', 'missing-auth', 'no-error-handling', 'no-idempotency'],
      severity: 'high',
      categories: ['security', 'validation', 'reliability'],
    }),
    20,
    50
  );

  // Empty
  await runAutoOnly('CH-27', '{}', 0, 5);

  console.log('\n[CH-28 — CPF Validator]');
  const cpfCorrect = `
function isValidCPF(cpf) {
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
}
`;
  await runChallenge('CH-28', cpfCorrect, 100, 100);

  // Broken: skips the all-same check (so 11111111111 would pass the math)
  const cpfNoAllSame = `
function isValidCPF(cpf) {
  const digits = String(cpf || '').replace(/\\D/g, '');
  if (digits.length !== 11) return false;
  function calc(len) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(digits[i], 10) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  }
  return calc(9) === parseInt(digits[9], 10) && calc(10) === parseInt(digits[10], 10);
}
`;
  // 11/12 pass — fails only the all-same hidden test (both 1s and 0s share that bug)
  await runChallenge('CH-28', cpfNoAllSame, 70, 95);

  // Broken: always returns true
  await runChallenge(
    'CH-28',
    `function isValidCPF(cpf) { return true; }`,
    20,
    60
  );

  console.log('\n[CH-29 — Prompt Injection Triage]');
  await runChallenge(
    'CH-29',
    JSON.stringify({
      answers: {
        q1: 'vulnerable',
        q2: 'safe',
        q3: 'vulnerable',
        q4: 'safe',
        q5: 'vulnerable',
        q6: ['structured-roles', 'output-encoding', 'least-privilege-tools', 'input-validation'],
      },
    }),
    100,
    100
  );

  // Wrong on q6 only (picked the cosmetic defenses) → ~71%
  await runChallenge(
    'CH-29',
    JSON.stringify({
      answers: {
        q1: 'vulnerable',
        q2: 'safe',
        q3: 'vulnerable',
        q4: 'safe',
        q5: 'vulnerable',
        q6: ['longer-system-prompt', 'client-side-keyword-filter'],
      },
    }),
    60,
    80
  );

  // All wrong
  await runChallenge(
    'CH-29',
    JSON.stringify({
      answers: {
        q1: 'safe',
        q2: 'vulnerable',
        q3: 'safe',
        q4: 'vulnerable',
        q5: 'safe',
        q6: ['longer-system-prompt'],
      },
    }),
    0,
    5
  );

  console.log('\n[CH-30 — Token Bucket Rate Limiter]');
  const bucketCorrect = `
function createRateLimiter(capacity, refillPerSec) {
  let tokens = capacity;
  let lastNowMs = null;
  return {
    tryAcquire(nowMs) {
      if (lastNowMs !== null) {
        const elapsedSec = (nowMs - lastNowMs) / 1000;
        tokens = Math.min(capacity, tokens + elapsedSec * refillPerSec);
      }
      lastNowMs = nowMs;
      if (tokens >= 1) {
        tokens -= 1;
        return true;
      }
      return false;
    }
  };
}
`;
  await runChallenge('CH-30', bucketCorrect, 100, 100);

  // Broken: doesn't cap refill — long sleep stockpiles tokens
  const bucketNoCap = `
function createRateLimiter(capacity, refillPerSec) {
  let tokens = capacity;
  let lastNowMs = null;
  return {
    tryAcquire(nowMs) {
      if (lastNowMs !== null) {
        const elapsedSec = (nowMs - lastNowMs) / 1000;
        tokens = tokens + elapsedSec * refillPerSec;
      }
      lastNowMs = nowMs;
      if (tokens >= 1) { tokens -= 1; return true; }
      return false;
    }
  };
}
`;
  // Fails the cap test → ~7/8 = 87
  await runChallenge('CH-30', bucketNoCap, 70, 90);

  // Broken: always allows
  const bucketAlways = `
function createRateLimiter(capacity, refillPerSec) {
  return { tryAcquire(nowMs) { return true; } };
}
`;
  await runChallenge('CH-30', bucketAlways, 0, 50);

  console.log('\n[CH-04 — Spot the Hallucination — Market Analysis]');
  await runChallenge(
    'CH-04',
    JSON.stringify([
      'The founding year 1999 is wrong — Nubank was founded in 2013.',
      'Buenos Aires is incorrect — Nubank is headquartered in São Paulo, Brazil.',
      'Mexico City is not the real headquarter — São Paulo, Brazil is.',
      'The London Stock Exchange IPO claim is wrong — Nubank IPO\'d on the NYSE (New York).',
      'PostgreSQL is wrong — the ledger database is actually Apache Cassandra.',
      'The Argentina expansion is fabricated — Nubank does not operate in Argentina.',
    ]),
    90,
    100
  );
  // Only 2 of 5 errors covered
  await runChallenge(
    'CH-04',
    JSON.stringify([
      'founded 1999 wrong — real year 2013',
      'PostgreSQL is not the ledger — Cassandra is',
    ]),
    30,
    50
  );
  await runChallenge('CH-04', 'not json', 0, 0);

  console.log('\n[CH-06 — Data Dictionary Builder]');
  await runChallenge(
    'CH-06',
    JSON.stringify({
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
    100,
    100
  );
  // Reordered arrays → still 100 (sets)
  await runChallenge(
    'CH-06',
    JSON.stringify({
      entities: ['notification', 'customer', 'account', 'card', 'transaction'],
      customerPiiFields: ['phone', 'cpf', 'email', 'name', 'birth_date'],
      accountTypeEnum: ['savings', 'checking'],
      transactionTypeEnum: ['pix', 'transfer', 'credit', 'debit'],
      cardTypeEnum: ['physical', 'virtual'],
      nullableForeignKeys: ['transaction.card_id'],
      oneToManyRelations: [
        'account->card',
        'customer->account',
        'customer->notification',
        'account->transaction',
      ],
    }),
    100,
    100
  );
  // 2 wrong fields: extra PII, wrong enum
  await runChallenge(
    'CH-06',
    JSON.stringify({
      entities: ['customer', 'account', 'transaction', 'card', 'notification'],
      customerPiiFields: ['cpf', 'name', 'email', 'phone', 'birth_date', 'id'],
      accountTypeEnum: ['checking', 'savings', 'business'],
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
    60,
    80
  );

  console.log('\n[CH-10 — Brazilian Phone Normalizer]');
  const phoneCorrect = `
function normalizeBrPhone(input) {
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
}
`;
  await runChallenge('CH-10', phoneCorrect, 100, 100);
  // Broken: doesn't strip non-digits
  await runChallenge(
    'CH-10',
    `function normalizeBrPhone(s) { return s; }`,
    0,
    30
  );
  // Forbidden
  await runChallenge(
    'CH-10',
    `function normalizeBrPhone(s) { return process.env.X; }`,
    0,
    0
  );

  console.log('\n[CH-12 — Test-of-Tests: CPF Suite]');
  const ttGood = `
function runTests(validator) {
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
}
`;
  await runChallenge('CH-12', ttGood, 100, 100);

  // Too few tests (6 < 8) AND only false-expected — catches always-true but
  // not always-false, and total < 8 fails first harness.
  const ttTooFew = `
function runTests(validator) {
  const cases = [
    { input: '00000000000', expected: false },
    { input: '11111111111', expected: false },
    { input: '12345678900', expected: false },
    { input: '', expected: false },
    { input: 'abc', expected: false },
    { input: '5299822472', expected: false },
  ];
  let passed = 0, failed = 0;
  for (const c of cases) {
    try { if (validator(c.input) === c.expected) passed++; else failed++; }
    catch { failed++; }
  }
  return { total: cases.length, passed, failed };
}
`;
  // Passes: catches always-true (failed>0 because all-expect-false and true!=false),
  //         catches always-false (wait — all expected false, always-false returns false, matches all → failed=0, NOT caught)
  // Fails: correct impl check (total<8), always-false check, length-only check (length-only returns false for empty/abc/short = correct; true for 12345678900 — not expected false → failed>0 ✓ caught)
  // So: 2/4 passes = 50
  await runChallenge('CH-12', ttTooFew, 40, 60);

  // Broken: returns nothing
  await runChallenge(
    'CH-12',
    `function runTests(v) { return null; }`,
    0,
    10
  );

  console.log('\n[CH-01 — Spot the Bad PRD]');
  // All 5 issues covered with correct keyword pairs
  await runChallenge(
    'CH-01',
    JSON.stringify([
      'The problem statement is vague — no 12 notifications/day baseline, no 68% dismissal number anywhere.',
      'There are no user stories in As-a / I-want / so-that format — just a feature list.',
      'The "users feel happy" metric is not measurable — needs a numeric KPI like % reduction or dismissal rate.',
      'Scope creep: SMS fallback, admin dashboard, and the SNS migration do not belong in a notification-relevance PRD.',
      'There is no explicit out-of-scope / boundary section — readers cannot tell what is excluded.',
    ]),
    90,
    100
  );
  // Only 2 of 5 issues covered
  await runChallenge(
    'CH-01',
    JSON.stringify([
      'vague problem — missing the 12 and 68 baseline numbers',
      'no out-of-scope section, needs explicit boundaries',
    ]),
    30,
    50
  );
  await runChallenge('CH-01', 'not json', 0, 0);

  console.log('\n[CH-02 — INVEST Triage]');
  // All 7 correct
  await runChallenge(
    'CH-02',
    JSON.stringify({
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
    100,
    100
  );
  // 3 of 7 correct
  await runChallenge(
    'CH-02',
    JSON.stringify({
      answers: {
        q1: 't',
        q2: 's',
        q3: 'n',
        q4: 'v',
        q5: 'i',
        q6: 'i',
        q7: 'v',
      },
    }),
    35,
    50
  );
  // All wrong
  await runChallenge(
    'CH-02',
    JSON.stringify({
      answers: { q1: 'i', q2: 'i', q3: 'i', q4: 't', q5: 't', q6: 't', q7: 'i' },
    }),
    0,
    5
  );

  console.log('\n[CH-17 — Copilot Rollout]');
  // All 6 correct
  await runChallenge(
    'CH-17',
    JSON.stringify({
      answers: { q1: 'b', q2: 'b', q3: 'b', q4: 'c', q5: 'b', q6: 'b' },
    }),
    100,
    100
  );
  // Case-insensitive
  await runChallenge(
    'CH-17',
    JSON.stringify({
      answers: { q1: 'B', q2: 'B', q3: 'B', q4: 'C', q5: 'B', q6: 'B' },
    }),
    100,
    100
  );
  // 3 of 6 correct
  await runChallenge(
    'CH-17',
    JSON.stringify({
      answers: { q1: 'a', q2: 'b', q3: 'a', q4: 'c', q5: 'a', q6: 'b' },
    }),
    45,
    55
  );
  // All wrong
  await runChallenge(
    'CH-17',
    JSON.stringify({
      answers: { q1: 'a', q2: 'a', q3: 'a', q4: 'a', q5: 'a', q6: 'a' },
    }),
    0,
    5
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main();
