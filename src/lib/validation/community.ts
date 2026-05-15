import { z } from 'zod';
import { imageAssetSchema } from '@/lib/validation/image';

export const updateCommunitySchema = z.object({
  displayName: z.string().min(3, 'Community name must be at least 3 characters.').max(80, 'Community name must be 80 characters or less.'),
  slug: z.string().min(3, 'Community URL must be at least 3 characters.').max(80, 'Community URL must be 80 characters or less.').regex(/^[a-z0-9-]+$/, 'Community URL can only use lowercase letters, numbers, and hyphens.'),
  shortDescription: z.string().max(180).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  brandingColor: z.string().regex(/^#([a-fA-F0-9]{6})$/, 'Brand accent colour must be a 6-digit hex colour.').nullable().optional(),
  logoUrl: imageAssetSchema.nullable().optional(),
  bannerUrl: imageAssetSchema.nullable().optional(),
  websiteUrl: z.string().url('Website must be a valid URL.').max(2048).nullable().optional(),
  discordUrl: z.string().url('Discord link must be a valid Discord invite URL.').max(2048).refine((value) => /^https:\/\/(discord\.gg|discord\.com\/invite)\/[a-z0-9-]+/i.test(value), 'Discord link must be a valid Discord invite URL.').nullable().optional(),
  redditUrl: z.string().url('Reddit community must be a valid subreddit URL.').max(2048).refine((value) => /^https:\/\/(www\.)?reddit\.com\/r\/[a-z0-9_]+\/?/i.test(value), 'Reddit community must be a valid subreddit URL.').nullable().optional(),
  socials: z.record(z.string(), z.string().url().max(2048)).optional(),
  gameFocus: z.string().max(120).nullable().optional(),
  platformFocus: z.enum(['PC', 'PLAYSTATION', 'XBOX']).nullable().optional(),
  region: z.enum(['EU', 'NA', 'SA', 'APAC', 'MENA', 'GLOBAL']).optional(),
  tags: z.array(z.string().min(2).max(24)).max(8).optional(),
  isPublic: z.boolean().optional(),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
  displayedMemberCount: z.number().int().min(0, 'Displayed member count cannot be negative.').max(5_000_000, 'Displayed member count is too high.').optional(),
  memberCountSource: z.enum(['manual', 'discord-sync', 'reddit-sync', 'racehub']).optional(),
  credibilityNotes: z.string().max(500).nullable().optional(),
});
