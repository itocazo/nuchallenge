/**
 * Multi-choice grader.
 *
 * Two accepted submission shapes:
 *  - Legacy: `{ answers: { q1: 'a', q2: 'c' } }`
 *  - Reasoning-required: `{ answers: { q1: { letter: 'a', why: '...' }, ... } }`
 *
 * The reasoning-required shape is what we want for judgment-type questions
 * (e.g. "which INVEST letter does this user story break?"): asking the learner
 * to write WHY forces them to engage with the story instead of pasting the
 * letter from a chatbot. The auto-grader only scores letter correctness; the
 * `why` field exists to be scored by the AI judge in hybrid mode — but this
 * grader DOES refuse to give credit for a letter if the `why` field is missing
 * or empty on a challenge that declared `requireReasoning: true`. That's the
 * structural anti-regurgitation signal.
 *
 * Each question has a `correctAnswer` that is either:
 *  - a string (single-select): exact, case-insensitive match
 *  - a string[] (multi-select): order-insensitive set equality
 *
 * `question.explanation` is used in feedback for wrong (or unreasoned) answers
 * so the learner gets a deterministic teaching moment, not just "incorrect".
 *
 * Scoring is weighted by `question.points` (default = 1 each).
 * Score = sum(earned points) / sum(all points) * 100.
 */

import type { AutoGraderResult, TestCaseResult } from './types';

export interface MultiChoiceQuestion {
  id: string;
  /** Single answer (string) or multi-select (array of strings). */
  correctAnswer: string | string[];
  /** Weight for this question. Defaults to 1. */
  points?: number;
  /** Canonical explanation shown in feedback when the learner gets this wrong. */
  explanation?: string;
}

export interface MultiChoiceGraderConfig {
  questions: MultiChoiceQuestion[];
  /**
   * When true, answers must be submitted as `{ letter: 'a', why: '...' }` and
   * the `why` must be at least `minReasoningChars` characters (default 30).
   * Missing/short `why` forfeits the point for that question even if the
   * letter is right — forcing the learner to commit to a thought.
   */
  requireReasoning?: boolean;
  /** Minimum characters for the `why` field. Default 30. */
  minReasoningChars?: number;
}

interface NormalizedAnswer {
  letter: string | string[] | null;
  why: string;
  /** True if the user submitted the reasoning-rich shape (`{ letter, why }`). */
  hasReasoningShape: boolean;
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text.trim());
  } catch {
    return null;
  }
}

/**
 * Accept both legacy (`'a'`) and reasoning-required (`{ letter: 'a', why: '...' }`)
 * answer shapes. Returns a normalized form we can score uniformly.
 */
function normalizeAnswer(raw: unknown): NormalizedAnswer {
  if (typeof raw === 'string') {
    return { letter: raw, why: '', hasReasoningShape: false };
  }
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'string')) {
    return { letter: raw as string[], why: '', hasReasoningShape: false };
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const letter =
      typeof obj.letter === 'string'
        ? obj.letter
        : Array.isArray(obj.letter) && obj.letter.every((x) => typeof x === 'string')
          ? (obj.letter as string[])
          : null;
    const why = typeof obj.why === 'string' ? obj.why.trim() : '';
    return { letter, why, hasReasoningShape: true };
  }
  return { letter: null, why: '', hasReasoningShape: false };
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

function letterMatches(
  userLetter: string | string[] | null,
  correctAnswer: string | string[]
): boolean {
  if (userLetter === null) return false;
  if (Array.isArray(correctAnswer)) {
    if (!Array.isArray(userLetter)) return false;
    return setsEqual(userLetter, correctAnswer);
  }
  if (typeof userLetter !== 'string') return false;
  return userLetter.toLowerCase() === correctAnswer.toLowerCase();
}

