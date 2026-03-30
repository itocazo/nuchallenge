# NuChallenge Technical Assessment

**Author:** Lead Engineer
**Date:** March 30, 2026
**Input:** PRD v2.1 + UI/UX Design Spec v1.2
**Target audience:** 5 Senior Engineers (Frontend, Backend, Infrastructure, AI/ML, Security)

---

## 1. System Architecture

### 1.1 Phase 1: Next.js Full-Stack

Per CEO review, Phase 1 ships as a monolithic Next.js application. All business logic lives in Route Handlers, directly accessing PostgreSQL. This reduces operational complexity and time-to-ship.

```
                    ┌─────────────────────────┐
                    │     Vercel / Docker      │
                    │   ┌───────────────────┐  │
                    │   │    Next.js 15      │  │
                    │   │                    │  │
                    │   │  React 19 (RSC)    │  │
  Browser ─────────┤   │  Route Handlers    │  │
                    │   │  Middleware (auth) │  │
                    │   └─────────┬─────────┘  │
                    │             │             │
                    │   ┌─────────▼─────────┐  │
                    │   │   Drizzle ORM      │  │
                    │   │   (TypeScript)     │  │
                    │   └─────────┬─────────┘  │
                    └─────────────┼─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │       PostgreSQL 16        │
                    │   (Neon / Supabase / RDS)  │
                    └───────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼──────┐  ┌────────▼────────┐  ┌──────▼──────┐
    │   Redis         │  │  Claude API     │  │  Slack API  │
    │   (Upstash)     │  │  (Evaluation)   │  │  (Notifs)   │
    └────────────────┘  └─────────────────┘  └─────────────┘
```

### 1.2 Technology Choices

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 15 (App Router) | RSC for data-heavy pages, Route Handlers for API, middleware for auth |
| Language | TypeScript (strict mode) | Type safety across full stack, shared types |
| ORM | Drizzle ORM | Type-safe SQL, lightweight, excellent DX, PostgreSQL-native |
| Database | PostgreSQL 16 | JSONB for challenge metadata, full-text search for challenge search, window functions for leaderboard |
| Cache | Redis (Upstash) | Leaderboard caching, session management, streak tracking |
| Auth | NextAuth.js v5 | JWT sessions, extensible to Okta SAML (Phase 2) |
| AI | Claude API (Anthropic) | Structured output for rubric evaluation, high quality reasoning |
| File Storage | S3/R2 (Cloudflare) | Submission uploads, challenge assets |
| Deployment | Vercel or Docker + Fly.io | Vercel for speed, Fly.io if we need more control |
| CSS | Tailwind CSS 4 | Consistent with design system, utility-first |
| Charts | Recharts | Radar chart for tag profile, bar charts for stats |
| Editor | Monaco Editor | Code challenges only. Tiptap for rich text submissions |
| Real-time | Server-Sent Events | Evaluation status updates (simple, no WebSocket needed) |

### 1.3 Key Architectural Decisions

**Decision 1: Server Components for data display, Client Components for interactivity**
- Challenge Explorer: Server Component (data fetch) wrapping Client Component (filters, search)
- Workspace: Client Component (autosave, timer, editor state)
- Results: Server Component (static once evaluated)
- Leaderboard: Server Component with ISR (revalidate every 60s)

**Decision 2: Drizzle ORM over Prisma**
- Drizzle produces SQL closer to what we'd write by hand
- Better PostgreSQL-specific features (JSONB operators, array fields, window functions)
- Smaller bundle size (no Prisma engine binary)
- Type inference from schema matches our needs exactly

**Decision 3: No separate API service for Phase 1**
- Route Handlers in Next.js serve as the API
- `/api/challenges/*`, `/api/submissions/*`, `/api/users/*`, etc.
- Each handler is a thin controller: validate → business logic → database → response
- Business logic organized in `/lib/services/` — same code migrates to Clojure services later

---

