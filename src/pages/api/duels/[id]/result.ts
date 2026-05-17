export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { duelResultSchema } from '@/lib/validation/duels';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';
import { submitDuelConfirmation } from '@/server/services/duel.service';

export const POST: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Duel id is required.');
    const user = await requireUser(context);
    const body = await parseBody(context.request, duelResultSchema);
    const duel = await submitDuelConfirmation(id, user, body);
    const response = jsonResponse(200, { duel });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });
