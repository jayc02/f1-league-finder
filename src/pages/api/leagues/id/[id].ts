export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { updateLeagueSchema } from '@/lib/validation/league';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    const leagueId = context.params.id;
    if (!leagueId) throw new HttpError(400, 'League ID is required.');

    const league = await prisma.league.findUnique({ where: { id: leagueId } });
    if (!league) throw new HttpError(404, 'League not found.');

    if (user.role !== 'ADMIN' && league.ownerId !== user.id) {
      throw new HttpError(403, 'Only league owner or admin can update this league.');
    }

    const body = await parseBody(context.request, updateLeagueSchema);

    if (body.slug && body.slug !== league.slug) {
      const duplicateSlug = await prisma.league.findUnique({ where: { slug: body.slug } });
      if (duplicateSlug) throw new HttpError(409, 'League slug already exists.');
    }

    const updated = await prisma.league.update({
      where: { id: leagueId },
      data: body,
    });

    return jsonResponse(200, { league: updated });
  });