## 2. Data Model

### 2.1 Schema (Drizzle ORM)

```typescript
// schema/users.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  department: text('department'),
  title: text('title'),
  interests: text('interests').array(), // selected skill tags
  platformRole: text('platform_role').array().default(['challenger']),
  pointsTotal: integer('points_total').default(0),
  reputationTotal: integer('reputation_total').default(0),
  level: integer('level').default(1),
  levelName: text('level_name').default('Novice'),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastActivityDate: date('last_activity_date'),
  badges: text('badges').array().default([]),
  passwordHash: text('password_hash'), // Phase 1 only
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// schema/challenges.ts
export const challenges = pgTable('challenges', {
  id: text('id').primaryKey(), // 'CH-01', 'CH-50'
  title: text('title').notNull(),
  description: text('description').notNull(),
  instructions: text('instructions').notNull(), // full markdown
  tags: text('tags').array().notNull(),
  difficulty: text('difficulty', { enum: ['beginner', 'intermediate', 'advanced', 'expert'] }).notNull(),
  timeMinutes: integer('time_minutes').notNull(),
  pointsBase: integer('points_base').notNull(),
  submissionFormat: text('submission_format').notNull(),
  evaluationMethod: text('evaluation_method', { enum: ['ai-judge', 'automated-test', 'human-review', 'hybrid'] }).notNull(),
  rubric: jsonb('rubric').notNull(), // { criteria: [{ name, weight, description }] }
  antiCheatTier: text('anti_cheat_tier', { enum: ['T0', 'T1', 'T2', 'T3'] }).notNull(),
  prerequisites: text('prerequisites').array().default([]),
  producesAsset: boolean('produces_asset').default(false),
  assetType: text('asset_type'),
  contextTemplate: jsonb('context_template'), // for randomized challenge instances
  hints: jsonb('hints'), // [{ level: 1, text: "..." }, ...]
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// schema/attempts.ts
export const attempts = pgTable('attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  challengeId: text('challenge_id').references(() => challenges.id).notNull(),
  attemptNumber: integer('attempt_number').default(1),
  status: text('status', {
    enum: ['in_progress', 'submitted', 'evaluating', 'completed', 'failed']
  }).notNull().default('in_progress'),
  startedAt: timestamp('started_at').defaultNow(),
  submittedAt: timestamp('submitted_at'),
  completedAt: timestamp('completed_at'),
  contextData: jsonb('context_data'), // randomized context for this attempt
  submissionText: text('submission_text'),
  submissionUrl: text('submission_url'), // S3 reference for file uploads
  draftText: text('draft_text'), // autosave draft
  iterations: jsonb('iterations'), // for T2 challenges: [{ round, content, feedback }]
  evaluationResult: jsonb('evaluation_result'), // { criteria: [...], overall, confidence, feedback }
  evaluatorType: text('evaluator_type', { enum: ['ai', 'human', 'automated', 'hybrid'] }),
  pointsAwarded: integer('points_awarded'),
  qualityScore: numeric('quality_score'), // 0-100
  appealStatus: text('appeal_status', { enum: ['pending', 'reviewed', 'upheld', 'overturned'] }),
  appealText: text('appeal_text'),
  appealCriteria: text('appeal_criteria').array(),
  createdAt: timestamp('created_at').defaultNow(),
});

// schema/point_transactions.ts
export const pointTransactions = pgTable('point_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  attemptId: uuid('attempt_id').references(() => attempts.id),
  amount: integer('amount').notNull(),
  type: text('type', {
    enum: ['challenge_complete', 'quality_bonus', 'speed_bonus', 'streak_bonus', 'appeal_adjustment']
  }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// schema/assets.ts
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  attemptId: uuid('attempt_id').references(() => attempts.id).notNull(),
  challengeId: text('challenge_id').references(() => challenges.id).notNull(),
  assetType: text('asset_type').notNull(),
  contentText: text('content_text'),
  contentUrl: text('content_url'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// schema/streak_events.ts
export const streakEvents = pgTable('streak_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  eventDate: date('event_date').notNull(),
  eventType: text('event_type', {
    enum: ['challenge_started', 'submission', 'completion']
  }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 2.2 Indexes

```sql
CREATE INDEX idx_attempts_user_challenge ON attempts(user_id, challenge_id);
CREATE INDEX idx_attempts_status ON attempts(status);
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_assets_user_challenge ON assets(user_id, challenge_id);
CREATE INDEX idx_streak_events_user_date ON streak_events(user_id, event_date);
CREATE INDEX idx_challenges_tags ON challenges USING GIN(tags);
CREATE INDEX idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX idx_users_points ON users(points_total DESC); -- leaderboard
```

### 2.3 Key Queries

**Leaderboard (with diversity weighting):**
```sql
SELECT u.id, u.name, u.points_total, u.level, u.current_streak,
       COUNT(DISTINCT a.challenge_id) as unique_challenges,
       COUNT(DISTINCT c.difficulty) as difficulty_diversity,
       -- Weighted score: points * diversity_factor
       u.points_total * (1 + (COUNT(DISTINCT c.difficulty) - 1) * 0.1) as weighted_score
