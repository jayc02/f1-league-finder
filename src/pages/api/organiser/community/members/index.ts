export const prerender = false;

import { OrganiserProfileMemberRole, OrganiserProfileMemberStatus } from '@prisma/client';
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { prisma } from '@/lib/db/prisma';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';
import { requireCommunityRole } from '@/lib/server/community-permissions';

const memberActionSchema = z.object({
  organiserProfileId: z.string().cuid(),
  memberId: z.string().cuid(),
  role: z.enum(['ADMIN', 'MODERATOR', 'MEMBER']).optional(),
  status: z.enum(['ACTIVE', 'BANNED']).optional(),
});

const withNoStore = (response: Response) => {
  response.headers.set('Cache-Control', privateApiNoStore);
  return response;
};

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    const organiserProfileId = context.url.searchParams.get('organiserProfileId');
    if (!organiserProfileId) throw new HttpError(400, 'Community ID is required.');
    await requireCommunityRole(context, organiserProfileId, [OrganiserProfileMemberRole.OWNER, OrganiserProfileMemberRole.ADMIN, OrganiserProfileMemberRole.MODERATOR]);

    const take = Math.min(Number(context.url.searchParams.get('take') ?? 25) || 25, 50);
    const skip = Math.max(Number(context.url.searchParams.get('skip') ?? 0) || 0, 0);

    const members = await prisma.organiserProfileMember.findMany({
      where: { organiserProfileId },
      include: { user: { select: { id: true, username: true, email: true, avatarUrl: true, role: true } } },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      skip,
      take,
    });

    return withNoStore(jsonResponse(200, { members, pagination: { skip, take }, requestedBy: user.id }));
  });

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const body = await parseBody(context.request, memberActionSchema);
    const { user, role: actorRole } = await requireCommunityRole(context, body.organiserProfileId, [OrganiserProfileMemberRole.OWNER, OrganiserProfileMemberRole.ADMIN, OrganiserProfileMemberRole.MODERATOR]);

    const target = await prisma.organiserProfileMember.findUnique({
      where: { id: body.memberId },
      include: { user: { select: { role: true } } },
    });
    if (!target || target.organiserProfileId !== body.organiserProfileId) throw new HttpError(404, 'Member not found.');
    if (target.role === OrganiserProfileMemberRole.OWNER && actorRole !== OrganiserProfileMemberRole.OWNER && user.role !== 'ADMIN') {
      throw new HttpError(403, 'Only the owner can update owner membership.');
    }
    if (actorRole === OrganiserProfileMemberRole.MODERATOR && body.role && body.role !== target.role) {
      throw new HttpError(403, 'Moderators cannot promote or demote members.');
    }
    if (actorRole === OrganiserProfileMemberRole.ADMIN && body.role === OrganiserProfileMemberRole.ADMIN && target.role !== OrganiserProfileMemberRole.ADMIN) {
      throw new HttpError(403, 'Only owners can promote community admins.');
    }
    if (target.user.role === 'ADMIN' && body.status === OrganiserProfileMemberStatus.BANNED) {
      throw new HttpError(403, 'Community tools cannot ban platform admins.');
    }

    const member = await prisma.organiserProfileMember.update({
      where: { id: body.memberId },
      data: {
        ...(body.role ? { role: body.role } : {}),
        ...(body.status ? { status: body.status } : {}),
      },
      include: { user: { select: { id: true, username: true, email: true, avatarUrl: true, role: true } } },
    });

    return withNoStore(jsonResponse(200, { member }));
  });

export const DELETE: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const body = await parseBody(context.request, memberActionSchema.pick({ organiserProfileId: true, memberId: true }));
    const { user, role: actorRole } = await requireCommunityRole(context, body.organiserProfileId, [OrganiserProfileMemberRole.OWNER, OrganiserProfileMemberRole.ADMIN, OrganiserProfileMemberRole.MODERATOR]);

    const target = await prisma.organiserProfileMember.findUnique({ where: { id: body.memberId }, include: { user: { select: { role: true } } } });
    if (!target || target.organiserProfileId !== body.organiserProfileId) throw new HttpError(404, 'Member not found.');
    if (target.role === OrganiserProfileMemberRole.OWNER) throw new HttpError(403, 'The community owner cannot be removed.');
    if (actorRole === OrganiserProfileMemberRole.MODERATOR && target.role !== OrganiserProfileMemberRole.MEMBER) throw new HttpError(403, 'Moderators can only remove regular members.');
    if (actorRole === OrganiserProfileMemberRole.ADMIN && target.role === OrganiserProfileMemberRole.ADMIN && user.role !== 'ADMIN') throw new HttpError(403, 'Admins cannot remove peer admins.');
    if (target.user.role === 'ADMIN') throw new HttpError(403, 'Community tools cannot remove platform admins.');

    await prisma.organiserProfileMember.delete({ where: { id: body.memberId } });
    return withNoStore(jsonResponse(200, { ok: true }));
  });
