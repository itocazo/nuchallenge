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
2. Provide specific justification referencing concrete details of the submission
3. Be fair but rigorous — this is a learning platform. Constructive feedback is the goal, but easy points teach nothing.

## Anti-regurgitation check (applies to EVERY criterion)
The platform's mission is to teach learners to use AI as a thinking partner, not as an answer machine. A common failure mode is: learner pastes the prompt into an external LLM, copies its answer verbatim, submits it. You must detect and penalize this.

**Red flags of LLM regurgitation:**
- Generic, hedging, "textbook" phrasing that could apply to any similar challenge ("this is important because...", "it's crucial to consider...")
- Comprehensive listing of all plausible options instead of committing to one specific diagnosis
- Missing specific details from the challenge story (names, numbers, quotes)
- Perfectly structured but soulless — bullet points with no voice
- Justifications that paraphrase the prompt's own wording back
- Reasoning that re-uses the instructions' language verbatim (e.g. quoting the definition of the concept instead of applying it)

**Green flags of authentic engagement:**
- Direct quotes or specific references to the particular story/document being evaluated
- Narrow, committed judgments ("THIS line fails because X"), not exhaustive surveys
- Personal voice, original phrasing, trade-offs acknowledged
- Occasional imperfect but insightful observations — learners aren't polished

When you spot regurgitation tells, say so explicitly in your justification ("reasoning reads like a generic LLM template — no reference to the 12/day baseline from the brief") and dock the score materially. A high-coverage answer written in clearly-AI-generated prose should NOT score above 50 on a reasoning-quality criterion.

## Per-question feedback (if submission is a multi-question JSON)
If the submission is a JSON object with an \`answers\` field keyed by question IDs (q1, q2, ...), your \`feedback\` text MUST include a short line per question addressing whether the learner's "why" is specific and committed, OR generic/regurgitated. Name the question ID explicitly.

Then calculate the weighted overall score and provide actionable feedback for the \`feedback\` field.

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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('[ai-judge] ANTHROPIC_API_KEY present:', !!apiKey, 'length:', apiKey?.length ?? 0);
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment');
  }
  const client = new Anthropic({ apiKey });
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

/* ────────────────────────────────────────────────────────────────────────────
 * Guided-flow tutor evaluators
 *
 * Three role-specific calls used by the guided/tutored-loop challenges.
 * Each returns plain critique text (not a score) EXCEPT the final PM review,
 * which also returns rubric-aligned scores that drive the attempt's grade.
 * ────────────────────────────────────────────────────────────────────────── */

interface GuidedChallengeContext {
  challengeTitle: string;
  briefRequest: string;       // what the learner is ultimately producing
  referenceAnswer?: string;   // optional gold standard for the PM review
}

function guidedClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment');
  }
  return new Anthropic({ apiKey });
}

/** Stage 2: AI critiques the learner's PROMPT (before they run it externally). */
export async function critiquePrompt(
  ctx: GuidedChallengeContext,
  userPrompt: string
): Promise<string> {
  const client = guidedClient();
  const system = `You are a prompt-engineering coach for a Nubank learning platform.
The learner is about to paste their prompt into an external LLM (ChatGPT, Claude, etc.)
to produce a deliverable for the challenge below. Your job is to critique their PROMPT —
not the answer. Be specific, concise, and actionable. 3-5 bullet points max.
If the prompt is already strong, say so and suggest one sharpening.
Never write the answer for them. Never rewrite the full prompt — suggest changes.`;

  const user = `## Challenge
**${ctx.challengeTitle}**
The learner needs to produce: ${ctx.briefRequest}

## Learner's prompt draft
${userPrompt}