FROM users u
LEFT JOIN attempts a ON a.user_id = u.id AND a.status = 'completed'
LEFT JOIN challenges c ON c.id = a.challenge_id
GROUP BY u.id
ORDER BY weighted_score DESC
LIMIT 50;
```

**Challenge explorer with user status:**
```sql
SELECT c.*,
  COALESCE(a.status, 'available') as user_status,
  a.quality_score as best_score,
  -- Check if prerequisites are met
  NOT EXISTS (
    SELECT 1 FROM unnest(c.prerequisites) AS prereq
    WHERE NOT EXISTS (
      SELECT 1 FROM attempts WHERE user_id = $1
      AND challenge_id = prereq AND status = 'completed'
    )
  ) as prerequisites_met
FROM challenges c
LEFT JOIN LATERAL (
  SELECT status, quality_score FROM attempts
  WHERE user_id = $1 AND challenge_id = c.id
  ORDER BY CASE status WHEN 'completed' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END
  LIMIT 1
) a ON true
WHERE c.active = true
ORDER BY c.id;
```

---

## 3. API Contract Definitions

### 3.1 Challenge APIs

```typescript
// GET /api/challenges
// Returns all challenges with user's status
interface ChallengeListResponse {
  challenges: Array<{
    id: string;
    title: string;
    description: string; // truncated
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    timeMinutes: number;
    pointsBase: number;
    userStatus: 'available' | 'in_progress' | 'completed' | 'locked';
    bestScore: number | null;
    prerequisitesMet: boolean;
  }>;
}

// GET /api/challenges/:id
// Full challenge detail (no instructions until started)
interface ChallengeDetailResponse {
  challenge: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    difficulty: string;
    timeMinutes: number;
    pointsBase: number;
    submissionFormat: string;
    evaluationMethod: string;
    rubric: { criteria: Array<{ name: string; weight: number; description: string }> };
    antiCheatTier: string;
    prerequisites: Array<{ id: string; title: string; completed: boolean }>;
    producesAsset: boolean;
    hints: Array<{ level: number; text: string }>;
    userStatus: string;
    attemptsRemaining: number;
  };
  contextAssets: Array<{
    challengeId: string;
    challengeTitle: string;
    contentText: string;
    completedAt: string;
    score: number;
  }>;
}

// POST /api/challenges/:id/start
// Begins an attempt, generates context, returns instructions
interface StartChallengeRequest {
  // No body needed — context auto-generated
}
interface StartChallengeResponse {
  attemptId: string;
  instructions: string; // full markdown
  contextData: Record<string, unknown>; // randomized context
  contextAssets: Array<{ challengeId: string; content: string }>; // prior assets
}

