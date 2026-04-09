import { z } from 'zod';

export const createLeagueSchema = z.object({
  name: z.string().min(3).max(80),
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(500),
  region: z.enum(['EU', 'NA', 'SA', 'APAC', 'MENA', 'GLOBAL']).optional(),
  brandingPrimary: z.string().max(20).optional(),
  brandingSecondary: z.string().max(20).optional(),
  organiserDisplayName: z.string().min(3).max(80).optional(),
  organiserDescription: z.string().max(400).optional(),
});

export const updateLeagueSchema = createLeagueSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required.',
});
