# NuChallenge — Product Review

**Version:** commit `c313cf4` (Wave 5 — 16/30 challenges auto-graded)
**Date:** 2026-04-08
**Scope:** user journey, catalog, gamification, content quality, retention,
admin UX, Nubank fit
**Reviewer:** autonomous audit agent

---

## TL;DR

NuChallenge has a **solid content-library MVP** but is **not yet a
community**. The core submit → grade → score loop works and the best
challenges (security, architecture, code refactoring) are genuinely engaging.
The gaps are almost entirely in **motivation plumbing**: streaks and badges
exist in the schema but are invisible or inert; there is no onboarding, no
daily cadence, no appeal UI, and scoring math is opaque. Content variance on
the 11 remaining AI-judge challenges is high. Mobile is broken. If the goal
is to ship this to Nubank employees in Q2, the P0 list below is two weeks of
work.

---

## 1. Current product state

- **30 challenges** across beginner / intermediate / advanced.
- **16** auto-graded (regex / structured / code-sandbox / multi-choice),
  **3** hybrid (auto + AI), **11** pure AI-judge.
- **End-to-end flows working:** signup → browse → start → submit → score →
  profile → leaderboard.
- **Admin dashboard** with KPI cards, challenge toggles, user list, audit log.
- **Reviewer system** wired in the schema with point-transaction attribution,
  but without a dedicated review UI.
- **Gamification fields** present (level, points, streaks, badges, tag
  proficiency) — most are read but only some are actually written.
- **Anti-cheat + rubric + hints system** present and respected.

---

## 2. What works well

1. **The auto-graded loop is tight and trustworthy.** 16 challenges return a
   deterministic, cached score in < 1 second. The `VisibleTestCases` panel +
   tab-aware code editor is a real upgrade over the original textarea.
2. **The best challenges are really good.** CH-19 (Pix key classifier),
   CH-20 (SQL injection triage), CH-22 (OAuth sequence), CH-24 (idempotency),
   CH-25 (refactor spaghetti), CH-26 (optimize slow function), CH-30 (token
   bucket rate limiter) are all grounded, specific, and teachable.
3. **The home page information density is good.** Filter by tag + difficulty
   + search + "recommended" lanes mean a returning user finds something fast.
4. **Score breakdown exists on the results page** — base / quality / speed /
   streak / reviewer adjustment — even if the formula itself isn't explained.
5. **Draft autosave in the workspace** is the kind of small detail that
   prevents real user anger.
6. **Admin KPI dashboard is honest** — no fake numbers, real counts, real
   audit log. That’s a rare thing in internal tools.
7. **Nubank BR context shows up in content** — Pix, CPF, CNPJ, BRL formatting,
   Nubank-specific facts in hallucination challenges. Users will feel this is
   for *them*, not a generic SaaS.

---

## 3. Product gaps & broken experiences

### User journey

1. **No onboarding.** First login drops the user on the full challenge list
   with zero tutorial, zero empty-state guidance, zero "start here." Expected
   bounce rate on day 1 is high.
2. **Workspace exit has no unsaved-work guard.** Navigation away blows the
   draft if autosave hasn’t fired in the last 30 seconds. Add a
   `beforeunload` prompt or intercept `<Link>` clicks.
3. **Results page without `?attempt=` query param falls back to a fake demo
   score.** Shareable URLs can therefore show misleading numbers. Should
   redirect to challenge detail or show an explicit "no attempt" state.
4. **No “next challenge” CTA after completion.** Flow dead-ends on the
   results page; the user has to go back to the list and re-pick manually.
5. **Hybrid challenges are not labeled in the catalog.** CH-25/26/27 just
   look like regular advanced challenges until the user submits and gets a
   blended score with no explanation.
6. **Hidden test cases are not announced.** On code-sandbox challenges, the
   `VisibleTestCases` panel shows 50% of cases but the instructions don’t
   say so. Users who pass visible tests and fail on hidden ones feel tricked,
   not taught.

### Gamification & retention

