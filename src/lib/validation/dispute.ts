import { z } from 'zod';

export const createDisputeSchema = z.object({
  raceSlotId: z.string().cuid(),
  raceResultId: z.string().cuid().optional(),
  reason: z.string().min(5).max(120),
  details: z.string().max(2000).optional(),
});

export const updateDisputeSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED']).optional(),
  adminNotes: z.string().max(2000).optional(),
  resolutionNotes: z.string().max(2000).optional(),
  honourAdjustment: z.number().int().min(-50).max(50).optional(),
  targetUserId: z.string().cuid().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required.',
});
