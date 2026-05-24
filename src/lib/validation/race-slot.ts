import { z } from 'zod';

const slotStatusEnum = z.enum(['DRAFT', 'OPEN', 'FULL', 'LOCKED', 'COMPLETED', 'CANCELLED']);
const visibilityEnum = z.enum(['PUBLIC', 'COMMUNITY_ONLY', 'UNLISTED', 'PRIVATE']);

export const createRaceSlotSchema = z.object({
  title: z.string().min(4).max(120),
  track: z.string().min(2).max(80).optional(),
  eventNotes: z.string().max(800).optional(),
  visibility: visibilityEnum.optional(),
  leagueId: z.string().cuid(),
  scheduledAt: z.coerce.date(),
  region: z.enum(['EU', 'NA', 'SA', 'APAC', 'MENA', 'GLOBAL']).optional(),
  platform: z.enum(['PC', 'PLAYSTATION', 'XBOX']).optional(),
  crossplay: z.boolean().default(false),
  formatDetails: z.string().min(3).max(300),
  lobbySettings: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  maxPlayers: z.number().int().min(2).max(30),
  registrationCutoffAt: z.coerce.date(),
  rulesSummary: z.string().min(10).max(600),
  eventTierLabel: z.string().max(80).optional(),
  status: slotStatusEnum.optional(),
});

export const updateRaceSlotSchema = z.object({
  title: z.string().min(4).max(120).optional(),
  track: z.string().min(2).max(80).nullable().optional(),
  eventNotes: z.string().max(800).nullable().optional(),
  visibility: visibilityEnum.optional(),
  scheduledAt: z.coerce.date().optional(),
  region: z.enum(['EU', 'NA', 'SA', 'APAC', 'MENA', 'GLOBAL']).optional(),
  platform: z.enum(['PC', 'PLAYSTATION', 'XBOX']).nullable().optional(),
  crossplay: z.boolean().optional(),
  formatDetails: z.string().min(3).max(300).optional(),
  lobbySettings: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).nullable().optional(),
  maxPlayers: z.number().int().min(2).max(30).optional(),
  registrationCutoffAt: z.coerce.date().optional(),
  rulesSummary: z.string().min(10).max(600).optional(),
  eventTierLabel: z.string().max(80).nullable().optional(),
  status: slotStatusEnum.optional(),
  cancellationReason: z.string().max(400).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required.',
});
