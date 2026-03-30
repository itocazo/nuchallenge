# NuChallenge: Final Review & Build Plan

**Date:** March 30, 2026
**Reviewers:** CEO + CTO
**Input:** PRD v2.1, UI/UX Design Spec v1.2, Tech Assessment v1.0, Task Breakdown v1.0

---

## CEO Final Review

### Strategic Alignment: Approved ✓

The PRD v2.1 addresses all my prior concerns:
- Business impact hypotheses are concrete and measurable
- Adoption strategy (Slack + manager dashboard) is now Phase 1 scope
- Level gating removed — consistent with tag-based philosophy
- Content production plan exists — the 50-challenge problem is addressed

### Resource Approval: Approved ✓

- 4 engineers + 1 content engineer for 10 weeks is reasonable
- Phase 1 budget: ~$68/month AI evaluation cost is negligible
- Infrastructure cost (Vercel + Neon + Upstash): estimated $50-100/month for Phase 1 scale

### Timeline: Approved with Milestone ✓

- **Week 5 checkpoint:** Challenge Explorer + one fully working challenge end-to-end (start → submit → evaluate → see results). If this doesn't work by week 5, we have a problem.
- **Week 10:** Phase 1 launch to 50 internal beta users
- **Week 14 (90 days post-launch):** Business impact hypothesis measurement begins

### One Addition

**Executive sponsor program:** Identify 3 VPs who commit to completing 3 challenges each within the first 2 weeks of launch. Their Slack notifications create visible leadership buy-in. This costs nothing and dramatically improves adoption signaling.

---

## CTO Final Review

### Architecture: Approved ✓

The Phase 1 Next.js monolith is the right call. The engineer refinements caught the right issues:

1. **Async evaluation queue** — Correct. Inline LLM calls in request handlers is a well-known antipattern. The inngest.com approach is clean. ✓
2. **Tool use for structured output** — This is the only way to reliably get structured data from Claude. Non-negotiable. ✓
3. **Drizzle over Prisma** — Agree. For PostgreSQL-heavy workloads, Drizzle's SQL-closeness pays off. ✓
4. **Neon for serverless PostgreSQL** — Good choice. Branch databases for PR previews is a killer feature for developer experience. ✓

### Tech Stack Decisions: Approved with One Change

**Change:** Use **Inngest** (inngest.com) for the async evaluation queue instead of Vercel Background Functions. Reasons:
- Inngest provides retry logic, step functions, and observability out of the box
- Vercel Background Functions are limited to 5 minutes; evaluation retries could exceed this
- Inngest works on any deployment platform (not Vercel-locked)
- Free tier handles Phase 1 volume easily

```typescript
// lib/services/evaluation/inngest.ts
import { inngest } from '../inngest-client';

export const evaluateSubmission = inngest.createFunction(
  { id: 'evaluate-submission' },
  { event: 'submission/created' },
  async ({ event, step }) => {
    const { attemptId, challengeId, submissionText } = event.data;

    // Step 1: Load challenge and rubric
    const challenge = await step.run('load-challenge', () =>
      getChallengeById(challengeId)
    );

    // Step 2: Call Claude API
    const evaluation = await step.run('ai-evaluate', () =>
      evaluateWithClaude(challenge, submissionText)
    );

    // Step 3: Check confidence, retry if needed
    if (evaluation.confidence < 0.7) {
      const retry = await step.run('retry-evaluate', () =>
        evaluateWithClaude(challenge, submissionText, { detailed: true })
      );
      evaluation = mergeResults(evaluation, retry);
    }

    // Step 4: Calculate and save scores
    await step.run('save-results', () =>
      saveEvaluationResults(attemptId, evaluation)
    );

    // Step 5: Send Slack notification
    await step.run('notify-slack', () =>
      sendCompletionNotification(attemptId)
    );
  }
);
```

### Security: One Addition

