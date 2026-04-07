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

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main();
