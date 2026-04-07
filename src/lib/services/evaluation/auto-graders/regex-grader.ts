/**
 * Regex grader.
 *
 * Submission: a single regex literal as plain text. Accepted forms:
 *   /pattern/flags
 *   pattern             (no flags)
 *
 * Config: see `RegexGraderConfig`.
 *
 * Scoring: 1 point per correct match/reject; final score = correct / total * 100.
 * Penalties applied for forbidden tokens or excessive length.
 */

import type { AutoGraderResult, TestCaseResult } from './types';

export interface RegexGraderConfig {
  /** Strings the user's pattern MUST match */
  mustMatch: string[];
  /** Strings the user's pattern MUST NOT match */
  mustNotMatch: string[];
  /** Hard cap on pattern length (penalty if exceeded) */
  maxLength?: number;
  /** Substrings forbidden in the pattern (e.g. ['.*'] to block trivial wildcards) */
  forbiddenTokens?: string[];
  /** Penalty applied per violation (0-100, default 20) */
  violationPenalty?: number;
}

interface ParsedPattern {
  source: string;
  flags: string;
}

/**
 * Parse `/pattern/flags` or bare `pattern`. Returns null on syntax error.
 */
function parseSubmission(text: string): ParsedPattern | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // /pattern/flags form (handle multiline by checking first/last separators)
  if (trimmed.startsWith('/')) {
    const lastSlash = trimmed.lastIndexOf('/');
    if (lastSlash > 0) {
      const source = trimmed.slice(1, lastSlash);
      const flags = trimmed.slice(lastSlash + 1);
      if (/^[gimsuy]*$/.test(flags)) {
        return { source, flags };
      }
    }
  }

  // bare pattern
  return { source: trimmed, flags: '' };
}

export function gradeRegex(
  submissionText: string,
  config: RegexGraderConfig
): AutoGraderResult {
  const parsed = parseSubmission(submissionText);

  if (!parsed) {
    return {
      passed: 0,
      total: config.mustMatch.length + config.mustNotMatch.length,
      score: 0,
      testCases: [],
      feedback:
        'Submission is empty or could not be parsed. Submit a regex literal like `/pattern/flags` or just `pattern`.',
    };
  }

  let pattern: RegExp;
  try {
    pattern = new RegExp(parsed.source, parsed.flags);
  } catch (e) {
    return {
      passed: 0,
      total: config.mustMatch.length + config.mustNotMatch.length,
      score: 0,
      testCases: [],
      feedback: `Invalid regex syntax: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const testCases: TestCaseResult[] = [];
  let passed = 0;

  for (const sample of config.mustMatch) {
    const ok = pattern.test(sample);
    if (ok) passed++;
    testCases.push({
      description: `should MATCH: "${sample}"`,
      passed: ok,
      expected: 'match',
      actual: ok ? 'match' : 'no match',
    });
  }

  for (const sample of config.mustNotMatch) {
    const ok = !pattern.test(sample);
    if (ok) passed++;
    testCases.push({
      description: `should REJECT: "${sample}"`,
      passed: ok,
      expected: 'no match',
      actual: ok ? 'no match' : 'match',
    });
  }

  const total = testCases.length;
  let score = total === 0 ? 0 : (passed / total) * 100;

  // Penalties
  const violationPenalty = config.violationPenalty ?? 20;
  const violations: string[] = [];

  if (config.maxLength && parsed.source.length > config.maxLength) {
    violations.push(
      `Pattern length ${parsed.source.length} exceeds limit ${config.maxLength}`
    );
    score -= violationPenalty;
  }

  if (config.forbiddenTokens) {
    for (const token of config.forbiddenTokens) {
      if (parsed.source.includes(token)) {
        violations.push(`Pattern contains forbidden token "${token}"`);
        score -= violationPenalty;
      }
    }
  }

  score = Math.max(0, Math.min(100, score));

  const feedbackParts = [
    `${passed}/${total} test cases passed (${Math.round(score)}%).`,
  ];

  const failed = testCases.filter((t) => !t.passed);
  if (failed.length > 0) {
    feedbackParts.push(
      `\nFailed cases:\n${failed.map((f) => `  - ${f.description}`).join('\n')}`
    );
  }

  if (violations.length > 0) {
    feedbackParts.push(`\nQuality penalties:\n${violations.map((v) => `  - ${v}`).join('\n')}`);
  }

  if (passed === total && violations.length === 0) {
    feedbackParts.push('\n✓ Perfect score — clean and correct.');
  }

  return {
    passed,
    total,
    score,
    testCases,
    feedback: feedbackParts.join('\n'),
  };
}
