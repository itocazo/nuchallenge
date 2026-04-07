/**
 * Self-running smoke test for the auto-grader subsystem.
 *
 * Run with: npx tsx src/lib/services/evaluation/auto-graders/__smoke_test__.ts
 *
 * No test framework needed — this is a deterministic, dependency-free
 * sanity check used during development to make sure each grader behaves
 * as designed before we wire it to live challenges.
 */

import { gradeRegex } from './regex-grader';
import { gradeStructured } from './structured-grader';
import { gradeCodeSandbox } from './code-sandbox-grader';

let passed = 0;
let failed = 0;

function expect(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// ----- regex grader -----
console.log('\n[regex-grader]');
{
  const result = gradeRegex('/^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$/', {
    mustMatch: ['529.982.247-25', '111.222.333-44'],
    mustNotMatch: ['52998224725', 'abc.def.ghi-jk', '529.982.247-2'],
  });
  expect('valid CPF regex scores 100', result.score === 100, `got ${result.score}`);
  expect('passed = total', result.passed === result.total);
}
{
  const result = gradeRegex('/.*/', {
    mustMatch: ['anything'],
    mustNotMatch: ['should-be-rejected'],
    forbiddenTokens: ['.*'],
  });
  expect(
    'forbidden token .* triggers penalty',
    result.score < 100,
    `got ${result.score}`
  );
}
{
  const result = gradeRegex('not[a regex(', {
    mustMatch: ['x'],
    mustNotMatch: ['y'],
  });
  expect('invalid regex scores 0', result.score === 0);
}

// ----- structured grader -----
console.log('\n[structured-grader]');
{
  const result = gradeStructured(
    JSON.stringify([
      'Customer count is wrong - actually 110 million not 95 million',
      'Founded 2013 is correct',
      'Argentina expansion not approved yet',
    ]),
    {
      expectedShape: 'list',
      matchMode: 'fuzzy',
      answerKey: [
        {
          label: '95M customer count error',
          keywords: ['95', '110', 'customer'],
        },
        {
          label: 'Argentina expansion error',
          keywords: ['Argentina', 'expansion'],
        },
        {
          label: 'Database tech error (Cassandra vs DynamoDB)',
          keywords: ['Cassandra', 'database'],
        },
      ],
    }
  );
  expect(
    'list mode finds 2 of 3 errors',
    result.passed === 2 && result.total === 3,
    `passed=${result.passed} total=${result.total}`
  );
}
{
  const result = gradeStructured('not json', {
    expectedShape: 'list',
    matchMode: 'fuzzy',
    answerKey: [],
  });
  expect('invalid JSON scores 0', result.score === 0);
}

// ----- code-sandbox grader -----
console.log('\n[code-sandbox-grader]');
{
  const submission = `
function add(a, b) {
  return a + b;
}
`;
  const result = gradeCodeSandbox(submission, {
    language: 'javascript',
    entrypoint: 'add',
    testCases: [
      { description: '1 + 2 = 3', input: [1, 2], expected: 3 },
      { description: '0 + 0 = 0', input: [0, 0], expected: 0 },
      { description: '-1 + 1 = 0', input: [-1, 1], expected: 0 },
    ],
  });
  expect(
    'simple add function passes all tests',
    result.passed === 3 && result.score === 100,
    `score=${result.score}`
  );
}
{
  const submission = `
function broken(x) {
  return x * 2;
}
`;
  const result = gradeCodeSandbox(submission, {
    language: 'javascript',
    entrypoint: 'broken',
    testCases: [
      { description: 'broken(5) should be 10', input: [5], expected: 10 },
      { description: 'broken(3) should be 7 (intentionally wrong)', input: [3], expected: 7 },
    ],
  });
  expect(
    'partial-pass function scores ~50',
    result.passed === 1 && result.score === 50,
    `score=${result.score}`
  );
}
{
  // Hidden danger: forbidden token check
  const submission = `
function hack() {
  return process.env;
}
`;
  const result = gradeCodeSandbox(submission, {
    language: 'javascript',
    entrypoint: 'hack',
    testCases: [{ description: 'should run', input: [], expected: {} }],
  });
  expect(
    'forbidden token "process" rejected',
    result.score === 0 && result.feedback.includes('forbidden')
  );
}
{
  // Missing entrypoint
  const submission = `function notTheRightName() { return 42; }`;
  const result = gradeCodeSandbox(submission, {
    language: 'javascript',
    entrypoint: 'expectedName',
    testCases: [{ description: 'noop', input: [], expected: 42 }],
  });
  expect(
    'missing entrypoint reports clearly',
    result.score === 0 && result.feedback.includes('expectedName')
  );
}

// ----- summary -----
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
