import { z } from 'zod';

export const adminUpdateUserSchema = z.object({
  role: z.enum(['PLAYER', 'ORGANISER', 'ADMIN']).optional(),
  honourScore: z.number().int().min(0).max(200).optional(),
  skillRating: z.number().int().min(100).max(4000).optional(),
  suspensionNote: z.string().max(500).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required.',
});

export const adminRaceSlotSchema = z.object({
  status: z.enum(['DRAFT', 'OPEN', 'FULL', 'LOCKED', 'COMPLETED', 'CANCELLED']).optional(),
  visibility: z.enum(['PUBLIC', 'COMMUNITY_ONLY', 'UNLISTED', 'PRIVATE']).optional(),
  cancellationReason: z.string().max(400).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required.',
});

export const adminCommunitySchema = z.object({
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  displayedMemberCount: z.number().int().min(0).max(5_000_000).optional(),
  credibilityNotes: z.string().max(500).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required.',
});

export const adminDisputeEmailSchema = z.object({
  recipientMode: z.enum(['REPORTER', 'ORGANISER', 'BOTH']),
  subject: z.string().min(6).max(180),
  body: z.string().min(20).max(4000),
});
