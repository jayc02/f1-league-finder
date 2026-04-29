export const prerender = false;

import type { APIRoute } from 'astro';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { getGlobalSkillLeaderboard } from '@/server/services/leaderboard.service';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const leaderboard = await getGlobalSkillLeaderboard(getNumericLimit(context, 100, 100));
    const response = jsonResponse(200, { leaderboard });
    response.headers.set('Cache-Control', 'public, s-maxage=45, stale-while-revalidate=60');
    return response;
  });
