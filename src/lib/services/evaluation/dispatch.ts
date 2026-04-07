/**
 * Evaluation dispatcher.
 *
 * Picks the right evaluation strategy based on `challenge.evaluationMethod`
 * and the optional `rubric.grader` block. Returns a unified `EvaluationOutput`
 * so the scoring pipeline (calculateScore, point transactions) is unchanged.
 *
 * Strategies:
 *  - 'ai-judge'        → Claude tool_use only
 *  - 'automated-test'  → deterministic auto-grader only (no AI call)
 *  - 'hybrid'          → both, blended (default 70% auto / 30% AI)
 *  - 'human-review'    → not implemented; falls back to ai-judge with low confidence
 */

import { evaluateWithRetry, type EvaluationOutput } from './ai-judge';
import {
  hasGraderConfig,
  runAutoGrader,
  toEvaluationOutput,
  type GraderConfig,
} from './auto-graders';

interface DispatchInput {
  challengeTitle: string;
  challengeDescription: string;
  instructions: string;
  submissionText: string;
  rubric: {
    criteria: { name: string; weight: number; description: string }[];
    grader?: GraderConfig;
  };
  difficulty: string;
  evaluationMethod: 'ai-judge' | 'automated-test' | 'human-review' | 'hybrid';
}

interface HybridWeights {
  auto: number;
  ai: number;
}

const DEFAULT_HYBRID_WEIGHTS: HybridWeights = { auto: 0.7, ai: 0.3 };

/**
 * Run the appropriate evaluator and return a unified result.
 * Includes a `meta.evaluator` field on the output for audit clarity.
 */
export async function dispatchEvaluation(
  input: DispatchInput
): Promise<EvaluationOutput & { meta?: { evaluator: string } }> {
  const { evaluationMethod, rubric, submissionText } = input;

  // Pure auto-grader path
  if (evaluationMethod === 'automated-test') {
    if (!hasGraderConfig(rubric)) {
      throw new Error(
        `Challenge has evaluationMethod='automated-test' but no grader config in rubric.grader`
      );
    }
    const result = runAutoGrader(submissionText, rubric.grader);
    return {
      ...toEvaluationOutput(result, rubric.criteria),
      meta: { evaluator: `auto:${rubric.grader.type}` },
    };
  }

  // Pure AI judge path
  if (evaluationMethod === 'ai-judge' || evaluationMethod === 'human-review') {
    const result = await evaluateWithRetry({
      challengeTitle: input.challengeTitle,
      challengeDescription: input.challengeDescription,
      instructions: input.instructions,
      submissionText,
      rubric: { criteria: rubric.criteria },
      difficulty: input.difficulty,
    });
    return { ...result, meta: { evaluator: 'ai-judge' } };
  }

  // Hybrid path: blend auto and AI scores
  if (evaluationMethod === 'hybrid') {
    if (!hasGraderConfig(rubric)) {
      // Degrade gracefully to ai-judge only
      const result = await evaluateWithRetry({
        challengeTitle: input.challengeTitle,
        challengeDescription: input.challengeDescription,
        instructions: input.instructions,
        submissionText,
        rubric: { criteria: rubric.criteria },
        difficulty: input.difficulty,
      });
      return { ...result, meta: { evaluator: 'hybrid-degraded:ai-only' } };
    }

    const [autoResultRaw, aiResult] = await Promise.all([
      Promise.resolve(runAutoGrader(submissionText, rubric.grader)),
      evaluateWithRetry({
        challengeTitle: input.challengeTitle,
        challengeDescription: input.challengeDescription,
        instructions: input.instructions,
        submissionText,
        rubric: { criteria: rubric.criteria },
        difficulty: input.difficulty,
      }),
    ]);

    const autoOutput = toEvaluationOutput(autoResultRaw, rubric.criteria);
    const w = DEFAULT_HYBRID_WEIGHTS;
    const blendedScore =
      w.auto * autoOutput.overallScore + w.ai * aiResult.overallScore;

    // Blend criteria scores too (matched by name)
    const blendedCriteria = rubric.criteria.map((c) => {
      const autoCrit = autoOutput.criteria.find((x) => x.name === c.name);
      const aiCrit = aiResult.criteria.find((x) => x.name === c.name);
      const score =
        w.auto * (autoCrit?.score ?? 0) + w.ai * (aiCrit?.score ?? 0);
      const justification = [
        autoCrit && `auto: ${autoCrit.justification}`,
        aiCrit && `ai: ${aiCrit.justification}`,
      ]
        .filter(Boolean)
        .join(' | ');
      return { name: c.name, score: Math.round(score), justification };
    });

    return {
      criteria: blendedCriteria,
      overallScore: Math.round(blendedScore),
      confidence: Math.max(autoOutput.confidence, aiResult.confidence),
      feedback: `Auto-grader: ${autoOutput.feedback}\n\nAI judge: ${aiResult.feedback}`,
      meta: { evaluator: 'hybrid' },
    };
  }

  throw new Error(`Unsupported evaluationMethod: ${evaluationMethod}`);
}
