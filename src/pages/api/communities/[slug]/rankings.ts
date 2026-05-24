export const prerender = false;

import type { APIRoute } from 'astro';
import { publicApiShort } from '@/lib/server/cache-control';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { getCommunityRankings, type CommunityRankingView } from '@/server/services/community-rating.service';

const views = new Set<CommunityRankingView>(['sr', 'honour', 'clean', 'movers']);

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const slug = context.params.slug;
    if (!slug) throw new HttpError(400, 'Community slug is required.');

    const requestedView = context.url.searchParams.get('view') ?? 'sr';
    const view = views.has(requestedView as CommunityRankingView) ? requestedView as CommunityRankingView : 'sr';
    const payload = await getCommunityRankings(slug, view, getNumericLimit(context, 25, 100));
    if (!payload) throw new HttpError(404, 'Community not found.');

    const response = jsonResponse(200, payload);
    response.headers.set('Cache-Control', publicApiShort);
    return response;
  });
