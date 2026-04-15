export const prerender = false;
import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { createRaceSlotSchema } from '@/lib/validation/race-slot';
import { getNumericLimit, parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireOrganiserOrAdmin, requireUser } from '@/server/permissions/authz';

const isUnknownFieldError = (error: unknown, field: string) =>
  error instanceof Error && error.message.includes(`Unknown argument \`${field}\``);

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const status = context.url.searchParams.get('status');
    const leagueId = context.url.searchParams.get('leagueId');
    const organiserSlug = context.url.searchParams.get('organiser');

    const baseWhere = {
      ...(status ? { status: status as never } : {}),
      ...(leagueId ? { leagueId } : {}),
      ...(organiserSlug ? { organiserProfile: { slug: organiserSlug } } : {}),
      NOT: { status: 'DRAFT' as const },
    };

    try {
      const slots = await prisma.raceSlot.findMany({
        where: {
          ...baseWhere,
          visibility: 'PUBLIC',
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

      return jsonResponse(200, { raceSlots: slots });
    } catch (error) {
      if (!isUnknownFieldError(error, 'visibility')) throw error;

      const slots = await prisma.raceSlot.findMany({
        where: baseWhere,
        include: {
          league: { select: { id: true, name: true, slug: true } },
          organiser: { select: { id: true, username: true } },
          organiserProfile: { select: { id: true, slug: true, displayName: true, logoUrl: true } },
          _count: { select: { registrations: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        take: getNumericLimit(context, 30, 200),
      });

      return jsonResponse(200, { raceSlots: slots });
    }
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

    const createData = {
      ...body,
      organiserId: user.id,
      organiserProfileId: organiserProfile?.id,
      status: body.status ?? 'DRAFT',
      visibility: body.visibility ?? 'PUBLIC',
    };

    try {
      const slot = await prisma.raceSlot.create({
        data: createData,
        include: { _count: { select: { registrations: true } } },
      });

      return jsonResponse(201, { raceSlot: slot });
    } catch (error) {
      if (!isUnknownFieldError(error, 'track') && !isUnknownFieldError(error, 'eventNotes') && !isUnknownFieldError(error, 'visibility')) {
        throw error;
      }

      const { track: _track, eventNotes: _eventNotes, visibility: _visibility, ...legacyData } = createData;

      const slot = await prisma.raceSlot.create({
        data: legacyData,
        include: { _count: { select: { registrations: true } } },
      });

      return jsonResponse(201, { raceSlot: slot });
    }
  });