7. **Streaks exist but are invisible.** `currentStreak` and `longestStreak`
   are computed and stored but have no home-page prominence, no reminder
   notification, no risk visualization (“your streak ends in 4 hours”).
   Current signal-to-motivation ratio is zero.
8. **Badges are in the schema, in the profile UI, and never awarded.** Every
   user’s badge grid is empty, including seed demo users. Either wire the
   awards (see the tech audit P1 item) or remove the UI to stop advertising
   a feature that doesn’t exist.
9. **No daily cadence.** No "Today’s Challenge," no weekly theme, no seasonal
   event. A motivated user can clear the whole catalog in a weekend and have
   no reason to return.
10. **No notifications anywhere.** No email reminders, no Slack webhook
    (even though `SLACK_WEBHOOK_URL` is referenced in env), no in-app toasts
    for streaks or badges.
11. **No peer / social proof.** Leaderboard is read-only; no comments, no
    team view, no cohort tracking, no "your department rank."

### Content & catalog

12. **The 11 remaining AI-judge challenges are wildly uneven.**
    - *Strong:* CH-05 (elicitation transcript), CH-14 (microcopy), CH-15
      (accessibility audit).
    - *Weak:* CH-08 (SQL generation) — rubric asks for correctness but has no
      test data to validate against.
    - *Generic / hallucination-prone:* CH-01 (first AI PRD), CH-02 (user story
      decomposition), CH-11 (alignment essentials), CH-16 (user research
      synthesis), CH-17 (AI impact assessment), CH-18 (AI governance). These
      are meta-AI tasks with vague rubrics where the grader itself is an AI.
      Users can game them with cooperative prose.
13. **CH-03 (prioritization framework battle)** depends on CH-02, which is
    itself weak. The dependency chain concentrates the soft-rubric risk.
14. **No "very short" (≤10 min) micro-challenges.** All beginner challenges
    are 20-30 min. There’s no option for "one thing during lunch."
15. **No expert tier.** Ceiling is "advanced." Senior engineers cap out fast.
16. **No team / collaboration, no incident response, no soft skills, no
    Nubank-specific regulatory scenarios (LGPD, Bacen, fraud playbooks).**
    Plenty of white space for content waves 6+.
17. **Tag sprawl.** Tags like "Coding", "Prompt Engineering", "AI Evaluation",
    "Critical Thinking" overlap; "proficiency by tag" on the profile will
    feel arbitrary without a clean taxonomy.

### Feedback loop & scoring transparency

18. **The scoring formula is nowhere visible.** Users see
    `pointsBase: 250` on a challenge card but have no way to know that
    their 82% score will become `~205 + bonuses` points. After the fact
    they see the breakdown on the results page but can’t predict it.
19. **No explanation of speed/streak bonus thresholds.** Users don’t know how
    to *earn* a speed bonus — they just sometimes get one.
20. **AI-judge feedback is opaque and unappealable.** The `appeals` table
    exists. There is no UI to file an appeal, no admin page to review one.

### Admin & reviewer

21. **No admin UI to create challenges.** Authoring is developer-only via
    `src/lib/data.ts` + reseed. This is the hard blocker on content velocity:
    every new challenge requires a code change + DB reseed.
22. **No human-review / appeals queue.** The reviewer bonuses feature (shipped
    earlier) has no discovery path; no `/admin/appeals` or `/admin/review`.
23. **No per-user point ledger drill-down.** Admins can see KPI totals but
    can’t answer "why does Sofia have 2400 points?" without a raw DB query.

### Mobile & responsive

24. **Workspace is desktop-first.** `lg:grid-cols-3` stacks brief + editor +
    tests vertically on mobile; the code editor textarea has no mobile keyboard
    hints; timer scrolls out of view. Unusable on a phone.
25. **Login/signup pages are fine on mobile;** the problem is only the
    workspace and admin pages.

### Localization & cultural fit

26. **UI is English-only.** Challenge content mixes English prose with
    Portuguese terms (Pix, CPF, R$, Nubank-BR facts). Non-native English
    speakers at Nubank will notice the dissonance.
