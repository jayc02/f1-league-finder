export const prerender = false;

import type { APIRoute } from 'astro';
import { getPublicLeagueDetail } from '@/server/services/league.service';
import { withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const slug = context.params.slug;
    if (!slug) throw new HttpError(400, 'League slug is required.');

    const league = await getPublicLeagueDetail(slug);

    if (!league) throw new HttpError(404, 'League not found.');
    return jsonResponse(200, { league });
  });
