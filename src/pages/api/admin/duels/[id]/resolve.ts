export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { adminDuelResolveSchema } from '@/lib/validation/admin';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requirePlatformAdmin } from '@/lib/server/community-permissions';
import { resolveDuelAsAdmin } from '@/server/services/duel.service';

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const admin = await requirePlatformAdmin(context);
    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Duel id is required.');

    const body = await parseBody(context.request, adminDuelResolveSchema);
    const duel = await resolveDuelAsAdmin(id, admin, body);
    const response = jsonResponse(200, { duel });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });
