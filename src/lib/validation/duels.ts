import { z } from 'zod';
import { DUEL_ASSISTS, DUEL_DAMAGE_LEVELS, DUEL_GAMES, DUEL_RACE_LENGTHS, DUEL_TRACKS, DUEL_WEATHER } from '@/data/duel-tracks';

const emptyToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value);
const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

export const duelPlatformSchema = z.enum(['PC', 'PLAYSTATION', 'XBOX']).optional();
export const duelVisibilitySchema = z.enum(['PUBLIC', 'COMMUNITY_ONLY', 'PRIVATE']).default('PUBLIC');

export const createDuelSchema = z.object({
  entryMode: z.enum(['OPEN', 'BIDDED', 'PRIVATE']).default('OPEN'),
  opponentId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  communityId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  visibility: duelVisibilitySchema,
  ranked: z.coerce.boolean().default(true),
  game: z.enum(DUEL_GAMES, { errorMap: () => ({ message: 'Choose a supported game.' }) }),
  track: z.enum(DUEL_TRACKS, { errorMap: () => ({ message: 'Choose a supported duel track.' }) }),
  carClass: z.preprocess(emptyToUndefined, z.string().trim().max(60).optional()),
  platform: z.preprocess(emptyToUndefined, duelPlatformSchema),
  crossplay: z.coerce.boolean().default(true),
  assists: z.enum(DUEL_ASSISTS).default('ASSISTS_ALLOWED'),
  damageLevel: z.enum(DUEL_DAMAGE_LEVELS).default('STANDARD'),
  raceLength: z.enum(DUEL_RACE_LENGTHS).default('25%'),
  weather: z.enum(DUEL_WEATHER).default('Dynamic'),
  rulesSummary: z.preprocess(emptyToUndefined, z.string().trim().max(800).optional()),
  scheduledAt: optionalDate,
  expiresAt: optionalDate,
  startingBidTokens: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  maxBidTokens: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  bidClosesAt: optionalDate,
}).refine((data) => data.visibility !== 'COMMUNITY_ONLY' || Boolean(data.communityId), {
  path: ['communityId'],
  message: 'Choose a community for community-only duels.',
}).refine((data) => data.entryMode !== 'BIDDED' || Boolean(data.startingBidTokens && data.bidClosesAt), {
  path: ['startingBidTokens'],
  message: 'Bidded duels require starting bid and close time.',
});

export const duelListQuerySchema = z.object({
  track: z.preprocess(emptyToUndefined, z.enum(DUEL_TRACKS).optional()),
  game: z.preprocess(emptyToUndefined, z.enum(DUEL_GAMES).optional()),
  platform: z.preprocess(emptyToUndefined, duelPlatformSchema),
  ranked: z.preprocess(emptyToUndefined, z.coerce.boolean().optional()),
  openOnly: z.preprocess(emptyToUndefined, z.coerce.boolean().optional()),
});

export const duelResultSchema = z.object({
  winnerUserId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  confirmedWinnerId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  leg1WinnerUserId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  leg2WinnerUserId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  playerATotalTimeMs: z.coerce.number().int().nonnegative().optional(),
  playerBTotalTimeMs: z.coerce.number().int().nonnegative().optional(),
  evidenceUrl: z.preprocess(emptyToUndefined, z.string().url().max(500).optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
}).refine((data) => Boolean(data.winnerUserId || data.confirmedWinnerId), {
  path: ['winnerUserId'],
  message: 'Winner is required.',
});
