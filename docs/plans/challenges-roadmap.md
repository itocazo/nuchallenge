# Challenges Roadmap — Auto-Gradable Expansion

**Status:** in progress (multi-session)
**Owner:** autonomous agent
**Goal:** expand from 15 ai-judge–only challenges to a richer mix that uses the full spectrum of evaluation methods supported by the schema (`ai-judge`, `automated-test`, `hybrid`, `human-review`).

---

## Why

Today every challenge in `src/lib/data.ts` uses `evaluationMethod: 'ai-judge'`. That works but:

1. **Cost & latency:** every submission burns Claude tokens and adds 5–15s of wall-clock time.
2. **Determinism:** AI scoring drifts; auto-graded challenges give learners objective, repeatable signal.
3. **Variety of skills:** code, regex, schema, and "find the bug" challenges deserve crisp pass/fail tests.
4. **Anti-cheat:** automated tests are immune to prompt-injection style cheating.

The schema already supports `automated-test` and `hybrid`; we just need to build the graders and wire them in.

---

## Architecture

### Rubric extension (no schema change required)

`challenges.rubric` is `jsonb` — we can extend it with a `grader` block that the dispatcher reads:

```ts
rubric: {
  criteria: [...],          // unchanged — used for ai-judge & display
  grader?: {
    type: 'regex' | 'structured' | 'code-sandbox' | 'multi-choice',
    config: { ... }         // grader-specific
  }
}
```

`evaluationMethod` decides the dispatch:
- `'ai-judge'` → existing flow (Claude tool_use)
- `'automated-test'` → new auto-grader, no Claude call
- `'hybrid'` → run both, blend the scores (e.g. 60% auto + 40% AI)

### File layout

```
src/lib/services/evaluation/
  ai-judge.ts                  (existing)
  scoring.ts                   (existing)
  evaluate-submission.ts       (existing — Inngest)
  auto-graders/
    index.ts                   (router: pick grader by config.type)
    regex-grader.ts
    structured-grader.ts
    code-sandbox-grader.ts
    multi-choice-grader.ts
    types.ts                   (shared GraderResult interface)
  dispatch.ts                  (new — picks ai-judge vs auto vs hybrid)
```

The dispatcher returns the same `EvaluationOutput` shape that `scoring.ts` already consumes, so the rest of the pipeline (point transactions, level updates, audit) doesn't change.

### Submit-route changes

`runEvaluationInline` in `src/app/api/challenges/[id]/submit/route.ts` calls `dispatch.evaluate(...)` instead of `evaluateWithRetry(...)` directly. Same for the Inngest variant.

---

## Challenge backlog

> **Note:** IDs are now flat sequential (CH-01 through CH-N). The old category-encoded scheme (CH-1x = data, CH-2x = coding, etc.) was dropped — tags handle categorization.

### Wave 1 — auto-grader infrastructure + 3 pilot challenges

| ID    | Title                                  | Type           | Grader        | Status   |
|-------|----------------------------------------|----------------|---------------|----------|
| CH-09 | Log Anomaly Regex                      | beginner       | regex         | **done** |
| CH-07 | Spot the Hallucination — Structured    | intermediate   | structured    | **done** |
| CH-13 | BRL Currency Formatter                 | beginner       | code-sandbox  | **done** |

### Wave 2 — more variety (IDs CH-19 onward)

| ID    | Title                                  | Type           | Grader        | Status   |
|-------|----------------------------------------|----------------|---------------|----------|
| CH-19 | Pix Key Validator                      | intermediate   | code-sandbox  | **done** |
| CH-20 | SQL Injection Triage                   | intermediate   | multi-choice  | **done** |
| CH-21 | OpenAPI Contract Designer              | advanced       | structured    | **done** |
| CH-22 | OAuth Sequence Diagram (Structured)    | intermediate   | structured    | **done** |
| CH-23 | Transaction CSV Aggregator             | intermediate   | code-sandbox  | **done** |
| CH-24 | Idempotency Key Middleware             | advanced       | code-sandbox  | **done** |

### Wave 3 — hybrid challenges (auto-test + ai-judge)

