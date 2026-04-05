# Plan: NuChallenge — Admin Dashboard

## Context

The NuChallenge MVP is feature-complete with 6 public pages, 12 API endpoints, AI evaluation, and a live staging environment (Neon DB + Anthropic API). All frontend pages are wired to real API endpoints with seed-data fallback.

**Problem:** There is no way to manage users, challenges, or review evaluations in production. The PRD defines an `admin` role (the `platformRole` array field already exists on the users table), but no admin functionality has been built yet.

**Goal:** Build an MVP admin dashboard that lets administrators manage users (CRUD, roles, suspend), manage challenges (CRUD, toggle active), review/override evaluations, view platform analytics, and browse the audit log.

**Repo:** `~/Dev/nuchallenge` → `itocazo/nuchallenge` on GitHub

---

## Implementation Plan

### Phase 0: Auth Foundation (everything depends on this)

**0a. Extend NextAuth session with `platformRole`**
- File: `src/lib/auth.ts`
- In `authorize()`: return `platformRole` from the DB user row
- In `jwt()` callback: persist `token.platformRole`
- In `session()` callback: expose `session.user.platformRole`

**0b. Add TypeScript type augmentation**
- Create: `src/lib/auth.d.ts`
- Extend `next-auth` User, Session, and JWT interfaces to include `platformRole: string[]`

**0c. Add `requireAdmin()` helper**
- File: `src/lib/api-utils.ts`
- New function that calls `requireAuth()`, then checks the DB for `platformRole.includes('admin')`
- Update `handleApiError()` to return 403 for "Forbidden" AuthErrors

**0d. Add admin audit event types**
- File: `src/lib/services/audit.ts`
- Add: `admin.user.role_changed`, `admin.user.suspended`, `admin.user.reactivated`, `admin.challenge.created`, `admin.challenge.updated`, `admin.challenge.toggled`, `admin.attempt.score_override`

**0e. Add `suspendedAt` column**
- File: `src/db/schema.ts`
- Add `suspendedAt: timestamp('suspended_at')` to users table
- Run `npx drizzle-kit push`

**0f. Upgrade auth to support real passwords**
- File: `src/lib/auth.ts`
- Change `authorize()` to hash-check passwords using `bcryptjs` (install as dependency)
- On login, compare `credentials.password` against `user.passwordHash` in DB
- Still support demo users with `passwordHash: 'demo'` for backwards compatibility

**0g. Add password generation + email for new users**
- File: `src/lib/services/password.ts` (new)
- `generatePassword()` — crypto-random 16-char password
- `hashPassword(plain)` / `verifyPassword(plain, hash)` — bcryptjs wrappers
- File: `src/lib/services/email.ts` (new)
- `sendWelcomeEmail({ to, name, password })` — sends auto-generated credentials
- MVP: use Resend (simple API, free tier) or log to console if `RESEND_API_KEY` not set
- Admin user creation flow: generate password → hash → insert user → send email with credentials

**0h. Seed admin user: Jardel Itocazo**
- File: `src/db/seed.ts`
- Add user: `jardell@gmail.com`, name: `Jardel Itocazo`, `platformRole: ['challenger', 'admin']`
- Generate a real hashed password, send credentials to `jardell@gmail.com`
- Also keep Sofia with `['challenger']` role (demo user, not admin)

---

### Phase 1: Validators

- Create: `src/lib/validators/admin.ts`
- Zod schemas: `adminUserListQuery`, `adminCreateUser` (name, email, department, title, platformRole), `adminUpdateUserRole`, `adminToggleSuspend`, `adminChallengeCreate`, `adminChallengeUpdate`, `adminAttemptListQuery`, `adminScoreOverride`, `adminAuditLogQuery`

---

### Phase 2: Admin API Routes (9 endpoints)

