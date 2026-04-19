import { gradeMultiChoice, type MultiChoiceGraderConfig } from '../src/lib/services/evaluation/auto-graders/multi-choice-grader';

const config: MultiChoiceGraderConfig = {
  requireReasoning: true,
  minReasoningChars: 30,
  questions: [
    { id: 'q1', correctAnswer: 't', points: 1, explanation: 'Adjectives "delightful, magical" fail Testable.' },
    { id: 'q2', correctAnswer: 's', points: 1, explanation: '7 flows in one story. Fails Small.' },
  ],
};

// Case 1: correct letters WITH adequate reasoning
const case1 = JSON.stringify({
  answers: {
    q1: { letter: 't', why: 'The story uses "delightful" and "magical" — no objective pass/fail test exists for those adjectives.' },
    q2: { letter: 's', why: 'Submit, upload, categorize, route, approve, reimburse, export — clearly more than one sprint of work.' },
  },
});

// Case 2: correct letters but NO reasoning (legacy/bare shape)
const case2 = JSON.stringify({
  answers: { q1: 't', q2: 's' },
});

// Case 3: correct letters but reasoning too short
const case3 = JSON.stringify({
  answers: {
    q1: { letter: 't', why: 'testable' },
    q2: { letter: 's', why: 'too big' },
  },
});

// Case 4: wrong letter q1, right q2 with reasoning
const case4 = JSON.stringify({
  answers: {
    q1: { letter: 'v', why: 'I think it is not valuable because users already feel fine without magic.' },
    q2: { letter: 's', why: 'Way too many steps packed into a single story — clearly breaks Small.' },
  },
});

for (const [name, text] of [
  ['correct + reasoning', case1],
  ['correct + bare (legacy)', case2],
  ['correct + too-short reasoning', case3],
  ['wrong letter q1 + right q2', case4],
] as const) {
  const r = gradeMultiChoice(text, config);
  console.log(`\n=== ${name} ===`);
  console.log(`score=${r.score} passed=${r.passed}/${r.total}`);
  console.log(r.feedback);
}