// POST /api/challenges/:id/submit
interface SubmitRequest {
  attemptId: string;
  submissionText?: string;
  submissionFile?: File; // multipart
}
interface SubmitResponse {
  attemptId: string;
  status: 'evaluating';
  estimatedWaitSeconds: number;
}

// GET /api/attempts/:id/result
interface AttemptResultResponse {
  attemptId: string;
  challengeId: string;
  status: 'completed' | 'failed';
  qualityScore: number;
  pointsAwarded: number;
  evaluation: {
    criteria: Array<{
      name: string;
      weight: number;
      score: number; // 0-10
      justification: string;
    }>;
    overallScore: number;
    confidence: number;
    feedback: string;
  };
  bonuses: {
    quality: number;
    speed: number;
    streak: number;
  };
  badgesEarned: Array<{ name: string; description: string }>;
  unlockedChallenges: Array<{ id: string; title: string }>;
  attemptsRemaining: number;
}
```

### 3.2 User APIs

```typescript
// GET /api/users/me
interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  department: string;
  level: number;
  levelName: string;
  pointsTotal: number;
  currentStreak: number;
  longestStreak: number;
  badges: string[];
  interests: string[];
  challengeStats: {
    total: number;
    completed: number;
    inProgress: number;
    byDifficulty: Record<string, number>;
  };
  tagAffinity: Array<{ tag: string; completed: number; total: number; avgScore: number }>;
  pathProgress: Array<{ pathName: string; completed: number; total: number }>;
}

// GET /api/users/me/portfolio
interface PortfolioResponse {
  items: Array<{
    challengeId: string;
    challengeTitle: string;
    completedAt: string;
    score: number;
    tags: string[];
    assetPreview: string | null;
  }>;
}
```

### 3.3 Leaderboard APIs

```typescript
// GET /api/leaderboard?view=overall|tag|team&period=quarter|alltime&tag=coding
interface LeaderboardResponse {
  entries: Array<{
    rank: number;
    userId: string;
    name: string;
    department: string;
    level: number;
    points: number;
    challengesCompleted: number;
    streak: number;
    isCurrentUser: boolean;
  }>;
  currentUserRank: number;
  period: { start: string; end: string };
}
```

### 3.4 Manager APIs

```typescript
// GET /api/manager/team
interface ManagerTeamResponse {
  teamName: string;
  totalMembers: number;
  stats: {
    started: number;
    avgScore: number;
    totalCompleted: number;
    avgTimeToFirst: number; // hours
  };
  members: Array<{
    id: string;
    name: string;
    started: boolean;
    completed: number;
    streak: number;
    lastActivity: string | null;
  }>;
  tagCoverage: Array<{ tag: string; membersCompleted: number; totalMembers: number }>;
}

// POST /api/manager/nudge
interface NudgeRequest {
  userIds: string[];
  message?: string; // custom message, optional
}
```

### 3.5 Autosave API

```typescript
// PATCH /api/attempts/:id/draft
// Called every 30 seconds from workspace
interface SaveDraftRequest {
  draftText: string;
}
// Returns 204 No Content on success
```

### 3.6 Evaluation Webhook (Internal)

```typescript
// POST /api/internal/evaluation-complete
// Called by the evaluation service (or self, since Phase 1 is monolith)
interface EvaluationCompletePayload {
  attemptId: string;
  result: {
    criteria: Array<{ name: string; score: number; justification: string }>;
    overallScore: number;
    confidence: number;
    feedback: string;
  };
}
```

---

## 4. AI Evaluation Service Design

### 4.1 Architecture

In Phase 1, the evaluation service is a TypeScript module within the Next.js app:

```
/lib/services/evaluation/
  ├── evaluator.ts          # Main evaluation orchestrator
  ├── ai-judge.ts           # Claude API integration
  ├── rubric-parser.ts      # Parse rubric from challenge definition
  ├── scoring.ts            # Calculate points from raw scores
  └── confidence.ts         # Confidence calculation logic