**Add audit logging from day 1.** Every submission, evaluation, point award, and appeal should be logged to an append-only `audit_log` table:

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_id UUID,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
```

This is cheap, invaluable for debugging, and required for LGPD data access requests. Add it to Sprint 1-2 (0.5 day effort).

### Model Selection Feedback

Agree with the AI engineer's model routing:
- Beginner: Haiku 4.5 (fast, cheap)
- Intermediate: Sonnet 4.6
- Advanced/Expert: Sonnet 4.6, escalate to Opus 4.6 on low confidence retry

But add a **shadow evaluation** mode: for the first 2 weeks of launch, run both Haiku and Sonnet on beginner challenges. Compare scores. If Haiku quality is within 5 points of Sonnet, keep Haiku. If not, use Sonnet for everything. Data-driven model selection, not assumption-driven.

### Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to Interactive (Explorer) | < 1.5s | Vercel Analytics |
| First Contentful Paint | < 0.8s | Web Vitals |
| Challenge submission → results | < 15s (p95) | Inngest metrics |
| Autosave latency | < 500ms | Client-side timer |
| JS bundle (initial) | < 200KB gzipped | bundlesize CI check |

---

## Final Build Plan

### Approved Architecture

```
Next.js 15 (App Router, RSC) + Drizzle ORM + PostgreSQL (Neon) +
Redis (Upstash) + Claude API (Anthropic) + Inngest (async evaluation) +
Slack API + S3/R2 (file storage) + NextAuth.js v5 + Sentry (errors) +
Vercel (deployment)
```

### Approved Timeline

| Week | Sprint | Deliverable |
|------|--------|-------------|
| 1-2 | Foundation | Scaffold, schema, auth, design system, security headers, audit log |
| 3-4 | Explorer | Challenge APIs, grid, filters, search, tag map, detail page |
| **5** | **Checkpoint** | **One challenge works end-to-end (start → submit → evaluate → results)** |
| 5-6 | Workspace | Split pane, editors, autosave, context assets, timer |
| 7-8 | Evaluation | Claude API (tool use), Inngest queue, scoring, celebrations, confetti |
| 9-10 | Polish | Profile, leaderboard, manager dashboard, Slack, LGPD, responsive, a11y, E2E |

### Approved Team

| Role | Allocation |
|------|-----------|
| FE1 (Senior Frontend) | Full-time |
| FE2 (Frontend) | Full-time |
| BE1 (Senior Backend) | Full-time |
| AI1 (AI/ML Engineer) | Full-time weeks 5-10, 50% weeks 1-4 (calibration dataset) |
| Content Engineer | Full-time |

### Launch Plan

1. **Week 10:** Internal beta (50 users — handpicked across departments)
2. **Week 11:** Incorporate beta feedback (bug fixes, rubric calibration)
3. **Week 12:** Company-wide launch with executive sponsor announcements
4. **Week 14:** First business impact measurement (90-day hypothesis window opens)

### Success Criteria for Phase 1 → Phase 2 Go/No-Go

| Metric | Threshold | Source |
|--------|-----------|--------|
| Beta users who complete ≥1 challenge | ≥ 80% (40/50) | Database |
| Average first-challenge completion time | ≤ 12 minutes | Database |
| AI evaluation agreement with human sample | ≥ 85% (within 10 points) | Calibration data |
| NPS from beta users | ≥ 30 | Survey |
| Platform uptime during beta | ≥ 99% | Vercel/Sentry |

If all 5 metrics are met, Phase 2 is funded immediately.

---

## Artifacts Summary

| Document | Location | Status |
|----------|----------|--------|
| PRD v2.1 | `docs/NUCHALLENGE-PRD.md` | Final ✓ |
| CEO Review | `docs/CEO-REVIEW.md` | Complete ✓ |
| UI/UX Design Spec v1.2 | `docs/design/UI-UX-DESIGN-SPEC.md` | Final ✓ |
| PM Design Review | `docs/design/PM-DESIGN-REVIEW.md` | Complete ✓ |
| Design Director Review | `docs/design/DESIGN-DIRECTOR-REVIEW.md` | Complete ✓ |
| Tech Assessment | `docs/TECH-ASSESSMENT.md` | Final ✓ |
| Task Breakdown | `docs/TASK-BREAKDOWN.md` | Final ✓ |
| Build Plan | `docs/BUILD-PLAN.md` | **This document** ✓ |

---

**All artifacts complete. Ready for Phase 8: BUILD.**

*Approved by CEO and CTO, March 30, 2026*
