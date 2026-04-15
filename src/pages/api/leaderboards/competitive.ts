export const prerender = false;

import type { APIRoute } from 'astro';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { getCompetitiveLeaderboard, type CompetitiveLeaderboardType } from '@/server/services/leaderboard.service';

const validTypes: CompetitiveLeaderboardType[] = ['overall', 'honour', 'clean', 'wins', 'weekly'];

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const typeParam = (context.url.searchParams.get('type') ?? 'overall') as CompetitiveLeaderboardType;
    if (!validTypes.includes(typeParam)) throw new HttpError(400, 'Invalid leaderboard type.');

    const leaderboard = await getCompetitiveLeaderboard(typeParam, getNumericLimit(context, 30, 100));
    return jsonResponse(200, { type: typeParam, leaderboard });
  });