```

### 4.2 Evaluation Flow

```
Submit → Validate submission → Load rubric → Build prompt →
  Claude API call → Parse structured response →
  Confidence check → (if < 0.7: retry once) →
  Calculate points → Update attempt → Update user →
  Check badges → Send Slack notification → Return result
```

### 4.3 Prompt Template

```typescript
const EVALUATION_PROMPT = `You are evaluating a challenge submission for NuChallenge,
an AI learning platform at Nubank.

## Challenge
Title: {challenge.title}
Description: {challenge.description}
Difficulty: {challenge.difficulty}

## Evaluation Rubric
{rubric.criteria.map(c => `- ${c.name} (${c.weight}%): ${c.description}`).join('\n')}

## Challenge Context
{contextData}

## Submission
{submissionText}

## Instructions
Score each criterion on a 0-10 scale. Provide:
1. A score for each criterion with brief justification
2. An overall weighted score (0-100)
3. A confidence level (0.0-1.0) indicating how confident you are in your evaluation
4. Constructive feedback for the challenger

Respond in this exact JSON format:
{
  "criteria": [
    { "name": "criterion_name", "score": N, "justification": "..." }
  ],
  "overallScore": N,
  "confidence": 0.X,
  "feedback": "..."
}`;
```

### 4.4 Cost Estimation

| Challenge Type | Avg Input Tokens | Avg Output Tokens | Cost per Eval | Volume (Phase 1) | Monthly Cost |
|---------------|-----------------|------------------|--------------|------------------|-------------|
| Text submission (short) | 2,000 | 800 | ~$0.04 | 500/month | $20 |
| Text submission (long) | 5,000 | 1,200 | ~$0.10 | 300/month | $30 |
| Code review | 4,000 | 1,500 | ~$0.09 | 200/month | $18 |
| **Total Phase 1** | | | | **1,000/month** | **~$68/month** |

Phase 2 (all employees): ~5,000 evaluations/month → ~$340/month. Well within budget.

### 4.5 Confidence & Retry Logic

```typescript
async function evaluate(attempt: Attempt, challenge: Challenge): Promise<EvaluationResult> {
  const result = await callClaudeAPI(buildPrompt(attempt, challenge));

  if (result.confidence >= 0.7) {
    return result;
  }

  // Low confidence: retry with slightly different prompt framing
  const retryResult = await callClaudeAPI(buildPrompt(attempt, challenge, { detailed: true }));

  // Average the two results
  return mergeResults(result, retryResult);
}
```

---

## 5. Authentication Design

### 5.1 Phase 1: NextAuth.js

```typescript
// auth.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });
        if (!user || !await verifyPassword(credentials.password, user.passwordHash)) {
          return null;
        }
        return { id: user.id, email: user.email, name: user.name, roles: user.platformRole };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) { token.roles = user.roles; token.userId = user.id; }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.userId;
      session.user.roles = token.roles;
      return session;
    },
  },
});
```

### 5.2 Phase 2: Okta Extension

Add Okta as a provider alongside Credentials. NextAuth supports multiple providers natively:

```typescript
import OktaProvider from 'next-auth/providers/okta';

providers: [
  OktaProvider({
    clientId: process.env.OKTA_CLIENT_ID,
    clientSecret: process.env.OKTA_CLIENT_SECRET,
    issuer: process.env.OKTA_ISSUER,
  }),
  CredentialsProvider({ /* ... kept for dev/testing */ }),
],
```

### 5.3 Middleware

```typescript
// middleware.ts
import { auth } from './auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) return;

  // Require auth for everything else
  if (!session) {
    return Response.redirect(new URL('/login', req.url));
  }

  // Manager dashboard: require manager role or admin
  if (pathname.startsWith('/manager') &&
      !session.user.roles.includes('admin') &&
      !session.user.department) {
    return Response.redirect(new URL('/', req.url));
  }
});