export function gradeMultiChoice(
  submissionText: string,
  config: MultiChoiceGraderConfig
): AutoGraderResult {
  const parsed = safeParseJson(submissionText);
  const requireReasoning = config.requireReasoning ?? false;
  const minChars = config.minReasoningChars ?? 30;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    const shapeHint = requireReasoning
      ? '`{"answers": { "q1": { "letter": "a", "why": "..." }, ... }}`'
      : '`{"answers": { "q1": "a", ... }}`';
    return {
      passed: 0,
      total: config.questions.length,
      score: 0,
      testCases: [],
      feedback: `Submission is not a valid JSON object. Submit ${shapeHint}.`,
    };
  }

  const answersField = (parsed as Record<string, unknown>).answers;
  if (!answersField || typeof answersField !== 'object' || Array.isArray(answersField)) {
    const shapeHint = requireReasoning
      ? '`{"answers": { "q1": { "letter": "a", "why": "..." }, ... }}`'
      : '`{"answers": { "q1": "a", ... }}`';
    return {
      passed: 0,
      total: config.questions.length,
      score: 0,
      testCases: [],
      feedback: `Missing \`answers\` object. Submit ${shapeHint}.`,
    };
  }

  const answers = answersField as Record<string, unknown>;
  const testCases: TestCaseResult[] = [];
  const feedbackLines: string[] = [];
  let passedCount = 0;
  let earnedPoints = 0;
  let totalPoints = 0;

  for (const q of config.questions) {
    const weight = q.points ?? 1;
    totalPoints += weight;
    const normalized = normalizeAnswer(answers[q.id]);
    const letterOk = letterMatches(normalized.letter, q.correctAnswer);
    const reasoningOk =
      !requireReasoning || (normalized.hasReasoningShape && normalized.why.length >= minChars);
    const ok = letterOk && reasoningOk;

    if (ok) {
      passedCount++;
      earnedPoints += weight;
    }

    const expectedDisplay = Array.isArray(q.correctAnswer)
      ? q.correctAnswer.join(', ')
      : q.correctAnswer;
    const actualDisplay =
      normalized.letter === null
        ? '(no answer)'
        : Array.isArray(normalized.letter)
          ? normalized.letter.join(', ')
          : normalized.letter;

    testCases.push({
      description: `Question ${q.id}`,
      passed: ok,
      expected: q.correctAnswer,
      actual: answers[q.id] ?? '(no answer)',
    });

    // Build a per-question feedback line, including the canonical explanation
    // whenever the learner missed the letter OR the reasoning — so correct
    // answers also receive the teaching note when reasoning was too thin.
    if (!ok) {
      const parts: string[] = [];
      if (!letterOk) {
        parts.push(
          `  ✗ ${q.id}: expected **${expectedDisplay}**, got **${actualDisplay}**.`
        );
      } else if (!reasoningOk) {
        parts.push(
          `  ⚠ ${q.id}: letter **${expectedDisplay}** was correct, but reasoning was missing or too short (need ≥${minChars} chars in the "why" field).`
        );
      }
      if (q.explanation) {
        parts.push(`    → ${q.explanation}`);
      }
      feedbackLines.push(parts.join('\n'));
    } else if (q.explanation && normalized.hasReasoningShape) {
      // Show the canonical explanation alongside correct answers too, so the
      // learner can compare their reasoning against the reference.
      feedbackLines.push(`  ✓ ${q.id}: correct (**${expectedDisplay}**).\n    → Reference: ${q.explanation}`);
    }
  }

  const total = config.questions.length;
  const score = totalPoints === 0 ? 0 : (earnedPoints / totalPoints) * 100;

  const header = `${passedCount}/${total} questions answered correctly (${Math.round(score)}%).`;
  const feedback = feedbackLines.length > 0
    ? `${header}\n\n${feedbackLines.join('\n\n')}`
    : `${header}\n✓ All questions correct.`;

  return {
    passed: passedCount,
    total,
    score,
    testCases,
    feedback,
  };
}
