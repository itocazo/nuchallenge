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
import type { ChallengeGraderConfig } from '../../types';

let passed = 0;
let failed = 0;

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

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main();
