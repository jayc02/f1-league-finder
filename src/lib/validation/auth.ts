import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  preferredPlatform: z.enum(['PC', 'PLAYSTATION', 'XBOX']).optional(),
  region: z.enum(['EU', 'NA', 'SA', 'APAC', 'MENA', 'GLOBAL']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