export const config = { matcher: ['/((?!_next|static|favicon).*)'] };
```

---

## 6. Project Structure

```
nuchallenge/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout with header
│   │   ├── page.tsx                      # Challenge Explorer (home)
│   │   ├── login/page.tsx                # Login
│   │   ├── onboarding/page.tsx           # First-time tag selection
│   │   ├── challenges/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx              # Challenge detail
│   │   │   │   ├── workspace/page.tsx    # Active workspace
│   │   │   │   └── results/[attemptId]/page.tsx  # Results
│   │   ├── profile/page.tsx              # User profile + portfolio
│   │   ├── leaderboard/page.tsx          # Leaderboard
│   │   ├── manager/page.tsx              # Manager dashboard
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── challenges/
│   │       │   ├── route.ts              # GET list
│   │       │   └── [id]/
│   │       │       ├── route.ts          # GET detail
│   │       │       ├── start/route.ts    # POST start attempt
│   │       │       └── submit/route.ts   # POST submit
│   │       ├── attempts/
│   │       │   └── [id]/
│   │       │       ├── draft/route.ts    # PATCH autosave
│   │       │       ├── result/route.ts   # GET result
│   │       │       └── appeal/route.ts   # POST appeal
│   │       ├── users/
│   │       │   ├── me/route.ts           # GET profile
│   │       │   └── me/portfolio/route.ts # GET portfolio
│   │       ├── leaderboard/route.ts      # GET leaderboard
│   │       ├── manager/
│   │       │   ├── team/route.ts         # GET team stats
│   │       │   └── nudge/route.ts        # POST slack nudge
│   │       └── slack/
│   │           └── webhook/route.ts      # Slack event handler
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── challenges/
│   │   │   ├── ChallengeCard.tsx
│   │   │   ├── ChallengeGrid.tsx
│   │   │   ├── ChallengeFilters.tsx
│   │   │   ├── TagMap.tsx               # Bubble visualization
│   │   │   └── SearchBar.tsx
│   │   ├── workspace/
│   │   │   ├── WorkspaceLayout.tsx       # Split pane
│   │   │   ├── InstructionsPanel.tsx
│   │   │   ├── SubmissionEditor.tsx      # Rich text (Tiptap)
│   │   │   ├── CodeEditor.tsx            # Monaco wrapper
│   │   │   ├── ContextAssetsPanel.tsx
│   │   │   ├── IterationPanel.tsx
│   │   │   └── Timer.tsx
│   │   ├── results/
│   │   │   ├── ScoreAnimation.tsx
│   │   │   ├── CriteriaBreakdown.tsx
│   │   │   ├── BadgeReveal.tsx
│   │   │   ├── Confetti.tsx
│   │   │   └── AppealModal.tsx
│   │   ├── profile/
│   │   │   ├── TagRadarChart.tsx
│   │   │   ├── BadgeWall.tsx
│   │   │   ├── PathProgress.tsx
│   │   │   └── PointsHistory.tsx
│   │   ├── leaderboard/
│   │   │   ├── Podium.tsx
│   │   │   └── LeaderboardTable.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       ├── TagPill.tsx
│   │       ├── DifficultyBadge.tsx
│   │       ├── StatCard.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── ScoreRing.tsx
│   │       ├── EmptyState.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       └── Skeleton.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts                  # Drizzle client
│   │   │   ├── schema.ts                 # All tables
│   │   │   └── seed.ts                   # Challenge data seeder
│   │   ├── services/
│   │   │   ├── challenges.ts             # Challenge business logic
│   │   │   ├── submissions.ts            # Submit, evaluate, retry
│   │   │   ├── evaluation/
│   │   │   │   ├── evaluator.ts
│   │   │   │   ├── ai-judge.ts
│   │   │   │   └── scoring.ts
│   │   │   ├── gamification.ts           # Points, badges, streaks, levels
│   │   │   ├── leaderboard.ts            # Leaderboard queries + caching
│   │   │   └── slack.ts                  # Slack notifications
│   │   ├── auth.ts                       # NextAuth config
│   │   ├── utils.ts                      # Shared utilities
│   │   └── types.ts                      # Shared TypeScript types
│   └── styles/
│       └── globals.css                   # Tailwind + custom properties
├── drizzle/
│   └── migrations/                       # SQL migrations
├── public/
│   ├── sounds/                           # Celebration audio (optional)
│   └── illustrations/                    # Empty states, onboarding
├── challenges/                           # Challenge content (markdown)
│   ├── CH-01.md
│   ├── CH-02.md
│   └── ...
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 7. Task Breakdown

