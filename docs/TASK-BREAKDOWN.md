# NuChallenge: Senior Engineer Refinement & Task Breakdown

**Date:** March 30, 2026
**Input:** TECH-ASSESSMENT.md v1.0
**Participants:** 5 Senior Engineers (Frontend, Backend, Infrastructure, AI/ML, Security)

---

## Engineer 1 — Frontend (React/Next.js)

### Review Summary

The tech assessment's frontend architecture is sound. RSC for data-heavy pages, Client Components for interactive parts. Good choices on Tiptap for rich text and Monaco for code.

### Refinements

**1. State Management Gap**
The assessment doesn't address client-side state management. The workspace page has complex state: draft content, timer, hint states, iteration history, unsaved changes tracking. Recommend:
- Use React context for workspace-scoped state (not global store)
- `useReducer` for workspace state machine: `idle → editing → saving → submitting → evaluating → complete`
- No Zustand/Jotai needed — page-level context is sufficient

**2. Code Splitting Strategy**
- Monaco editor: lazy-load via `next/dynamic` (saves ~1.2MB from initial bundle)
- Tiptap: lazy-load only on workspace pages
- Recharts: lazy-load on profile page
- Confetti: lazy-load on results page
- Target: <200KB initial JS bundle

**3. Form Handling**
- Use React Hook Form for the appeal modal and onboarding tag selector
- Workspace submission doesn't need a form library (it's a single editor value)

**4. Estimate Adjustments**
| Task | Original | Revised | Reason |
|------|----------|---------|--------|
| Tag Map bubble visualization | 2d | 3d | Custom canvas rendering + zoom/pan on mobile |
| Rich text editor (Tiptap) | 3d | 2d | Tiptap's React integration is plug-and-play |
| Monaco code editor | 2d | 1.5d | Next dynamic import handles most complexity |
| Responsive design pass | 2d | 3d | Workspace split-pane → tabs conversion is complex |

---

## Engineer 2 — Backend (API Design, Database)

### Review Summary

Drizzle ORM choice is correct. The schema is well-designed. The leaderboard query with diversity weighting is elegant.

### Refinements

**1. Database Connection Pooling**
Add connection pooling configuration. For Neon (serverless Postgres), use their HTTP driver for Route Handlers:
```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```
For traditional PostgreSQL, use `pg` with pool size = 10 for serverless functions.

**2. Soft Delete for Attempts**
Add `deletedAt` timestamp to attempts table. Users who abandon an attempt before submitting should be able to restart cleanly. Don't hard-delete — keep for analytics.

**3. Rate Limiting**
Add rate limiting to submission and autosave APIs:
- Submit: max 3 per challenge per user (already enforced by attempt count, but add API-level check)
- Autosave: max 2 per minute per user (prevent abuse)
- Use Upstash Redis rate limiter (`@upstash/ratelimit`)

**4. Database Triggers for Point Totals**
Instead of updating `users.points_total` in application code (which risks inconsistency), use a PostgreSQL trigger:
```sql
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET points_total = (
    SELECT COALESCE(SUM(amount), 0) FROM point_transactions WHERE user_id = NEW.user_id
  ) WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_points
AFTER INSERT ON point_transactions
FOR EACH ROW EXECUTE FUNCTION update_user_points();
```

**5. Estimate Adjustments**
| Task | Original | Revised | Reason |
|------|----------|---------|--------|
| Leaderboard API | 2d | 2.5d | Need caching layer in Redis + invalidation strategy |
| Slack integration | 2d | 3d | Slack Block Kit formatting + webhook registration + error handling |
| Streak tracking | 1d | 1.5d | Timezone handling (users in different BRZ cities) |

---

## Engineer 3 — Infrastructure (Docker, Deployment, CI/CD)

### Review Summary

Vercel deployment for Phase 1 is the right call — zero infrastructure management. However, need to address CI/CD, environments, and monitoring.

### Refinements

**1. CI/CD Pipeline (GitHub Actions)**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_DB: nuchallenge_test, POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: amondnet/vercel-action@v25
        with: { vercel-token: ${{ secrets.VERCEL_TOKEN }} }
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: amondnet/vercel-action@v25
        with: { vercel-token: ${{ secrets.VERCEL_TOKEN }}, vercel-args: '--prod' }
