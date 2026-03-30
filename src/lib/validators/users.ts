import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  department: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  interests: z.array(z.string().max(50)).max(10).optional(),
});

export const nudgeSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(20),
  message: z.string().max(500).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type NudgeInput = z.infer<typeof nudgeSchema>;