### 7.1 Phase 1 Tasks (10 weeks)

**Sprint 1-2 (Weeks 1-2): Foundation**

| Task | Engineer | Estimate | Dependencies |
|------|----------|----------|-------------|
| Project scaffold (Next.js, Tailwind, TypeScript) | FE1 | 0.5d | None |
| Database schema + Drizzle config + migrations | BE1 | 2d | None |
| NextAuth.js setup (email/password) | BE1 | 1d | Schema |
| Auth middleware | BE1 | 0.5d | NextAuth |
| Seed 15 challenge definitions (content) | Content | 5d | Schema |
| Design system: color tokens, typography, spacing | FE1 | 1d | None |
| UI components: Button, Card, Badge, TagPill, StatCard | FE1 | 2d | Design system |
| UI components: Modal, Toast, Skeleton, EmptyState | FE2 | 2d | Design system |

**Sprint 3-4 (Weeks 3-4): Challenge Explorer + Detail**

| Task | Engineer | Estimate | Dependencies |
|------|----------|----------|-------------|
| Challenge list API (with user status, prerequisites) | BE1 | 2d | Schema, Auth |
| Challenge detail API | BE1 | 1d | Schema |
| Challenge Explorer page (grid, Server Component) | FE1 | 2d | Challenge API, UI components |
| Challenge filters (tags, difficulty, time, status) | FE2 | 2d | Challenge API |
| Search bar with debounce + URL sync | FE2 | 1d | Explorer page |
| Challenge Card component (all 5 states) | FE1 | 1d | UI components |
| Challenge Detail page | FE1 | 2d | Detail API |
| Tag Map bubble visualization | FE2 | 2d | Challenge API |
| DifficultyBadge with status strip | FE1 | 0.5d | UI components |

**Sprint 5-6 (Weeks 5-6): Workspace + Submission**

| Task | Engineer | Estimate | Dependencies |
|------|----------|----------|-------------|
| Start attempt API (context generation) | BE1 | 2d | Challenge API |
| Submit API + file upload to S3 | BE1 | 2d | Attempt model |
| Autosave draft API | BE1 | 0.5d | Attempt model |
| Workspace split-pane layout | FE1 | 2d | None |
| Instructions panel (markdown rendering, prose styling) | FE1 | 1d | Workspace |
| Rich text editor (Tiptap) for text submissions | FE2 | 3d | Workspace |
| Monaco code editor wrapper | FE2 | 2d | Workspace |
| Context Assets panel | FE1 | 1d | Assets model |
| Timer component | FE1 | 0.5d | Workspace |
| Submit confirmation modal + flow | FE2 | 1d | Submit API |

**Sprint 7-8 (Weeks 7-8): Evaluation + Results**

