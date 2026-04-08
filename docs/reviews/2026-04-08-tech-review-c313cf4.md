# NuChallenge — Tech Review

**Version:** commit `c313cf4` (Wave 5 — CH-04/06/10/12 converted to auto-graded)
**Date:** 2026-04-08
**Scope:** architecture, correctness, security, performance, testing, hygiene
**Reviewer:** autonomous audit agent

---

## TL;DR

Solid MVP architecture with clean separation between dispatcher, auto-graders,
and AI-judge. The auto-grader infrastructure is production-ready. Main risks
are **zero automated tests in CI**, **duplicated evaluation logic between
inline and Inngest paths**, **a weak CSP plus unhardened Node `vm` sandbox**,
and **several race conditions in attempt handling**. None of these are
end-of-the-world — but any of them could bite in production.

---

## 1. Architecture overview

**Stack**
- Next.js 16 App Router (RSC + client islands), TypeScript strict
- Drizzle ORM + Neon Postgres
- NextAuth v5 (Credentials provider, JWT strategy)
- Anthropic Claude API via `tool_use`
- Inngest v4 (optional async queue)
- Tailwind CSS v4

**Layering**
```
src/app/                Next.js routes — API + pages
src/lib/services/       business logic (evaluation, scoring, audit, email)
src/lib/validators/     Zod schemas
src/lib/data.ts         seed content (1742 lines — 30 challenges + demo users)
src/db/schema.ts        Drizzle schema, lazy connection proxy
src/components/         mostly client components (workspace, admin, profile)
scripts/                one-off ops + smoke tests
```

**Business-logic distribution**
- **Inline path:** `POST /api/challenges/[id]/submit` → `runEvaluationInline()`
  calls `dispatchEvaluation()` → writes `attempts` + `pointTransactions` rows.
- **Inngest path:** same pipeline wrapped as an Inngest function, enabled by
  `USE_INNGEST=true` + a valid event key. Unused in practice today.
- **Dispatcher** (`src/lib/services/evaluation/dispatch.ts`) chooses
  `ai-judge` / `automated-test` / `hybrid` (0.7 auto + 0.3 ai blend).
- **Auto-graders:** regex / structured / code-sandbox / multi-choice, plus a
  harness-mode for multi-step sandbox scenarios.

**Strengths**
- Pluggable grader abstraction (`AutoGraderResult`, `toEvaluationOutput`)
  keeps the rest of the pipeline untouched when adding graders.
- DB role checks on every admin hit (`requireAdmin()`) instead of trusting JWT.
- Comprehensive audit logging (`logAuditEvent`) for LGPD.
- Zod validators on every mutation endpoint.

---

## 2. Architecture failures / smells

### P0 — Security

1. **CSP allows `unsafe-eval` and `unsafe-inline`** — `next.config.ts:10`.
   Defeats the main purpose of CSP. Next.js + Tailwind v4 can ship without
   either; use nonces or hashes for the bits that still need inline.
2. **Node `vm` is not a security boundary** —
   `src/lib/services/evaluation/auto-graders/code-sandbox-grader.ts`.
   The forbidden-token check is a literal `includes()` pass, which is trivially
   bypassable (`['e','v','a','l'].join('')`, `this['con'+'structor']`).
   Context is empty-object + `codeGeneration: { strings: false, wasm: false }`,
   which helps — but `vm.Script.runInContext` still shares the same v8 isolate.
   Acceptable for trusted internal users; **not acceptable for untrusted
   submissions or for any multi-tenant future.**
3. **No rate limiting on `/api/challenges/[id]/submit`** even though
   `@upstash/ratelimit` is already in `package.json`. One misbehaving client
   can burn through the Anthropic budget.
4. **Plaintext passwords in welcome emails** — `src/lib/services/email.ts`.
   Also logs to stdout in the dev fallback. Replace with a one-time set-password
   link signed by `NEXTAUTH_SECRET`.
5. **`USE_INNGEST` opt-in is fuzzy** — `submit/route.ts` treats any event key
   ≥ 32 chars as “real,” so a placeholder of 32 x’s enables Inngest
   accidentally. Gate on an explicit `USE_INNGEST=true` env var.

### P1 — Correctness