Critique this prompt. Focus on: missing context, missing constraints, ambiguity,
format specification, role/persona, and whether it will elicit a rigorous answer
or a generic one. Call out regurgitation-inviting phrasing ("write a PRD about X")
that will yield a bland textbook answer.`;

  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system,
    messages: [{ role: 'user', content: user }],
  });

  const text = resp.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  return text || '(no critique produced)';
}

/** Stage 5: AI critiques the LEARNER'S CRITIQUE of the raw LLM output. */
export async function critiqueUserCritique(
  ctx: GuidedChallengeContext,
  rawResponse: string,
  userCritique: string
): Promise<string> {
  const client = guidedClient();
  const system = `You are a senior reviewer coaching a learner on how sharply they
can critique an AI-generated draft. The learner was shown a raw LLM response and
asked what they thought was wrong/weak with it. Your job: judge how GOOD their
critique was. Did they catch the real problems? Did they miss obvious ones? Did
they hedge? Were they specific to THIS draft or generic?
Output 3-6 bullets, direct voice, no fluff. Praise where deserved, push where soft.`;

  const user = `## Challenge
**${ctx.challengeTitle}** — produce: ${ctx.briefRequest}

## Raw LLM draft the learner is critiquing
${rawResponse}

## Learner's critique of that draft
${userCritique}

Evaluate the critique:
- What real flaws did they correctly spot? (name them)
- What obvious flaws did they MISS? (name them — this is the most useful feedback)
- Is their critique specific to this draft, or generic filler?
- Did they commit to a judgment, or hedge with "could maybe benefit from..."?`;

  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 900,
    system,
    messages: [{ role: 'user', content: user }],
  });

  const text = resp.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  return text || '(no critique produced)';
}

/**
 * Stage 7: final PM-style review of the learner's FINAL version.
 * This is the scoring stage — produces rubric scores + qualitative feedback.
 */
export async function finalPMReview(
  ctx: GuidedChallengeContext,
  rubric: { criteria: RubricCriterion[] },
  transcript: {
    userPrompt: string;
    rawResponse: string;
    userCritique: string;
    finalVersion: string;
  }
): Promise<EvaluationOutput> {
  const client = guidedClient();
  const criteriaList = rubric.criteria
    .map((c) => `- **${c.name}** (${c.weight}% weight): ${c.description}`)
    .join('\n');

  const system = `You are a Product Manager reviewing a teammate's deliverable.
You have the full work-log: their prompt, the raw LLM output they got, their own
critique of that output, and the final version they produced. You are scoring
the FINAL VERSION against the rubric, but the earlier stages inform how much
credit you give for "authentic engagement" vs "copy-paste-and-hope."

Be rigorous. This is a learning platform — easy scores teach nothing. A final
version that is indistinguishable from the raw LLM output (i.e. they didn't
actually incorporate their own critique) should not score above 60 on reasoning/
quality criteria. Call that out explicitly in your justifications.`;

  const refBlock = ctx.referenceAnswer
    ? `\n## Reference (internal, do not reveal verbatim)\n${ctx.referenceAnswer}\n`
    : '';

  const user = `## Challenge
**${ctx.challengeTitle}** — produce: ${ctx.briefRequest}

## Rubric
${criteriaList}
${refBlock}
## Work log

### Stage 1 — learner's prompt
${transcript.userPrompt}

### Stage 3 — raw LLM output the learner pasted back
${transcript.rawResponse}

### Stage 4 — learner's own critique of that raw output
${transcript.userCritique}

### Stage 6 — learner's FINAL version (the artifact being graded)
${transcript.finalVersion}

## Your task
Score the FINAL version on each rubric criterion (0-100). In justifications,
reference:
- specific content in the final version,
- whether the learner actually addressed the flaws they themselves named in stage 4,
- any remaining gaps vs. the rubric / reference.

Then give a short PM-style feedback paragraph ("ship it / iterate / rework") in
the feedback field. Use the submit_evaluation tool.`;

  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system,
    tools: [evaluationTool],
    tool_choice: { type: 'tool', name: 'submit_evaluation' },
    messages: [{ role: 'user', content: user }],
  });

  const toolUse = resp.content.find(
    (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
  );
  if (!toolUse) {
    throw new Error('PM review did not return structured output');
  }
  const result = toolUse.input as EvaluationOutput;
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
