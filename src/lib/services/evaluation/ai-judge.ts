import Anthropic from '@anthropic-ai/sdk';

interface RubricCriterion {
  name: string;
  weight: number;
  description: string;
}

interface EvaluationInput {
  challengeTitle: string;
  challengeDescription: string;
  instructions: string;
  submissionText: string;
  rubric: { criteria: RubricCriterion[] };
  difficulty: string;
}

interface CriterionResult {
  name: string;
  score: number;
  justification: string;
}

export interface EvaluationOutput {
  criteria: CriterionResult[];
  overallScore: number;
  confidence: number;
  feedback: string;
}

// Model routing by difficulty per CTO approval
function getModelForDifficulty(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'claude-haiku-4-5-20251001';
    case 'intermediate':
      return 'claude-sonnet-4-6';
    case 'advanced':
    case 'expert':
      return 'claude-sonnet-4-6';
    default:
      return 'claude-sonnet-4-6';
  }
}

function buildEvaluationPrompt(input: EvaluationInput): string {
  const criteriaList = input.rubric.criteria
    .map(c => `- **${c.name}** (${c.weight}% weight): ${c.description}`)
    .join('\n');

  return `You are an expert evaluator for an AI learning challenge platform at Nubank.

## Challenge
**Title:** ${input.challengeTitle}
**Difficulty:** ${input.difficulty}
**Description:** ${input.challengeDescription}

## Instructions Given to the Participant
${input.instructions}

## Evaluation Rubric
${criteriaList}

## Participant's Submission
${input.submissionText}

## Your Task
Evaluate this submission against each rubric criterion. For each criterion:
1. Score from 0-100 (not 0-10)
2. Provide specific justification referencing the submission content
3. Be fair but rigorous — this is a learning platform, so constructive feedback matters

Then calculate the weighted overall score and provide actionable feedback.

Use the submit_evaluation tool to return your structured evaluation.`;
}

const evaluationTool: Anthropic.Messages.Tool = {
  name: 'submit_evaluation',
  description: 'Submit the structured evaluation results for a challenge submission',
  input_schema: {
    type: 'object' as const,
    properties: {
      criteria: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Criterion name matching the rubric' },
            score: { type: 'number', minimum: 0, maximum: 100, description: 'Score from 0-100' },
            justification: { type: 'string', description: 'Specific justification with references to the submission' },
          },
          required: ['name', 'score', 'justification'],
        },
        description: 'Evaluation for each rubric criterion',
      },
      overallScore: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Weighted overall score (0-100)',
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Confidence in the evaluation accuracy (0-1)',
      },
      feedback: {
        type: 'string',
        description: 'Constructive overall feedback paragraph for the participant',
      },
    },
    required: ['criteria', 'overallScore', 'confidence', 'feedback'],
  },
};

export async function evaluateWithClaude(
  input: EvaluationInput,
  options?: { detailed?: boolean }
): Promise<EvaluationOutput> {
  const client = new Anthropic();
  const model = getModelForDifficulty(input.difficulty);
  const prompt = buildEvaluationPrompt(input);

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    tools: [evaluationTool],
    tool_choice: { type: 'tool', name: 'submit_evaluation' },
    messages: [{ role: 'user', content: prompt }],
  });

  // Extract tool use result
  const toolUse = response.content.find(
    (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
  );

  if (!toolUse) {
    throw new Error('AI evaluation did not return structured output');
  }

  const result = toolUse.input as EvaluationOutput;

  // Validate scores are within range
  for (const criterion of result.criteria) {
    criterion.score = Math.max(0, Math.min(100, Math.round(criterion.score)));
  }
  result.overallScore = Math.max(0, Math.min(100, Math.round(result.overallScore)));
  result.confidence = Math.max(0, Math.min(1, result.confidence));

  return result;
}

// Retry with a more capable model if confidence is low
export async function evaluateWithRetry(
  input: EvaluationInput
): Promise<EvaluationOutput> {
  const result = await evaluateWithClaude(input);

  if (result.confidence < 0.7 && input.difficulty !== 'beginner') {
    // Escalate to Opus for low-confidence evaluations
    const retryResult = await evaluateWithClaude(input, { detailed: true });

    // Merge: take the higher-confidence result
    if (retryResult.confidence > result.confidence) {
      return retryResult;
    }
  }

  return result;
}
