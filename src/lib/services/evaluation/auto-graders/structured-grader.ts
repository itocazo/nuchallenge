/**
 * Structured-answer grader.
 *
 * Submission: JSON in `submissionText`. Either a top-level array (list mode)
 * or a top-level object (object mode).
 *
 * Use case: "find the 5 errors in this document" — user submits a list of
 * findings, we fuzzy-match against the canonical answer key.
 */

import type { AutoGraderResult, TestCaseResult } from './types';

export interface StructuredGraderConfig {
  expectedShape: 'list' | 'object';
  /** Canonical answer. For list mode, an array of strings or objects with `keywords`. */
  answerKey: AnswerKeyEntry[] | Record<string, unknown>;
  /** exact = deep equal; subset = user must include each canonical entry; fuzzy = keyword overlap */
  matchMode: 'exact' | 'subset' | 'fuzzy';
  /** For fuzzy mode: minimum keyword-overlap ratio (0-1). Default 0.5. */
  fuzzyThreshold?: number;
  /** Award partial credit (N/total) instead of all-or-nothing. Default true. */
  partialCredit?: boolean;
}

export interface AnswerKeyEntry {
  /** Short label shown in feedback */
  label: string;
  /** Keywords that must appear (case-insensitive) for a match to count */
  keywords: string[];
  /** Optional: minimum keywords that must overlap (default = ceil(keywords/2)) */
  minOverlap?: number;
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text.trim());
  } catch {
    return null;
  }
}

/**
 * Returns true if the user's free-form text "matches" a canonical entry,
 * meaning enough of its keywords appear in the user's text.
 */
function fuzzyMatch(userText: string, entry: AnswerKeyEntry): boolean {
  const haystack = userText.toLowerCase();
  const matchedKeywords = entry.keywords.filter((kw) =>
    haystack.includes(kw.toLowerCase())
  ).length;
  const required = entry.minOverlap ?? Math.ceil(entry.keywords.length / 2);
  return matchedKeywords >= required;
}

function gradeListMode(
  parsed: unknown,
  config: StructuredGraderConfig
): AutoGraderResult {
  if (!Array.isArray(parsed)) {
    return {
      passed: 0,
      total: (config.answerKey as AnswerKeyEntry[]).length,
      score: 0,
      testCases: [],
      feedback:
        'Expected a JSON array. Submit something like:\n```json\n[\n  "first finding",\n  "second finding"\n]\n```',
    };
  }

  const answerKey = config.answerKey as AnswerKeyEntry[];
  // Stringify each user submission so we can fuzzy-match either strings or objects
  const userTexts: string[] = parsed.map((item) =>
    typeof item === 'string' ? item : JSON.stringify(item)
  );

  const testCases: TestCaseResult[] = [];
  let passed = 0;

  for (const entry of answerKey) {
    const matched = userTexts.some((text) => fuzzyMatch(text, entry));
    if (matched) passed++;
    testCases.push({
      description: `Found: ${entry.label}`,
      passed: matched,
      expected: entry.keywords.join(' + '),
      actual: matched ? 'found' : 'missing',
    });
  }

  const total = answerKey.length;
  const partialCredit = config.partialCredit ?? true;
  const score = partialCredit
    ? (passed / total) * 100
    : passed === total
      ? 100
      : 0;

  const missing = testCases.filter((t) => !t.passed);
  const feedback = [
    `${passed}/${total} expected items found (${Math.round(score)}%).`,
    missing.length > 0
      ? `\nMissing:\n${missing.map((m) => `  - ${m.description}`).join('\n')}`
      : '\n✓ All expected items present.',
  ].join('\n');

  return { passed, total, score, testCases, feedback };
}

function gradeObjectMode(
  parsed: unknown,
  config: StructuredGraderConfig
): AutoGraderResult {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      passed: 0,
      total: Object.keys(config.answerKey as Record<string, unknown>).length,
      score: 0,
      testCases: [],
      feedback: 'Expected a JSON object with the required fields.',
    };
  }

  const answerKey = config.answerKey as Record<string, unknown>;
  const userObj = parsed as Record<string, unknown>;
  const testCases: TestCaseResult[] = [];
  let passed = 0;

  for (const [key, expected] of Object.entries(answerKey)) {
    const actual = userObj[key];
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) passed++;
    testCases.push({
      description: `Field "${key}"`,
      passed: ok,
      expected,
      actual,
    });
  }

  const total = testCases.length;
  const score = (passed / total) * 100;

  const wrong = testCases.filter((t) => !t.passed);
  const feedback = [
    `${passed}/${total} fields correct (${Math.round(score)}%).`,
    wrong.length > 0
      ? `\nIncorrect fields:\n${wrong.map((w) => `  - ${w.description}`).join('\n')}`
      : '',
  ].join('\n');

  return { passed, total, score, testCases, feedback };
}

export function gradeStructured(
  submissionText: string,
  config: StructuredGraderConfig
): AutoGraderResult {
  const parsed = safeParseJson(submissionText);

  if (parsed === null) {
    return {
      passed: 0,
      total: 0,
      score: 0,
      testCases: [],
      feedback:
        'Submission is not valid JSON. Make sure to wrap arrays in `[]` and objects in `{}`, with double-quoted keys.',
    };
  }

  if (config.expectedShape === 'list') {
    return gradeListMode(parsed, config);
  }
  return gradeObjectMode(parsed, config);
}
