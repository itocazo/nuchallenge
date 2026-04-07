/**
 * Multi-choice grader.
 *
 * Submission: JSON `{ answers: { q1: 'a', q2: 'c', ... } }`.
 *
 * Each question has a `correctAnswer` that is either:
 *  - a string (single-select): exact, case-insensitive match
 *  - a string[] (multi-select): order-insensitive set equality
 *
 * Scoring is weighted by `question.points` (default = 1 each).
 * Score = sum(earned points) / sum(all points) * 100.
 *
 * Use case: SQL injection triage, security awareness quizzes, cert-style
 * multi-question exams.
 */

import type { AutoGraderResult, TestCaseResult } from './types';

export interface MultiChoiceQuestion {
  id: string;
  /** Single answer (string) or multi-select (array of strings). */
  correctAnswer: string | string[];
  /** Weight for this question. Defaults to 1. */
  points?: number;
}

export interface MultiChoiceGraderConfig {
  questions: MultiChoiceQuestion[];
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text.trim());
  } catch {
    return null;
  }
}

/**
 * Order-insensitive set equality for string arrays (lowercased).
 */
function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a.map((x) => x.toLowerCase()));
  const sb = new Set(b.map((x) => x.toLowerCase()));
  if (sa.size !== sb.size) return false;
  for (const v of sa) {
    if (!sb.has(v)) return false;
  }
  return true;
}

function answerMatches(
  userAnswer: unknown,
  correctAnswer: string | string[]
): boolean {
  if (Array.isArray(correctAnswer)) {
    if (!Array.isArray(userAnswer)) return false;
    if (!userAnswer.every((x) => typeof x === 'string')) return false;
    return setsEqual(userAnswer as string[], correctAnswer);
  }
  if (typeof userAnswer !== 'string') return false;
  return userAnswer.toLowerCase() === correctAnswer.toLowerCase();
}

export function gradeMultiChoice(
  submissionText: string,
  config: MultiChoiceGraderConfig
): AutoGraderResult {
  const parsed = safeParseJson(submissionText);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      passed: 0,
      total: config.questions.length,
      score: 0,
      testCases: [],
      feedback:
        'Submission is not a valid JSON object. Submit `{"answers": { "q1": "a", ... }}`.',
    };
  }

  const answersField = (parsed as Record<string, unknown>).answers;
  if (!answersField || typeof answersField !== 'object' || Array.isArray(answersField)) {
    return {
      passed: 0,
      total: config.questions.length,
      score: 0,
      testCases: [],
      feedback:
        'Missing `answers` object. Submit `{"answers": { "q1": "a", ... }}`.',
    };
  }

  const answers = answersField as Record<string, unknown>;
  const testCases: TestCaseResult[] = [];
  let passedCount = 0;
  let earnedPoints = 0;
  let totalPoints = 0;

  for (const q of config.questions) {
    const weight = q.points ?? 1;
    totalPoints += weight;
    const userAnswer = answers[q.id];
    const ok = answerMatches(userAnswer, q.correctAnswer);
    if (ok) {
      passedCount++;
      earnedPoints += weight;
    }
    testCases.push({
      description: `Question ${q.id}`,
      passed: ok,
      expected: q.correctAnswer,
      actual: userAnswer ?? '(no answer)',
    });
  }

  const total = config.questions.length;
  const score = totalPoints === 0 ? 0 : (earnedPoints / totalPoints) * 100;

  const wrong = testCases.filter((t) => !t.passed);
  const feedback = [
    `${passedCount}/${total} questions correct (${Math.round(score)}%).`,
    wrong.length > 0
      ? `\nIncorrect:\n${wrong
          .map(
            (w) =>
              `  - ${w.description}: expected ${JSON.stringify(w.expected)}, got ${JSON.stringify(w.actual)}`
          )
          .join('\n')}`
      : '\n✓ All questions correct.',
  ].join('\n');

  return {
    passed: passedCount,
    total,
    score,
    testCases,
    feedback,
  };
}