| ID    | Title                                  | Type           | Grader               | Status   |
|-------|----------------------------------------|----------------|----------------------|----------|
| CH-25 | Refactor Spaghetti Code                | advanced       | hybrid (sandbox+ai)  | planned  |
| CH-26 | Optimize a Slow Function               | advanced       | hybrid (bench+ai)    | planned  |
| CH-27 | AI Code Review Checklist               | intermediate   | hybrid               | planned  |

---

## Grader specs

### 1. Regex grader (`regex-grader.ts`)

**Submission shape:** raw regex pattern in `submissionText` (with optional flags as `/pattern/flags`).

**Config:**
```ts
{
  type: 'regex',
  config: {
    mustMatch: string[],     // strings the pattern must match
    mustNotMatch: string[],  // strings it must reject
    maxLength?: number,      // pattern length cap (penalize unbounded .* abuse)
    forbiddenTokens?: string[] // e.g. ['.*'] to forbid trivial wildcards
  }
}
```

**Scoring:**
- 1 point per correct match/reject
- Final % = correct / total
- Penalty if pattern exceeds `maxLength` or contains `forbiddenTokens`

### 2. Structured grader (`structured-grader.ts`)

**Submission shape:** JSON in `submissionText` (we `JSON.parse` it; malformed → 0).

**Config:**
```ts
{
  type: 'structured',
  config: {
    expectedShape: 'list' | 'object',
    answerKey: any,          // canonical answer
    matchMode: 'exact' | 'subset' | 'fuzzy',
    fuzzyThreshold?: number, // for fuzzy match (e.g. 0.8 token-overlap)
    partialCredit?: boolean  // award N/total for partial answers
  }
}
```

For "find the 5 errors" challenges: `expectedShape: 'list'`, `matchMode: 'fuzzy'` so users don't have to quote the planted error verbatim.

### 3. Code sandbox grader (`code-sandbox-grader.ts`)

**Submission shape:** JS/TS function in `submissionText`. We extract a named export (e.g. `formatBRL`) and run it in Node `vm` against test cases.

**Safety:**
- `vm.createContext({})` with no Node globals
- 1s execution timeout per test
- Memory cap via context isolation
- Reject submissions referencing `require`, `process`, `import`, `eval`, `Function`

**Config:**
```ts
{
  type: 'code-sandbox',
  config: {
    language: 'javascript',
    entrypoint: string,      // e.g. 'formatBRL'
    testCases: Array<{
      input: any[],          // args to spread
      expected: any,         // deep-equal check
      description?: string
    }>,
    timeoutMs?: number       // default 1000
  }
}
```

**Scoring:** % of passing tests. 100% pass = 100 score.

### 4. Multi-choice grader (`multi-choice-grader.ts`)

**Submission shape:** JSON `{ answers: { q1: 'a', q2: 'c', ... } }`.

**Config:**
```ts
{
  type: 'multi-choice',
  config: {
    questions: Array<{
      id: string,
      correctAnswer: string | string[], // single or multi-select
      points?: number                   // weight (default 1)
    }>
  }
}
```

---

## Hybrid scoring

For `hybrid` challenges, run both the AI judge and the auto-grader, then blend:

```ts
finalScore = autoWeight * autoScore + aiWeight * aiScore
```

Default weights: `auto: 0.7, ai: 0.3` (auto-grader is the source of truth, AI adds nuance).

---

## Multi-session execution plan

This work spans sessions. Each session should:

1. Read this doc.
2. Check the **Status** column in the tables above.
3. Pick the next `planned` item.
4. Implement, test end-to-end (insert challenge → submit → verify scoring), update status to `done`.
5. Commit and update this doc.

### Session 1 (DONE)
- [x] Write this roadmap
- [x] Build `auto-graders/` infrastructure (types, regex, structured, code-sandbox, dispatch)
- [x] Wire dispatch into submit route AND Inngest worker
- [x] Implement CH-09 (regex), CH-07 (structured), CH-13 (code-sandbox) end-to-end
- [x] Renumbered all IDs to flat sequential (CH-01 to CH-18)
- [x] Add to seed data, persist to DB
- [x] Smoke tests (10 unit + 9 e2e), all green
- [x] Type-checks pass