```

**2. Environment Strategy**
| Environment | Database | Purpose |
|-------------|----------|---------|
| Development | Local PostgreSQL (Docker Compose) | Local dev |
| Preview | Neon branch database | PR previews (auto-created per PR) |
| Staging | Neon staging branch | Pre-production validation |
| Production | Neon main branch | Live |

**3. Monitoring & Observability**
- **Error tracking:** Sentry (free tier sufficient for Phase 1)
- **Performance:** Vercel Analytics (built-in) + Web Vitals
- **Database:** Neon dashboard metrics
- **AI evaluation:** Custom logging to track: latency, cost per eval, confidence distribution, retry rate
- **Uptime:** BetterUptime or Vercel's built-in monitoring

**4. Docker Compose for Local Dev**
```yaml
services:
  db:
    image: postgres:16
    ports: ['5432:5432']
    environment:
      POSTGRES_DB: nuchallenge
      POSTGRES_PASSWORD: dev
    volumes:
      - pgdata:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
volumes:
  pgdata:
```

**5. Phase 2: Code Sandbox**
Flag for future: the code execution sandbox (Docker containers for code challenges) needs:
- Isolated network namespace
- Read-only filesystem except /tmp
- Memory limit: 512MB, CPU limit: 1 core
- 30-second execution timeout
- gVisor runtime for additional isolation
- Will design in detail when Phase 2 starts

---

## Engineer 4 — AI/ML (Evaluation, LLM Integration)

### Review Summary

The evaluation service design is clean. Claude API choice is correct for quality. Cost estimates are reasonable.

### Refinements

**1. Structured Output with Tool Use**
Instead of hoping Claude returns valid JSON, use Anthropic's tool_use feature to guarantee structured output:

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 2048,
  tools: [{
    name: 'submit_evaluation',
    description: 'Submit the evaluation results',
    input_schema: {
      type: 'object',
      properties: {
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 10 },
              justification: { type: 'string' },
            },
            required: ['name', 'score', 'justification'],
          },
        },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        feedback: { type: 'string' },
      },
      required: ['criteria', 'overallScore', 'confidence', 'feedback'],
    },
  }],
  tool_choice: { type: 'tool', name: 'submit_evaluation' },
  messages: [{ role: 'user', content: evaluationPrompt }],
});
```

This eliminates JSON parsing failures entirely.

**2. Model Selection by Difficulty**
- Beginner challenges: Claude Haiku (faster, cheaper, sufficient quality)
- Intermediate: Claude Sonnet
- Advanced/Expert: Claude Sonnet (or Opus if confidence < 0.7 on retry)

This reduces average cost by ~40% without quality impact on beginner evaluations.

**3. Evaluation Calibration System**
Build a calibration dataset from day 1:
- For each challenge, create 3 "golden" submissions: one excellent (score ~90), one decent (score ~70), one poor (score ~40)
- Run each new prompt version against golden set
- Automated test: if golden submissions diverge > 10 points from expected, flag rubric for review
- This catches prompt regressions before they affect real users

**4. Async Evaluation Queue**
Don't evaluate inline in the submit API. Use a queue:
1. Submit API → set status to `evaluating` → return immediately
2. Background job picks up evaluation (Vercel Cron or inngest.com)
3. Job calls Claude API → saves result → updates status to `completed`
4. Client polls GET `/api/attempts/:id/result` every 2 seconds until status changes
5. Alternative: use Server-Sent Events (SSE) for real-time notification

This prevents API timeout issues if Claude is slow.

**5. Estimate Adjustments**
| Task | Original | Revised | Reason |
|------|----------|---------|--------|
| AI evaluation service | 3d | 4d | Tool use integration + model routing logic |
| Confidence + retry | 1d | 1.5d | Need calibration test infrastructure |
| E2E testing | 2d | 3d | Need to mock Claude API responses in tests |

---

## Engineer 5 — Security (Auth, Sandbox, Privacy)

### Review Summary

NextAuth.js is appropriate for Phase 1. The Okta migration path is clean. Key gaps identified in input validation and data privacy.

### Refinements

**1. Input Validation on All APIs**
Use Zod for all API request validation:

```typescript
import { z } from 'zod';

const submitSchema = z.object({
  attemptId: z.string().uuid(),
  submissionText: z.string().max(50_000).optional(), // 50KB text limit
});

export async function POST(req: Request) {
  const body = submitSchema.parse(await req.json());
  // ... safe to use body.attemptId, body.submissionText
}
```

Every Route Handler MUST validate input. No exceptions.