27. **No “voice of Nubank”** in the UI copy. Empty states, error messages,
    and confirmation dialogs are generic SaaS. Nubank has a very specific
    brand voice (CH-14 is literally a challenge about it) — the platform
    should use it.

---

## 4. Challenge catalog assessment

### Quality matrix (rough)

| Bucket | Count | Examples | Quality |
|---|---:|---|---|
| Code (sandbox) | 10 | CH-09, 13, 19, 23, 24, 25, 26, 28, 30, 10 | **A** — clear, testable, teachable |
| Structured / multi-choice | 6 | CH-04, 06, 07, 20, 21, 22, 29 | **A−** — crisp rubric, order-insensitive |
| Hybrid (auto + ai) | 3 | CH-25, 26, 27 | **B+** — auto portion strong; AI add-on undertested |
| Open-ended AI-judge | 11 | CH-01–03, 05, 08, 11, 14–18 | **C** — highly variable, appeal risk |

### Thematic coverage

- **Well covered:** code refactoring, security triage, Pix/CPF validation,
  algorithms, API design, sequence diagrams, idempotency, rate limiting.
- **Missing:** distributed systems fundamentals (consensus, event sourcing),
  observability (traces, metrics, SLOs), data pipelines, experiment design,
  on-call / incident response, LGPD + Bacen compliance, fraud scenarios,
  payments reconciliation, peer code review, pair programming simulation,
  soft skills (conflict, negotiation), BR regulatory deep-dives.

### Difficulty curve

- Beginner ≈ 7, Intermediate ≈ 16, Advanced ≈ 7, Expert = 0.
- Healthy middle, thin on both ends. Adding 5 expert-tier challenges and 5
  "micro" (≤10 min) challenges would rebalance it.

---

## 5. Motivation & retention holes

A retention loop needs: **trigger → variable reward → progress →
anticipation**. Current loop:

- **Trigger:** none. No notifications, no email, no Slack. User must remember.
- **Variable reward:** partially. Score is deterministic for auto-graded
  challenges; AI-judge scores vary but the variation feels arbitrary, not
  exciting.
- **Progress:** partial. Level and points increase, but streaks and badges
  are invisible.
- **Anticipation:** none. No "unlock tomorrow," no daily challenge, no season.

**Concretely, today the platform gives a user zero reason to log in a second
day.** Fixing this is the single highest-ROI product investment.

---

## 6. Product improvement backlog

### P0 — ship-blockers / credibility fixes (≈ 2 weeks)

1. **Add no-attempt guard on results page.** Redirect or show empty state
   instead of a fake score. Prevents public screenshots of garbage data.
2. **Workspace unsaved-work guard.** `beforeunload` + intercept in-app nav.
3. **Scoring transparency.** On the challenge detail page show
   "base × (score/100) + bonuses" with concrete examples. On the results
   page show the formula line.
4. **Label hybrid challenges** in the catalog and on the challenge detail.
   "70% auto-graded, 30% AI-judged" in plain language.
5. **Announce hidden test cases** in the instructions of every code-sandbox
   challenge. "6 of 12 tests are visible below; 6 are hidden."
6. **Ship the appeals UI** (`/admin/appeals`). The schema + reviewer-bonus
   code is ready; only the page is missing. Right now the feature is invisible.
7. **Fix the mobile workspace layout.** Minimum: single-column stack that is
   actually usable; sticky timer; mobile-friendly editor. Nubank is a
   mobile-first company and this is embarrassing.
8. **Strip the empty badge grid from the profile** *or* wire the first three
   award triggers (First Steps, Rising Star, Perfectionist). Don’t ship a
   dead feature.

### P1 — retention & delight (≈ 3 weeks)

9. **Onboarding flow.** First-login modal, 1-challenge guided path, empty
   state on every page that tells the user what to do.
10. **Streak prominence + daily reminder.** Header flame icon, risk state,
    nightly Slack/email nudge for active streaks.
11. **Daily challenge** (rotating pick from the catalog, boosted points).
12. **Admin challenge creation UI.** Replace the dev-only seed workflow.
    Unblocks content velocity.
13. **"Next recommended challenge"** CTA on the results page — based on tag
    affinity + difficulty progression.