**Artifacts produced this session:**
- `src/lib/services/evaluation/auto-graders/types.ts`
- `src/lib/services/evaluation/auto-graders/regex-grader.ts`
- `src/lib/services/evaluation/auto-graders/structured-grader.ts`
- `src/lib/services/evaluation/auto-graders/code-sandbox-grader.ts`
- `src/lib/services/evaluation/auto-graders/index.ts`
- `src/lib/services/evaluation/auto-graders/__smoke_test__.ts`
- `src/lib/services/evaluation/dispatch.ts`
- `src/lib/services/evaluation/__e2e_smoke_test__.ts`
- `scripts/verify-new-challenges.ts`
- 3 new entries in `src/lib/data.ts`
- Extended `Challenge.rubric` type in `src/lib/types.ts`

**To verify after a fresh checkout:**
```sh
npx tsx src/lib/services/evaluation/auto-graders/__smoke_test__.ts
npx tsx src/lib/services/evaluation/__e2e_smoke_test__.ts
DATABASE_URL=... npx tsx scripts/verify-new-challenges.ts
```

### Session 2 (DONE)
- [x] Implement CH-19 (Pix Key Validator — code-sandbox)
- [x] Implement CH-20 (SQL Injection Triage — multi-choice grader, NEW)
  - [x] Built `multi-choice-grader.ts` TDD-style (10 unit tests)
  - [x] Wired into `auto-graders/index.ts` switch
  - [x] Supports single-select (case-insensitive) and multi-select (order-insensitive set)
  - [x] Weighted scoring via `question.points`
- [x] Implement CH-21 (OpenAPI Contract Designer — structured)
  - [x] Extended `gradeObjectMode` to treat arrays as order-insensitive sets (TDD)
- [x] Extended e2e smoke tests (9 → 19 cases, all green)
- [x] Re-seeded DB (18 → 21 challenges)

**Artifacts produced this session:**
- `src/lib/services/evaluation/auto-graders/multi-choice-grader.ts` (new)
- `src/lib/services/evaluation/auto-graders/structured-grader.ts` (object-mode arrays now order-insensitive)
- `src/lib/services/evaluation/auto-graders/index.ts` (wired multi-choice)
- `src/lib/services/evaluation/auto-graders/__smoke_test__.ts` (10 → 22 tests)
- `src/lib/services/evaluation/__e2e_smoke_test__.ts` (9 → 19 tests)
- 3 new entries in `src/lib/data.ts`: CH-19, CH-20, CH-21
- `scripts/verify-new-challenges.ts` (covers 6 auto-graded IDs)

### Session 3 (DONE)
- [x] Implement CH-22 (OAuth Sequence Diagram — structured, keyed-step shape)
- [x] Implement CH-23 (Transaction CSV Aggregator — code-sandbox)
- [x] Implement CH-24 (Idempotency Key Middleware — code-sandbox, harder)
  - [x] Extended code-sandbox grader with optional per-test `harness` field
    so factory-style entrypoints (like `createIdempotencyStore`) can run
    multi-step scenarios inside the same sandbox context.
- [x] Extended e2e smoke tests (19 → 29 cases, all green)
- [x] Re-seeded DB (21 → 24 challenges)

**Artifacts produced this session:**
- `src/lib/services/evaluation/auto-graders/code-sandbox-grader.ts` (harness support)
- 3 new entries in `src/lib/data.ts`: CH-22, CH-23, CH-24
- `src/lib/services/evaluation/__e2e_smoke_test__.ts` (19 → 29 tests)
- `scripts/verify-new-challenges.ts` (covers 9 auto-graded IDs)

**Deferred to Session 4:**
- Try a real submission via the UI for each of the 9 auto-graded challenges
- Inspect and improve UI for code-sandbox challenges (currently a textarea)

### Session 4 (planned)
- [ ] Wave 3: hybrid challenges
- [ ] CH-25, CH-26, CH-27

### Session 5+ (stretch)
- [ ] Replace Node `vm` with `isolated-vm` for production safety
- [ ] Add per-challenge "show first N test cases" UI
- [ ] Track auto-grader cost savings vs ai-judge in admin analytics

---

## Open questions

- **Code-sandbox safety:** Node `vm` is *not* a security boundary. Acceptable for trusted Nubank employees in dev/staging. For production hardening, consider `isolated-vm` or a worker subprocess with seccomp.
- **Submission UI:** code-sandbox challenges need a code editor in the UI. Today's textarea works as a fallback.
- **Test case visibility:** should learners see the test cases up-front (TDD style) or only after submission? Default: show 50% of tests up-front, hide the rest as "hidden tests".