6. **Race in `POST /api/challenges/[id]/start`** —
   `src/app/api/challenges/[id]/start/route.ts:28-93`. The existence check and
   the `INSERT` are two separate statements, no transaction, no unique
   constraint. Two concurrent tabs create two `in_progress` attempts and the
   3-attempt cap silently becomes 4. Fix with either a partial unique index
   (`UNIQUE (user_id, challenge_id) WHERE status = 'in_progress'`) or a
   `SELECT … FOR UPDATE` inside a transaction.
7. **Two copies of the evaluation pipeline** — `runEvaluationInline` in
   `submit/route.ts` and `evaluateSubmission` in
   `src/lib/services/evaluation/evaluate-submission.ts`. If one changes and the
   other doesn’t, scores diverge depending on which queue is active. Extract
   a single `runEvaluation(attemptId)` and call it from both.
8. **Score override doesn’t recompute level or badges.** Admin edits to
   `attempts.qualityScore` adjust `users.pointsTotal` via a point transaction,
   but `evaluateBadges()` / level recomputation is never re-run. Stats drift
   until the user completes another challenge.
9. **Hybrid scoring loses confidence.** `dispatch.ts` takes
   `Math.max(autoConfidence, aiConfidence)` for the blended metric even though
   the auto-graders report a hardcoded `1.0`. Result: hybrid challenges always
   report confidence 1.0, masking weak AI signals.
10. **Auto-graders report only an overall score** — no per-criterion
    breakdown. `toEvaluationOutput` then fills every rubric criterion with the
    same number, which is dishonest feedback. The structured and
    code-sandbox graders could trivially emit per-criterion pass/fail.
11. **Timezone drift on streaks** — `lastActivityDate` is stored as a `date`
    but set from `new Date().toISOString().split('T')[0]` server-side (UTC).
    A user in São Paulo who submits at 22:00 BRT lands on the next UTC day
    and gets a streak gap they didn’t earn. Store UTC, compute streaks
    against the user’s timezone, or at least pick a Nubank canonical tz.

### P2 — DX / maintainability

12. **`GraderConfig.config: Record<string, unknown>`** is not a discriminated
    union. Every grader casts at runtime. Turn it into
    `{ type: 'regex'; config: RegexGraderConfig } | { type: 'structured'; ... }`
    and the compiler will catch mismatches.
13. **Inconsistent API error shapes.** Some routes return `{ error }`, others
    `{ message }`; some use 400 for missing fields, others 422. Standardize in
    `api-utils.ts`.
14. **Admin challenge ID generation is brittle** — slug-from-title in
    `src/app/api/admin/challenges/route.ts`. Empty titles produce empty IDs;
    duplicates collide. Use `nanoid` or slug + short hash.
15. **`src/lib/data.ts` is 1742 lines.** It’s the single source of truth for
    seed challenges and is now manipulated often. Split by wave or by grader
    type; otherwise every PR touches the same file and merge conflicts balloon.
16. **Lazy DB connection proxy** (`src/db/index.ts`) swallows init errors until
    first query. OK in practice but makes startup failures confusing.

### P3 — Performance

17. **Leaderboard N+1** — subquery per user for `challengesCompleted`. At 50+
    users this is already measurable. Use a CTE or a materialized
    `user_stats` view.
18. **Audit log list queries are unbounded / unsorted.** `limit(50)` with no
    `orderBy(desc(createdAt))` returns arbitrary rows.
19. **No `next/image`** on avatar / challenge-thumbnail paths; TEXT URLs
    served raw.

---

## 3. Obsolete / dead code

- **`scripts/clear-attempts.ts`, `scripts/clean-db.ts`** — one-off ops scripts
  with no header explaining when to run them. Either delete or move into
  `scripts/ops/` with docs.
- **`src/lib/services/evaluation/auto-graders/__smoke_test__.ts`** and
  **`__e2e_smoke_test__.ts`** — informal smoke harnesses not wired to any test
  runner. They are useful but they masquerade as tests. Either promote to
  Vitest (`.test.ts`) or rename to `smoke.ts`.
- **`src/lib/services/evaluation/evaluate-submission.ts`** — Inngest copy of
  the inline path. Delete after the consolidation in #7.
- **`scripts/smoke-ui-12.ts`** was renamed to `smoke-ui-16.ts` in this commit;
  verify there are no stale references in CI or docs.
- No commented-out code blocks found. Good hygiene there.

---

## 4. Testing gaps

There are **zero `*.test.ts` / `*.spec.ts` files** in the tree. Everything
relies on:
1. `tsc --noEmit` for type safety.
2. The `__smoke_test__.ts` + `__e2e_smoke_test__.ts` harnesses (60 cases,
   in-process, run manually).
