import { z } from 'zod';

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(280).nullable().optional(),
  region: z.enum(['EU', 'NA', 'SA', 'APAC', 'MENA', 'GLOBAL']).optional(),
  preferredPlatform: z.enum(['PC', 'PLAYSTATION', 'XBOX']).nullable().optional(),
  avatarUrl: z.string().url().max(2048).nullable().optional(),
});
