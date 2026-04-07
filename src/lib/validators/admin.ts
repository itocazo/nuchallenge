import { z } from 'zod';

// ── Users ──────────────────────────────────────────

export const adminUserListQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['challenger', 'admin', 'evaluator', 'builder']).optional(),
  suspended: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminCreateUserSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  department: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  platformRole: z
    .array(z.enum(['challenger', 'admin', 'evaluator', 'builder']))
    .min(1)
    .default(['challenger']),
});

export const adminUpdateUserRoleSchema = z.object({
  platformRole: z
    .array(z.enum(['challenger', 'admin', 'evaluator', 'builder']))
    .min(1),
});

export const adminToggleSuspendSchema = z.object({
  suspended: z.boolean(),
});

// ── Challenges ─────────────────────────────────────

const rubricCriterionSchema = z.object({
  name: z.string().min(1),
  weight: z.number().min(0).max(100),
  description: z.string(),
});

const hintSchema = z.object({
  level: z.number().int().min(1),
  text: z.string().min(1),
});

export const adminChallengeCreateSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(1),
  instructions: z.string().min(1),
  tags: z.array(z.string()).min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  timeMinutes: z.number().int().min(1),
  pointsBase: z.number().int().min(1),
  submissionFormat: z.string().min(1),
  evaluationMethod: z.enum(['ai-judge', 'automated-test', 'human-review', 'hybrid']),
  rubric: z.object({ criteria: z.array(rubricCriterionSchema).min(1) }),
  antiCheatTier: z.enum(['T0', 'T1', 'T2', 'T3']),
  prerequisites: z.array(z.string()).default([]),
  producesAsset: z.boolean().default(false),
  assetType: z.string().nullable().default(null),
  hints: z.array(hintSchema).default([]),
  active: z.boolean().default(true),
});

export const adminChallengeUpdateSchema = adminChallengeCreateSchema.partial();

// ── Attempts ───────────────────────────────────────

export const adminAttemptListQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  challengeId: z.string().optional(),
  status: z.enum(['in_progress', 'submitted', 'evaluating', 'completed', 'failed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminScoreOverrideSchema = z.object({
  qualityScore: z.number().min(0).max(100),
  pointsAwarded: z.number().int().min(0),
  reason: z.string().min(1).max(500),
});

/**
 * Additive bonus from a human reviewer. Use this when an admin or
 * evaluator wants to award discretionary credit for something the
 * auto-grader couldn't see (novel framing, elegant approach, etc.)
 * — without rewriting the AI's score.
 *
 * `kind` distinguishes:
 *   - 'bonus' (positive credit, written as type='manual_bonus')
 *   - 'adjustment' (corrective, can be negative, written as type='appeal_adjustment')
 */
export const adminAttemptBonusSchema = z.object({
  amount: z.number().int().refine((n) => n !== 0, 'amount must be non-zero'),
  reason: z.string().min(10, 'reason must be at least 10 characters').max(500),
  kind: z.enum(['bonus', 'adjustment']).default('bonus'),
});

// ── Audit ──────────────────────────────────────────

export const adminAuditLogQuerySchema = z.object({
  eventType: z.string().optional(),
  actorId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
