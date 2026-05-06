export const prerender = false;

import type { APIRoute } from 'astro';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { getSessionUser } from '@/lib/auth/session';
import { withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { getLeaderboardWindowForUser, type CompetitiveLeaderboardType } from '@/server/services/leaderboard.service';

const validTypes: CompetitiveLeaderboardType[] = ['overall', 'honour', 'clean', 'wins', 'weekly'];

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await getSessionUser(context);
    if (!user) throw new HttpError(401, 'Authentication required.');

    const view = (context.url.searchParams.get('view') ?? 'overall') as CompetitiveLeaderboardType;
    if (!validTypes.includes(view)) throw new HttpError(400, 'Invalid leaderboard type.');

    const response = jsonResponse(200, await getLeaderboardWindowForUser(view, user.id, 3));
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });
