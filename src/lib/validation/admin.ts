import { z } from 'zod';

export const adminUpdateUserSchema = z.object({
  role: z.enum(['PLAYER', 'ORGANISER', 'ADMIN']).optional(),
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

export const adminDuelResolveSchema = z.object({
  action: z.enum(['COMPLETED', 'CANCELLED', 'DISPUTED']),
  winnerUserId: z.preprocess((value) => (value === '' || value === null ? undefined : value), z.string().cuid().optional()),
  reason: z.string().trim().min(8, 'Admin reason is required.').max(2000),
}).refine((data) => data.action !== 'COMPLETED' || Boolean(data.winnerUserId), {
  path: ['winnerUserId'],
  message: 'Choose a winner when completing a duel.',
});
