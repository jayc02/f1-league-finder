export const prerender = false;
import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { privateApiNoStore, publicApiShort } from '@/lib/server/cache-control';
import { prisma } from '@/lib/db/prisma';
import { createRaceSlotSchema } from '@/lib/validation/race-slot';
import { getNumericLimit, parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';
import { canManageCommunityRaces } from '@/lib/server/community-permissions';
import { getPublicRaceSlotSummaries } from '@/server/services/race-slot.service';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const status = context.url.searchParams.get('status');
    const leagueId = context.url.searchParams.get('leagueId');
    const organiserSlug = context.url.searchParams.get('organiser');

    const slots = await getPublicRaceSlotSummaries({
      limit: getNumericLimit(context, 30, 200),
      status,
      leagueId,
      organiserSlug,
    });

    if (import.meta.env.DEV) {
      console.log('[race-slots public query]', {
        count: slots.length,
        races: slots.map((slot) => ({ id: slot.id, title: slot.title, status: slot.status, visibility: slot.visibility })),
      });
    }

    const response = jsonResponse(200, { raceSlots: slots });
    response.headers.set('Cache-Control', publicApiShort);
    return response;
  });

export const POST: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const user = await requireUser(context);
    const body = await parseBody(context.request, createRaceSlotSchema);

    const league = await prisma.league.findUnique({ where: { id: body.leagueId }, include: { organiserProfile: true } });
    if (!league) throw new HttpError(404, 'League not found.');

    if (body.registrationCutoffAt >= body.scheduledAt) {
      throw new HttpError(400, 'Registration cutoff must be before scheduled start time.');
    }

    const ownedOrganiserProfile = await prisma.organiserProfile.findUnique({ where: { userId: user.id } });
    const organiserProfile = league.organiserProfile ?? ownedOrganiserProfile;
    if (!organiserProfile) throw new HttpError(403, 'Create or join a managed community before creating races.');
    const canCreate = user.role === 'ADMIN' || league.ownerId === user.id || (await canManageCommunityRaces(user, organiserProfile));
    if (!canCreate) throw new HttpError(403, 'Insufficient community race permissions.');

    const visibility = body.visibility ?? 'COMMUNITY_ONLY';
    const status = body.status ?? (visibility === 'PRIVATE' || visibility === 'UNLISTED' ? 'DRAFT' : 'OPEN');

    const slot = await prisma.raceSlot.create({
      data: {
        ...body,
        organiserId: user.id,
        organiserProfileId: organiserProfile.id,
        status,
        visibility,
      },
      include: { _count: { select: { registrations: true } } },
    });

    const response = jsonResponse(201, { raceSlot: slot });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });
