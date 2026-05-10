import { z } from 'zod';
import { imageAssetSchema } from '@/lib/validation/image';

export const updateCommunitySchema = z.object({
  displayName: z.string().min(3).max(80),
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().max(180).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  brandingColor: z.string().regex(/^#([a-fA-F0-9]{6})$/).nullable().optional(),
  logoUrl: imageAssetSchema.nullable().optional(),
  bannerUrl: imageAssetSchema.nullable().optional(),
  websiteUrl: z.string().url().max(2048).nullable().optional(),
  discordUrl: z.string().url().max(2048).nullable().optional(),
  redditUrl: z.string().url().max(2048).nullable().optional(),
  socials: z.record(z.string(), z.string().url().max(2048)).optional(),
  gameFocus: z.string().max(120).nullable().optional(),
  platformFocus: z.enum(['PC', 'PLAYSTATION', 'XBOX']).nullable().optional(),
  region: z.enum(['EU', 'NA', 'SA', 'APAC', 'MENA', 'GLOBAL']).optional(),
  tags: z.array(z.string().min(2).max(24)).max(8).optional(),
  isPublic: z.boolean().optional(),
  featured: z.boolean().optional(),
  displayedMemberCount: z.number().int().min(0).max(5_000_000).optional(),
  memberCountSource: z.enum(['manual', 'discord-sync', 'reddit-sync', 'racehub']).optional(),
  credibilityNotes: z.string().max(500).nullable().optional(),
});
