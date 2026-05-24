export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import type { z } from 'zod';
import { HonourEventType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { submitResultSchema } from '@/lib/validation/results';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';
import { canManageCommunityRaces } from '@/lib/server/community-permissions';
import { applyCommunityRaceResult } from '@/server/services/community-rating.service';
import { applyHonourEvent } from '@/server/services/honour.service';
import { computeHonourDeltaForResult, computeRacePoints, computeSkillDelta } from '@/server/services/rating.service';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Race slot ID is required.');

    const result = await prisma.raceResult.findUnique({
      where: { raceSlotId: id },
      include: {
        submittedBy: { select: { id: true, username: true } },
        entries: {
          orderBy: { finishingPosition: 'asc' },
          include: { user: { select: { id: true, username: true, skillRating: true, honourScore: true } } },
        },
      },
    });

    if (!result) throw new HttpError(404, 'Result not found for race slot.');
    return jsonResponse(200, { result });
  });

export const POST: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const user = await requireUser(context);
    const raceSlotId = context.params.id;
    if (!raceSlotId) throw new HttpError(400, 'Race slot ID is required.');

    const slot = await prisma.raceSlot.findUnique({
      where: { id: raceSlotId },
      include: {
        registrations: { select: { userId: true } },
        result: true,
        league: true,
        organiserProfile: true,
      },
    });

    if (!slot) throw new HttpError(404, 'Race slot not found.');

    const canSubmit =
      user.role === 'ADMIN' ||
      user.id === slot.organiserId ||
      user.id === slot.league.ownerId ||
      Boolean(slot.organiserProfile && (await canManageCommunityRaces(user, slot.organiserProfile)));
    if (!canSubmit) throw new HttpError(403, 'Only community staff, league owner, organiser, or admin can submit results.');
    if (slot.status === 'CANCELLED') throw new HttpError(400, 'Cannot submit results for cancelled race slot.');
    if (slot.result) throw new HttpError(409, 'Result already submitted for this slot.');

    const body: z.infer<typeof submitResultSchema> = await parseBody(context.request, submitResultSchema);

    const registrationIds = new Set(slot.registrations.map((r) => r.userId));
    const uniqueUsers = new Set(body.entries.map((e) => e.userId));
    const uniquePositions = new Set(body.entries.map((e) => e.finishingPosition));

    if (uniqueUsers.size !== body.entries.length || uniquePositions.size !== body.entries.length) {
      throw new HttpError(400, 'Result entries must have unique users and positions.');
    }

    for (const entry of body.entries) {
      if (!registrationIds.has(entry.userId)) {
        throw new HttpError(400, `User ${entry.userId} was not registered for this race slot.`);
      }
    }

    const ordered = [...body.entries].sort((a, b) => a.finishingPosition - b.finishingPosition);

    const { result, communityRatingEvents } = await prisma.$transaction(async (tx) => {
      const createdResult = await tx.raceResult.create({
        data: {
          raceSlotId,
          submittedById: user.id,
          notes: body.notes,
          evidenceUrl: body.evidenceUrl,
          confirmationState: user.role === 'ADMIN' ? 'confirmed' : 'submitted',
          confirmedAt: user.role === 'ADMIN' ? new Date() : null,
          entries: {
            create: ordered.map((entry) => ({
              userId: entry.userId,
              finishingPosition: entry.finishingPosition,
              pointsAwarded: computeRacePoints(entry.finishingPosition),
              ratingDelta: computeSkillDelta(entry.finishingPosition, ordered.length),
              honourDelta: computeHonourDeltaForResult(entry.finishingPosition, ordered.length),
            })),
          },
        },
        include: { entries: true },
      });

      await tx.raceSlot.update({ where: { id: raceSlotId }, data: { status: 'COMPLETED' } });

      for (const entry of createdResult.entries) {
        await tx.user.update({
          where: { id: entry.userId },
          data: {
            skillRating: { increment: entry.ratingDelta },
          },
        });

        if (entry.honourDelta !== 0) {
          await applyHonourEvent(tx, {
            userId: entry.userId,
            delta: entry.honourDelta,
            reason: `Post-race clean completion (${entry.finishingPosition})`,
            type: HonourEventType.CLEAN_RACE,
            raceSlotId,
            raceResultId: createdResult.id,
            appliedById: user.id,
            metadata: { finishingPosition: entry.finishingPosition },
          });
        }
      }

      const communityEvents = slot.organiserProfileId
        ? await applyCommunityRaceResult(tx, {
            organiserProfileId: slot.organiserProfileId,
            raceSlotId,
            raceResultId: createdResult.id,
            appliedById: user.id,
            entries: createdResult.entries.map((entry) => ({
              userId: entry.userId,
              finishingPosition: entry.finishingPosition,
              ratingDelta: entry.ratingDelta,
              honourDelta: entry.honourDelta,
            })),
            reason: `Race result submitted for ${slot.title}`,
          })
        : [];

      return { result: createdResult, communityRatingEvents: communityEvents };
    });

    return jsonResponse(201, { result, communityRatingEvents });
  });
