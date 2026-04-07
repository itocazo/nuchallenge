/**
 * Shared types for the auto-grader subsystem.
 *
 * Auto-graders evaluate submissions deterministically (no AI call) and
 * return a result shaped like the AI judge's `EvaluationOutput` so the rest
 * of the scoring/points pipeline doesn't need to change.
 */

import type { EvaluationOutput } from '../ai-judge';

export type GraderType = 'regex' | 'structured' | 'code-sandbox' | 'multi-choice';

export interface GraderConfig {
  type: GraderType;
  config: Record<string, unknown>;
}

/**
 * Per-test-case result. Used by the grader to build feedback.
 */
export interface TestCaseResult {
  description: string;
  passed: boolean;
  expected?: unknown;
  actual?: unknown;
  error?: string;
}

/**
 * Internal grader output. Translated to `EvaluationOutput` by the dispatcher
 * so it slots into the existing scoring pipeline.
 */
export interface AutoGraderResult {
  passed: number;
  total: number;
  score: number; // 0-100
  testCases: TestCaseResult[];
  feedback: string;
  /** Optional per-criterion scores for the rubric, if the grader can provide them */
  criteriaScores?: { name: string; score: number; justification: string }[];
}

/**
 * Convert an internal AutoGraderResult into the shape the rest of the
 * scoring pipeline expects.
 */
export function toEvaluationOutput(
  result: AutoGraderResult,
  rubricCriteria: { name: string; weight: number; description: string }[]
): EvaluationOutput {
  // If the grader provided per-criterion scores, use them. Otherwise, give
  // every criterion the overall score (a uniform pass/fail signal).
  const criteria = result.criteriaScores
    ? result.criteriaScores
    : rubricCriteria.map((c) => ({
        name: c.name,
        score: result.score,
        justification: `Auto-grader: ${result.passed}/${result.total} test cases passed.`,
      }));

  return {
    criteria,
    overallScore: Math.max(0, Math.min(100, Math.round(result.score))),
    confidence: 1, // deterministic graders are always 100% confident
    feedback: result.feedback,
  };
}
