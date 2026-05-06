export const prerender = false;
import type { APIRoute } from 'astro';
import { publicApiShort } from '@/lib/server/cache-control';
import { prisma } from '@/lib/db/prisma';
import { createRaceSlotSchema } from '@/lib/validation/race-slot';
import { getNumericLimit, parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireOrganiserOrAdmin, requireUser } from '@/server/permissions/authz';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const status = context.url.searchParams.get('status');
    const leagueId = context.url.searchParams.get('leagueId');
    const organiserSlug = context.url.searchParams.get('organiser');

    const slots = await prisma.raceSlot.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(leagueId ? { leagueId } : {}),
        ...(organiserSlug ? { organiserProfile: { slug: organiserSlug } } : {}),
        visibility: 'PUBLIC',
        NOT: { status: 'DRAFT' },
      },
      include: {
        league: { select: { id: true, name: true, slug: true } },
        organiser: { select: { id: true, username: true } },
        organiserProfile: { select: { id: true, slug: true, displayName: true, logoUrl: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: getNumericLimit(context, 30, 200),
    });

    const response = jsonResponse(200, { raceSlots: slots });
    response.headers.set('Cache-Control', publicApiShort);
    return response;
  });

export const POST: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    requireOrganiserOrAdmin(user);

    const body = await parseBody(context.request, createRaceSlotSchema);

    const league = await prisma.league.findUnique({ where: { id: body.leagueId } });
    if (!league) throw new HttpError(404, 'League not found.');
    if (user.role !== 'ADMIN' && league.ownerId !== user.id) {
      throw new HttpError(403, 'Only league owner or admin can create race slots in this league.');
    }
    if (body.registrationCutoffAt >= body.scheduledAt) {
      throw new HttpError(400, 'Registration cutoff must be before scheduled start time.');
    }

    const organiserProfile = await prisma.organiserProfile.findUnique({ where: { userId: user.id } });

    const status = body.status ?? 'DRAFT';
    const visibility = body.visibility ?? (status === 'DRAFT' ? 'PRIVATE' : 'PUBLIC');

    const slot = await prisma.raceSlot.create({
      data: {
        ...body,
        organiserId: user.id,
        organiserProfileId: organiserProfile?.id,
        status,
        visibility,
      },
      include: { _count: { select: { registrations: true } } },
    });

    return jsonResponse(201, { raceSlot: slot });
  });
