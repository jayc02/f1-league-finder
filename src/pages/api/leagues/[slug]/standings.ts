export const prerender = false;

import type { APIRoute } from 'astro';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { getLeagueStandings } from '@/server/services/leaderboard.service';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const slug = context.params.slug;
    if (!slug) throw new HttpError(400, 'League slug is required.');

    const standings = await getLeagueStandings(slug, getNumericLimit(context, 50, 100));
    if (!standings) throw new HttpError(404, 'League not found.');

    return jsonResponse(200, standings);
  });