14. **Badges wired end-to-end.** Start with 5 awards and a toast on unlock.
15. **Portuguese UI option.** At minimum the shell (header, buttons, CTAs,
    empty states). Challenge bodies can stay English for now.
16. **Retire or rewrite the 6 weakest AI-judge challenges** (CH-01, 02, 03,
    11, 17, 18). Either convert to structured graders with rubric quizzes
    or replace with scenarios that have verifiable outputs.

### P2 — community & scale (later)

17. **Team / cohort tracking and team leaderboard.**
18. **Seasons / events** ("Security Month", "LGPD April").
19. **Peer voting on AI-judge results** → auto-flag for appeal if 3+ downvotes.
20. **Discussion threads per challenge.**
21. **Admin point-ledger drill-down per user.**
22. **Expert-tier content wave** (5 challenges targeting principal engineers).
23. **Micro-challenge wave** (5 challenges ≤ 10 minutes each).
24. **Slack bot** for reminders, leaderboard pings, and "complete your daily."

---

## 7. Strategic questions the team should answer

1. **Who is the primary user?** New hires (onboarding compliance) vs. all
   engineers (voluntary upskilling) vs. cross-department (non-engineers using
   AI). Difficulty curve, content themes, and retention strategy all pivot on
   this answer.
2. **Mandatory or voluntary?** If compliance, the admin needs enforcement,
   due dates, and cohort dashboards. If voluntary, retention mechanics
   (streaks, badges, seasons) become the whole game.
3. **What is the content-velocity plan?** 30 challenges is a launchable MVP
   but burns out in a month of heavy use. Who writes wave 6+? How often?
   Who QAs? The admin-create UI is the first prerequisite.
4. **Should the 11 remaining AI-judge challenges be retired or fixed?**
   Three options:
   a. Convert the ones with deterministic structure to auto-graded.
   b. Hire human reviewers to grade them via the appeals UI.
   c. Accept variance and add a visible "this is AI-graded, expect some
      subjectivity" label.
5. **English-only or localized?** Affects hiring of content reviewers and
   brand voice calibration.
6. **How much does the platform lean into social?** Solo + leaderboard is
   easier to scale; peer review + teams is higher engagement but needs
   moderation.
7. **Is the code sandbox good enough for production?** If this platform ever
   opens to contractors, partners, or external Nubank hackathons, Node `vm`
   is not sufficient. Decision needs to be made *before* external access,
   not after.

---

## 8. Scorecard

| Dimension | Grade | Notes |
|---|---|---|
| Core loop (submit → grade → score) | **A−** | Works well for auto-graded; opaque for AI-judge. |
| Catalog quality | **B** | Top half is strong, bottom half is soft. |
| Catalog breadth | **B−** | Good CS/security coverage; thin on BR-regulatory, incidents, soft skills. |
| Gamification plumbing | **C** | Schema ready, UI mostly inert. |
| Onboarding | **F** | Does not exist. |
| Retention mechanics | **D** | No daily loop, no notifications, no badges in practice. |
| Admin UX | **C+** | KPIs + toggles ✓; authoring, appeals, ledger drill-down ✗. |
| Mobile | **D** | Workspace broken. |
| Nubank cultural fit | **B−** | Content yes, UI voice no, language no. |
| Scoring transparency | **C** | Breakdown exists but formula is hidden. |

**Overall:** solid **B−** MVP. Two focused weeks on the P0 list
(transparency + mobile + appeals UI + onboarding stub) plus three weeks on
P1 retention plumbing (streaks, badges, daily, admin create) would bring it
to a confident **A−** launch posture.

---

## 9. The one-line pitch this product can honestly make today

> *“A Nubank-flavored challenge library with 16 auto-graded and 11
> AI-graded exercises, a working leaderboard, and an admin dashboard —
> ideal for a small pilot cohort of engineers who are willing to forgive
> the rough edges while we wire up retention and authoring.”*

Not yet:

> *“A gamified, self-sustaining learning community for all of Nubank.”*

Getting from the first sentence to the second is what the P1 backlog is for.
