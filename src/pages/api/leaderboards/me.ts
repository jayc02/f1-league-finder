export const prerender = false;

import type { APIRoute } from 'astro';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { getSessionUser } from '@/lib/auth/session';
import { jsonResponse } from '@/lib/utils/http';
import { getLeaderboardWindowForUser, type CompetitiveLeaderboardType } from '@/server/services/leaderboard.service';

const validTypes = ['overall', 'honour', 'clean', 'wins', 'weekly'] as const satisfies CompetitiveLeaderboardType[];

const withPrivateNoStore = (response: Response) => {
  response.headers.set('Cache-Control', privateApiNoStore);
  return response;
};

const isValidType = (view: string): view is CompetitiveLeaderboardType => validTypes.includes(view as CompetitiveLeaderboardType);

export const GET: APIRoute = async (context) => {
  const view = context.url.searchParams.get('view') ?? 'overall';
  if (!isValidType(view)) {
    return withPrivateNoStore(jsonResponse(400, { error: 'Invalid leaderboard type.', me: null, window: [] }));
  }

  try {
    const user = await getSessionUser(context);
    if (!user) {
      return withPrivateNoStore(jsonResponse(200, { me: null, window: [] }));
    }

    const standing = await getLeaderboardWindowForUser(view, user.id, 3);
    return withPrivateNoStore(jsonResponse(200, standing));
  } catch (error) {
    console.error('Failed to load personalised leaderboard standing.', error);
    return withPrivateNoStore(jsonResponse(500, { error: 'Unable to load leaderboard standing.', me: null, window: [] }));
  }
};
