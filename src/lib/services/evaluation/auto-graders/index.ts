/**
 * Auto-grader router.
 *
 * Picks the right grader based on `config.type` and runs it. The result
 * is shaped like the AI judge output so the rest of the scoring pipeline
 * doesn't need to change.
 */

import { gradeRegex, type RegexGraderConfig } from './regex-grader';
import {
  gradeStructured,
  type StructuredGraderConfig,
} from './structured-grader';
import {
  gradeCodeSandbox,
  type CodeSandboxGraderConfig,
} from './code-sandbox-grader';
import {
  gradeMultiChoice,
  type MultiChoiceGraderConfig,
} from './multi-choice-grader';
import type { AutoGraderResult, GraderConfig } from './types';

export type { GraderConfig, AutoGraderResult } from './types';
export { toEvaluationOutput } from './types';

export function runAutoGrader(
  submissionText: string,
  graderConfig: GraderConfig
): AutoGraderResult {
  switch (graderConfig.type) {
    case 'regex':
      return gradeRegex(submissionText, graderConfig.config as unknown as RegexGraderConfig);
    case 'structured':
      return gradeStructured(
        submissionText,
        graderConfig.config as unknown as StructuredGraderConfig
      );
    case 'code-sandbox':
      return gradeCodeSandbox(
        submissionText,
        graderConfig.config as unknown as CodeSandboxGraderConfig
      );
    case 'multi-choice':
      return gradeMultiChoice(
        submissionText,
        graderConfig.config as unknown as MultiChoiceGraderConfig
      );
    default:
      throw new Error(`Unknown grader type: ${(graderConfig as { type: string }).type}`);
  }
}

/**
 * Type guard: does this rubric carry an auto-grader config?
 */
export function hasGraderConfig(
  rubric: unknown
): rubric is { criteria: unknown[]; grader: GraderConfig } {
  return (
    typeof rubric === 'object' &&
    rubric !== null &&
    'grader' in rubric &&
    typeof (rubric as { grader: unknown }).grader === 'object' &&
    (rubric as { grader: { type?: string } }).grader.type !== undefined
  );
}
