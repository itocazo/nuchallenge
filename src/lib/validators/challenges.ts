import { z } from 'zod';

export const challengeListQuerySchema = z.object({
  tags: z.string().optional(), // comma-separated
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  status: z.enum(['available', 'in_progress', 'completed', 'locked']).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

export const startChallengeSchema = z.object({
  challengeId: z.string().min(1).max(10),
});

export const submitChallengeSchema = z.object({
  attemptId: z.string().uuid(),
  submissionText: z.string().max(50_000).optional(),
});

export const saveDraftSchema = z.object({
  draftText: z.string().max(50_000),
});

export type ChallengeListQuery = z.infer<typeof challengeListQuerySchema>;
export type StartChallengeInput = z.infer<typeof startChallengeSchema>;
export type SubmitChallengeInput = z.infer<typeof submitChallengeSchema>;
export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
