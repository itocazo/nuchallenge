import {
  pgTable,
  text,
  integer,
  boolean,
  uuid,
  timestamp,
  date,
  numeric,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// USERS
// ============================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  image: text('image'),
  department: text('department'),
  title: text('title'),
  interests: text('interests').array(),
  platformRole: text('platform_role').array().default(['challenger']),
  pointsTotal: integer('points_total').default(0),
  reputationTotal: integer('reputation_total').default(0),
  level: integer('level').default(1),
  levelName: text('level_name').default('Novice'),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastActivityDate: date('last_activity_date'),
  badges: text('badges').array().default([]),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_users_points').on(table.pointsTotal),
  index('idx_users_email').on(table.email),
]);

// ============================================
// CHALLENGES
// ============================================
export const challenges = pgTable('challenges', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  instructions: text('instructions').notNull(),
  tags: text('tags').array().notNull(),
  difficulty: text('difficulty', {
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
  }).notNull(),
  timeMinutes: integer('time_minutes').notNull(),
  pointsBase: integer('points_base').notNull(),
  submissionFormat: text('submission_format').notNull(),
  evaluationMethod: text('evaluation_method', {
    enum: ['ai-judge', 'automated-test', 'human-review', 'hybrid'],
  }).notNull(),
  rubric: jsonb('rubric').notNull(),
  antiCheatTier: text('anti_cheat_tier', {
    enum: ['T0', 'T1', 'T2', 'T3'],
  }).notNull(),
  prerequisites: text('prerequisites').array().default([]),
  producesAsset: boolean('produces_asset').default(false),
  assetType: text('asset_type'),
  contextTemplate: jsonb('context_template'),
  hints: jsonb('hints'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_challenges_difficulty').on(table.difficulty),
]);

// ============================================
// ATTEMPTS
// ============================================
export const attempts = pgTable('attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  challengeId: text('challenge_id').references(() => challenges.id).notNull(),
  attemptNumber: integer('attempt_number').default(1),
  status: text('status', {
    enum: ['in_progress', 'submitted', 'evaluating', 'completed', 'failed'],
  }).notNull().default('in_progress'),
  startedAt: timestamp('started_at').defaultNow(),
  submittedAt: timestamp('submitted_at'),
  completedAt: timestamp('completed_at'),
  contextData: jsonb('context_data'),
  submissionText: text('submission_text'),
  submissionUrl: text('submission_url'),
  draftText: text('draft_text'),
  iterations: jsonb('iterations'),
  evaluationResult: jsonb('evaluation_result'),
  evaluatorType: text('evaluator_type', {
    enum: ['ai', 'human', 'automated', 'hybrid'],
  }),
  pointsAwarded: integer('points_awarded'),
  qualityScore: numeric('quality_score'),
  appealStatus: text('appeal_status', {
    enum: ['pending', 'reviewed', 'upheld', 'overturned'],
  }),
  appealText: text('appeal_text'),
  appealCriteria: text('appeal_criteria').array(),
  deletedAt: timestamp('deleted_at'), // soft delete
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_attempts_user_challenge').on(table.userId, table.challengeId),
  index('idx_attempts_status').on(table.status),
]);

// ============================================
// POINT TRANSACTIONS
// ============================================
export const pointTransactions = pgTable('point_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  attemptId: uuid('attempt_id').references(() => attempts.id),
  amount: integer('amount').notNull(),
  type: text('type', {
    enum: ['challenge_complete', 'quality_bonus', 'speed_bonus', 'streak_bonus', 'appeal_adjustment'],
  }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_point_transactions_user').on(table.userId),
]);

// ============================================
// ASSETS
// ============================================
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
}, (table) => [
  index('idx_assets_user_challenge').on(table.userId, table.challengeId),
]);

// ============================================
// STREAK EVENTS
// ============================================
export const streakEvents = pgTable('streak_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  eventDate: date('event_date').notNull(),
  eventType: text('event_type', {
    enum: ['challenge_started', 'submission', 'completion'],
  }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_streak_events_user_date').on(table.userId, table.eventDate),
]);

// ============================================
// AUDIT LOG
// ============================================
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: text('event_type').notNull(),
  actorId: uuid('actor_id'),
  targetType: text('target_type'),
  targetId: text('target_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_audit_log_created').on(table.createdAt),
  index('idx_audit_log_actor').on(table.actorId),
]);

// ============================================
// NextAuth.js tables
// ============================================
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: text('session_token').unique().notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
});

// ============================================
// RELATIONS
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
  attempts: many(attempts),
  pointTransactions: many(pointTransactions),
  assets: many(assets),
  streakEvents: many(streakEvents),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const challengesRelations = relations(challenges, ({ many }) => ({
  attempts: many(attempts),
  assets: many(assets),
}));

export const attemptsRelations = relations(attempts, ({ one, many }) => ({
  user: one(users, { fields: [attempts.userId], references: [users.id] }),
  challenge: one(challenges, { fields: [attempts.challengeId], references: [challenges.id] }),
  pointTransactions: many(pointTransactions),
  assets: many(assets),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, { fields: [pointTransactions.userId], references: [users.id] }),
  attempt: one(attempts, { fields: [pointTransactions.attemptId], references: [attempts.id] }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  user: one(users, { fields: [assets.userId], references: [users.id] }),
  attempt: one(attempts, { fields: [assets.attemptId], references: [attempts.id] }),
  challenge: one(challenges, { fields: [assets.challengeId], references: [challenges.id] }),
}));