| Task | Engineer | Estimate | Dependencies |
|------|----------|----------|-------------|
| AI evaluation service (Claude API integration) | AI1 | 3d | Submit API |
| Rubric parsing + prompt builder | AI1 | 2d | Challenge data |
| Scoring calculator (points, bonuses) | AI1 | 1d | Evaluation |
| Confidence check + retry logic | AI1 | 1d | Evaluation |
| Results page (score animation, criteria breakdown) | FE1 | 2d | Result API |
| Confetti + badge reveal animations | FE2 | 2d | Results page |
| Score ring component | FE2 | 1d | Results page |
| Appeal modal + API | BE1 | 1d | Result API |
| Badge checking + award logic | BE1 | 2d | Gamification |
| Points transaction recording | BE1 | 1d | Scoring |

**Sprint 9-10 (Weeks 9-10): Profile, Leaderboard, Slack, Polish**

| Task | Engineer | Estimate | Dependencies |
|------|----------|----------|-------------|
| User profile API | BE1 | 1d | User model |
| Profile page (stats, tag radar, paths, badges) | FE1 | 3d | Profile API |
| Tag radar chart (Recharts) | FE2 | 2d | Profile |
| Badge wall component | FE2 | 1d | Profile |
| Leaderboard API (with diversity weighting) | BE1 | 2d | User model |
| Leaderboard page (podium, table, tabs) | FE1 | 2d | Leaderboard API |
| Manager dashboard API | BE1 | 1d | User/Attempt models |
| Manager dashboard page | FE2 | 2d | Manager API |
| Slack integration (notifications, digest) | BE1 | 2d | Slack API |
| Login page + onboarding flow | FE1 | 1d | Auth |
| Streak tracking service | BE1 | 1d | Streak model |
| Empty states for all views | FE2 | 1d | UI components |
| Responsive design pass (mobile, tablet) | FE2 | 2d | All pages |
| Accessibility audit + fixes | FE1 | 2d | All pages |
| End-to-end testing (Playwright) | AI1 | 2d | All features |
| Performance optimization (ISR, caching) | BE1 | 1d | All APIs |

### 7.2 Team Allocation

| Engineer | Role | Key Responsibilities |
|----------|------|---------------------|
| FE1 | Senior Frontend | Explorer, workspace, results, profile pages. Design system. |
| FE2 | Frontend | Filters, editors, animations, responsive, accessibility. |
| BE1 | Senior Backend | All APIs, database, auth, Slack, gamification logic. |
| AI1 | AI/ML Engineer | Evaluation service, Claude API, scoring, confidence. E2E tests. |
| Content | Content Engineer | 15 challenge definitions, rubrics, hints, context templates. |

---

## 8. Tech Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Claude API latency spikes (>10s evaluation) | Medium | Medium | Show SSE progress updates. Queue evaluations asynchronously. Timeout at 30s with fallback message. |
| Monaco editor bundle size (>1MB) | High | Low | Dynamic import (`next/dynamic`) — only loaded on code challenge workspaces. |
| Autosave race conditions | Medium | Medium | Optimistic locking with version counter. Last-write-wins for draft text (not final submissions). |
| Tag radar chart rendering on 22 axes | Low | Low | Recharts handles this natively. For mobile, fall back to tag list. |
| Challenge content not ready in time | Medium | High | Start content authoring in week 1, parallel with engineering. Phase 1 can launch with 10 challenges instead of 15 if needed. |
| PostgreSQL full-text search performance | Low | Low | GIN index on challenge title + description. For 50 challenges, any approach works. Optimize if catalog grows past 200. |
| Drizzle ORM edge cases | Medium | Low | Drizzle is mature for PostgreSQL. Keep raw SQL as fallback for complex leaderboard queries. |

---

## 9. Phase 2 Migration Notes

When extracting to Clojure services:
1. Each service module in `/lib/services/` maps to a Clojure service
2. Route Handlers become thin BFF proxies
3. Drizzle schema translates directly to PostgreSQL DDL (already database-native)
4. Claude API integration wraps cleanly in Clojure (HTTP client + JSON parsing)
5. Auth token validation stays in Next.js middleware; Clojure services trust the BFF

---

*Technical Assessment v1.0 — Ready for Senior Engineer refinement*
