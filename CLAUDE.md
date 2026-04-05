# NuChallenge

AI Learning & Onboarding Challenge Platform for Nubank.

## Project Origin

This project originated as a spin-off from the Mission Marketplace whitepaper at:
`~/Library/Mobile Documents/com~apple~CloudDocs/Dev/Operon/mission_marketplace_whitepaper/`

The whitepaper (10 chapters) describes an internal mission-based marketplace. NuChallenge validates the learning/challenge arm of that concept as a standalone product.

## Tech Stack

- **Framework:** Next.js 16 (App Router, RSC), TypeScript
- **Database:** Drizzle ORM + Neon serverless PostgreSQL
- **Auth:** NextAuth v5 (Credentials provider, JWT strategy, bcryptjs)
- **AI:** Anthropic Claude API with `tool_use` for structured evaluation
- **Async:** Inngest v4 for evaluation queue
- **UI:** Tailwind CSS 4, Lucide icons, Recharts
- **Validation:** Zod 4

## Architecture

Full-stack monolith. All API routes under `src/app/api/`. Database schema in `src/db/schema.ts`.

### Role System

`platformRole` array field on users table: `challenger`, `admin`, `evaluator`, `builder`.
- `requireAdmin()` checks DB role (not stale JWT) for security
- Admin routes under `/api/admin/*` and UI under `/admin/*`

### Password System

- `bcryptjs` hashing with 12 salt rounds
- Auto-generated passwords for new users, emailed via Resend (or console fallback)
- Legacy support: `passwordHash: 'demo'` accepted for seed demo users

## Environment

- Node: v24.14.0 (via nvm)
- Dev server: `npm run dev -- --port 3001`
- Database: Neon PostgreSQL (connection string in `.env.local`)
- Schema push: `DATABASE_URL=... npx drizzle-kit push`
- Seed: `DATABASE_URL=... npx tsx src/db/seed.ts`

## Key Conventions

- API helpers: `jsonResponse()`, `errorResponse()`, `handleApiError()`, `requireAuth()`, `requireAdmin()`
- Client hooks: `useApi<T>(url)`, `apiPost<T>(url, body)`, `apiPatch(url, body)`
- Audit logging via `logAuditEvent()` for all admin actions (LGPD compliance)
- Zod validation on all API inputs (`src/lib/validators/`)

## Admin User

Jardel Itocazo — `jardell@gmail.com` — `platformRole: ['challenger', 'admin']`

## Repo

GitHub: `itocazo/nuchallenge`
