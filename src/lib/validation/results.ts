import { z } from 'zod';

export const submitResultSchema = z.object({
  notes: z.string().max(2000).optional(),
  evidenceUrl: z.string().url().optional(),
  entries: z.array(z.object({
    userId: z.string().cuid(),
    finishingPosition: z.number().int().min(1).max(30),
  })).min(1),
});