**2. File Upload Security**
- Limit upload size: 10MB max
- Allowed MIME types: text/plain, text/markdown, application/pdf, image/png, image/jpeg
- Scan uploads with ClamAV or similar (or use Cloudflare R2's built-in scanning)
- Store in a private bucket — generate signed URLs for access (15-minute expiry)
- Never serve user uploads from the same domain as the app

**3. Rate Limiting Matrix**
| Endpoint | Limit | Window | By |
|----------|-------|--------|-----|
| POST /api/auth/signin | 5 | 15 min | IP |
| POST /api/challenges/:id/submit | 3 | per challenge | User |
| PATCH /api/attempts/:id/draft | 2 | 1 min | User |
| POST /api/manager/nudge | 5 | 1 hour | User |
| GET /api/leaderboard | 60 | 1 min | IP |

**4. Data Privacy — LGPD Compliance**
Since this is Nubank (Brazil), LGPD applies:
- User data export: implement `GET /api/users/me/export` (returns all personal data as JSON)
- Data deletion: implement `DELETE /api/users/me` (anonymizes user, retains aggregate stats)
- Consent: first-time login shows LGPD consent banner for data processing
- Submission content: stored encrypted at rest (PostgreSQL TDE or application-level encryption)
- Slack messages: never include scores or evaluation details — only challenge title and completion status

**5. CSRF Protection**
NextAuth.js handles CSRF for auth routes. For other POST/PATCH/DELETE routes:
- Verify `Origin` header matches expected domain
- Use `SameSite=Lax` cookies (NextAuth default)

**6. Content Security Policy**
```typescript
// next.config.ts
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' https://api.anthropic.com" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];
```

**7. Estimate Additions**
| Task | Estimate | Sprint |
|------|----------|--------|
| Zod validation on all APIs | 1d | Sprint 3-4 |
| LGPD consent + data export/delete | 2d | Sprint 9-10 |
| Rate limiting setup | 1d | Sprint 3-4 |
| CSP + security headers | 0.5d | Sprint 1-2 |
| File upload security | 1d | Sprint 5-6 |

---

## Lead Engineer Response: Refined Estimates

### Accepted Refinements
All 5 engineer reviews contribute valuable refinements. Key changes:

1. **Async evaluation queue** (AI Engineer) — Critical. Inline Claude API calls are a reliability risk. Using Vercel Background Functions or inngest.
2. **Tool use for structured output** (AI Engineer) — Eliminates the biggest fragility in the evaluation pipeline. Mandatory.
3. **Zod validation everywhere** (Security) — Non-negotiable. Added to Sprint 1-2 as foundation work.
4. **Database triggers for point totals** (Backend) — Cleaner than application-level updates. Accepted.
5. **LGPD compliance** (Security) — Required for Nubank. Added to Sprint 9-10.
6. **Code splitting strategy** (Frontend) — Good discipline. Enforced via bundle analyzer in CI.

### Revised Total Estimate

| Sprint | Weeks | Focus |
|--------|-------|-------|
| Sprint 1-2 | 1-2 | Foundation: scaffold, schema, auth, design system, security headers |
| Sprint 3-4 | 3-4 | Explorer + Detail: challenge APIs, grid, filters, search, tag map |
| Sprint 5-6 | 5-6 | Workspace: split pane, editors, autosave, context assets |
| Sprint 7-8 | 7-8 | Evaluation + Results: Claude API (tool use), async queue, scoring, celebrations |
| Sprint 9-10 | 9-10 | Profile, Leaderboard, Manager, Slack, LGPD, responsive, accessibility, E2E |

**Revised total: 10 weeks** (unchanged from original, but with more accurate task distribution and the security/infrastructure additions absorbed by reallocating some optimistic estimates).

### Risk Register Update

| New Risk | Likelihood | Impact | Mitigation |
|----------|-----------|--------|------------|
| Vercel Background Functions cold start delay | Medium | Low | Set min instances = 1 for evaluation function |
| Neon database cold start on preview environments | Medium | Low | Accept 1-2s first query latency on previews |
| LGPD compliance scope creep | Medium | Medium | Limit Phase 1 to consent + export. Full DPO workflow in Phase 2 |
| Tiptap + Monaco bundle size exceeding 300KB gzipped | Medium | Low | Dynamic imports + tree shaking. Monitor in CI with bundlesize. |

---

*Senior Engineer Refinement complete. Ready for CEO + CTO final review.*