All routes call `requireAdmin()` first, use Zod validation, Drizzle queries, `jsonResponse`/`handleApiError`.

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/users` | GET, POST | List users + create new user (auto-generates password, emails it) |
| `/api/admin/users/[id]` | GET, PATCH | User detail + update role/suspend |
| `/api/admin/users/[id]/export` | GET | LGPD data export (JSON download) |
| `/api/admin/challenges` | GET, POST | List all challenges (incl. inactive) + create |
| `/api/admin/challenges/[id]` | GET, PATCH | Challenge detail with stats + update |
| `/api/admin/attempts` | GET | List all attempts across users |
| `/api/admin/attempts/[id]` | GET, PATCH | Attempt detail + score override |
| `/api/admin/analytics` | GET | Dashboard KPIs in single call |
| `/api/admin/audit` | GET | Searchable audit log |

---

### Phase 3: Admin UI (6 pages + layout)

**3a. Admin layout** — `src/app/admin/layout.tsx`
- Server component: checks `session.user.platformRole.includes('admin')`, redirects to `/` if not
- Sidebar nav: Dashboard, Users, Challenges, Attempts, Audit Log

**3b. Dashboard** — `src/app/admin/page.tsx`
- KPI cards (Total Users, Active Users 30d, Challenges Completed, Avg Score)
- Charts via Recharts: completions by difficulty, score distribution, tag popularity
- Top 5 performers table, recent activity feed

**3c. Users** — `src/app/admin/users/page.tsx`
- "Create User" button → modal/inline form (name, email, department, title, roles)
- On create: auto-generates password, hashes it, inserts user, emails credentials
- Search, role filter, suspended filter
- Table: Name, Email, Role, Level, Points, Status, Actions

**3d. User detail** — `src/app/admin/users/[id]/page.tsx`
- Profile header, role editor (checkboxes), suspend/reactivate, export data button
- Tabs: Attempts, Points, Activity

**3e. Challenges** — `src/app/admin/challenges/page.tsx`
- "Create Challenge" button, search, table with inline active toggle
- Table: ID, Title, Difficulty, Active, Attempts, Completion Rate, Avg Score

**3f. Challenge edit/create** — `src/app/admin/challenges/[id]/page.tsx` + `.../new/page.tsx`
- Shared `ChallengeForm` component with all fields (title, description, instructions, tags multi-select, difficulty, rubric criteria builder, hints builder, etc.)

**3g. Attempts** — `src/app/admin/attempts/page.tsx`
- Filters: status, user, challenge
- Table: User, Challenge, Status, Score, Points, Date

**3h. Attempt detail** — `src/app/admin/attempts/[id]/page.tsx`
- Submission text, evaluation breakdown, score override form (new score, reason)

**3i. Audit log** — `src/app/admin/audit/page.tsx`
- Filters: event type, actor, date range
- Table: Timestamp, Event, Actor, Target, Metadata

---

### Phase 4: Header Integration

- File: `src/components/layout/Header.tsx`
- Use `useSession()` instead of `SEED_USERS[0]`
- Add conditional "Admin" nav item (ShieldCheck icon) when `session.user.platformRole.includes('admin')`
- Make user display dynamic from session

---

### Shared Admin Components (create alongside Phase 3)

| Component | File | Purpose |
|-----------|------|---------|
| DataTable | `src/components/admin/DataTable.tsx` | Reusable sortable table |
| Pagination | `src/components/admin/Pagination.tsx` | Page controls |
| SearchInput | `src/components/admin/SearchInput.tsx` | Debounced search |
| ChallengeForm | `src/components/admin/ChallengeForm.tsx` | Create/edit challenge form |
| AdminPageHeader | `src/components/admin/AdminPageHeader.tsx` | Consistent page header |

---

## File Manifest

**Create (29 files):**
- `src/lib/auth.d.ts`
- `src/lib/services/password.ts` (generatePassword, hashPassword, verifyPassword)
- `src/lib/services/email.ts` (sendWelcomeEmail — Resend or console fallback)
- `src/lib/validators/admin.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `src/app/api/admin/users/[id]/export/route.ts`
- `src/app/api/admin/challenges/route.ts`
- `src/app/api/admin/challenges/[id]/route.ts`
- `src/app/api/admin/attempts/route.ts`
- `src/app/api/admin/attempts/[id]/route.ts`
- `src/app/api/admin/analytics/route.ts`
- `src/app/api/admin/audit/route.ts`
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/admin/users/[id]/page.tsx`
- `src/app/admin/challenges/page.tsx`
- `src/app/admin/challenges/[id]/page.tsx`
- `src/app/admin/challenges/new/page.tsx`
- `src/app/admin/attempts/page.tsx`
- `src/app/admin/attempts/[id]/page.tsx`
- `src/app/admin/audit/page.tsx`
- `src/components/admin/DataTable.tsx`
- `src/components/admin/Pagination.tsx`
- `src/components/admin/SearchInput.tsx`
- `src/components/admin/ChallengeForm.tsx`
- `src/components/admin/AdminPageHeader.tsx`

**Modify (6 files):**
- `src/lib/auth.ts` — platformRole in session
- `src/lib/api-utils.ts` — requireAdmin(), 403 handling
- `src/lib/services/audit.ts` — admin event types
- `src/db/schema.ts` — suspendedAt column
- `src/db/seed.ts` — Sofia as admin
- `src/components/layout/Header.tsx` — dynamic session, admin link

---

## Verification

1. **Auth gate:** Login as Jardel (jardell@gmail.com) → see Admin in header. Login as Sofia → no Admin link. Navigate `/admin` as Sofia → redirect to `/`.
2. **API auth:** `GET /api/admin/users` unauthenticated → 401. Non-admin → 403. Jardel → 200.
3. **User creation:** Create a new user from admin → password auto-generated → email sent (or logged to console) → user can log in.
4. **User management:** Search users, view detail, assign roles, suspend/reactivate, verify audit entries.
4. **Challenge management:** Create challenge, edit it, toggle inactive, verify it hides from public API.
5. **Score override:** Override a completed attempt's score, verify pointsTotal adjusts, pointTransaction created.
6. **Analytics:** Dashboard loads with correct KPIs from seed data.
7. **Audit log:** Perform admin actions, verify all appear in audit log with filters.
8. **LGPD export:** Click "Export Data" → JSON file downloads with user's full data.
9. **Build:** `npm run build` passes with all new routes.