3. `scripts/smoke-ui-16.ts` — real HTTP smoke against a running dev server.

Critical uncovered areas:

| Area | Risk |
|---|---|
| Auto-graders (regex/structured/code-sandbox/multi-choice) | High — core platform |
| Dispatcher + hybrid blending | High — scoring correctness |
| Scoring (`scoring.ts`) — bonuses, levels, badges | High — user-visible points |
| Auth (`requireAuth`, `requireAdmin`, suspension) | High — authorization |
| `/start` + `/submit` race behavior | Medium — duplicate attempts |
| Admin score override path | Medium — audit integrity |

**Recommendation:** adopt Vitest (zero-config in Next), port the smoke files
into real `.test.ts` files, add a CI job, target ≥60% on
`src/lib/services/**` before adding new features.

---

## 5. Dependency & config hygiene

**Suspect deps**
- `next-auth@5.0.0-beta.30` — still beta, pinned. Track breaking changes.
- `@upstash/ratelimit` + `@upstash/redis` — present but unused; either wire
  up or remove.
- `SLACK_BOT_TOKEN` + `SLACK_WEBHOOK_URL` — listed in `.env.example`, never
  read in code.

**Env vars used but undocumented in `.env.example`**
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `USE_INNGEST`

**`next.config.ts`**
- CSP issue (above).
- No `images.remotePatterns`.
- No cache headers for static assets.

**`tsconfig.json`**
- `strict: true` ✓
- `skipLibCheck: true` — fine for speed, but hides dep version conflicts.

**Seed drift**
- `src/db/seed.ts` was just fixed (this commit) from `onConflictDoNothing`
  → `onConflictDoUpdate`, which is an improvement. Still no way to detect
  *deleted* challenges — they remain as orphans in the DB. Add a
  “deactivate missing” pass or ship real Drizzle migrations.

---

## 6. Tech improvement backlog (prioritized)

### P0 — fix before any production/external rollout
1. Harden CSP in `next.config.ts` — drop `unsafe-eval` + `unsafe-inline`.
2. Wire up `@upstash/ratelimit` on `/submit` and `/start`.
3. Replace plaintext-password welcome emails with signed magic links.
4. Replace Node `vm` with `isolated-vm` or a worker subprocess if the platform
   ever opens up past trusted employees.

### P1 — correctness
5. Consolidate the two evaluation pipelines into a single service function.
6. Fix the `start` race with a partial unique index or transactional insert.
7. Recompute badges + level after admin score overrides.
8. Return per-criterion scores from auto-graders; honest feedback in the UI.
9. Fix hybrid confidence blending (weighted average, not max).
10. Normalize timezone handling for streaks.

### P2 — DX
11. Discriminated union on `GraderConfig`.
12. Standardize API error shape.
13. Adopt Vitest + CI; port smoke files into real tests; target ≥60%.
14. Split `src/lib/data.ts` into per-wave files or move to DB-first authoring.
15. Standardize admin challenge ID generation (nanoid, not slug).

### P3 — perf
16. Materialize `user_stats` or rewrite leaderboard query as a CTE.
17. Paginate audit logs properly; sort by `desc(createdAt)`.
18. Use `next/image` for avatars.

---

## 7. What I would not touch

- The auto-grader abstraction itself — it’s clean, extensible, and has already
  absorbed 4 grader types + a harness mode without growing warts.
- The dispatcher’s fallback-to-ai-judge-on-auto-failure behavior — it’s the
  right call for hybrid challenges.
- The `requireAdmin` DB-backed role check — the anti-stale-JWT pattern is
  correct and should be kept.
- Drizzle + Neon — appropriate for this workload, no reason to churn.

---

## Final scorecard

| Dimension | Grade | Notes |
|---|---|---|
| Architecture | **B+** | Clean layering, pluggable graders; eval-path duplication drags it down. |
| Security | **C** | CSP + sandbox + rate-limit gaps are all fixable in <1 day each. |
| Correctness | **B** | Race conditions and badge-after-override bugs are known-unknowns. |
| Testing | **D** | Zero automated tests in CI. Smoke suites exist but are manual. |
| DX | **B** | `tsc` clean, strict TS, zod everywhere, but config drift across env vars. |
| Performance | **B+** | Fine at current scale; leaderboard N+1 will hurt at 500 users. |

Overall: **B / B−**. A focused two-week security + testing pass would bring
this to an A-minus.
