export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';
import { OrganiserProfileMemberRole, OrganiserProfileMemberStatus } from '@/lib/server/community-permissions';

const withNoStore = (response: Response) => {
  response.headers.set('Cache-Control', privateApiNoStore);
  return response;
};


export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    const slug = context.params.slug;
    if (!slug) throw new HttpError(400, 'Community slug is required.');

    const community = await prisma.organiserProfile.findUnique({
      where: { slug },
      select: { id: true, userId: true },
    });
    if (!community) throw new HttpError(404, 'Community not found.');

    const member = await prisma.organiserProfileMember.findUnique({
      where: { organiserProfileId_userId: { organiserProfileId: community.id, userId: user.id } },
      select: { id: true, role: true, status: true },
    });

    return withNoStore(jsonResponse(200, {
      isOwner: community.userId === user.id,
      member,
    }));
  });

export const POST: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const user = await requireUser(context);
    const slug = context.params.slug;
    if (!slug) throw new HttpError(400, 'Community slug is required.');

    const community = await prisma.organiserProfile.findUnique({ where: { slug }, select: { id: true, userId: true } });
    if (!community) throw new HttpError(404, 'Community not found.');

    const existing = await prisma.organiserProfileMember.findUnique({
      where: { organiserProfileId_userId: { organiserProfileId: community.id, userId: user.id } },
    });
    if (existing?.status === OrganiserProfileMemberStatus.BANNED) throw new HttpError(403, 'You cannot join this community.');

    const member = await prisma.organiserProfileMember.upsert({
      where: { organiserProfileId_userId: { organiserProfileId: community.id, userId: user.id } },
      update: { status: OrganiserProfileMemberStatus.ACTIVE },
      create: {
        organiserProfileId: community.id,
        userId: user.id,
        role: community.userId === user.id ? OrganiserProfileMemberRole.OWNER : OrganiserProfileMemberRole.MEMBER,
        status: OrganiserProfileMemberStatus.ACTIVE,
      },
    });

    return withNoStore(jsonResponse(200, { member }));
  });

export const DELETE: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const user = await requireUser(context);
    const slug = context.params.slug;
    if (!slug) throw new HttpError(400, 'Community slug is required.');

    const community = await prisma.organiserProfile.findUnique({ where: { slug }, select: { id: true, userId: true } });
    if (!community) throw new HttpError(404, 'Community not found.');
    if (community.userId === user.id) throw new HttpError(400, 'Community owners cannot leave their own community.');

    await prisma.organiserProfileMember.deleteMany({
      where: { organiserProfileId: community.id, userId: user.id, role: { not: OrganiserProfileMemberRole.OWNER } },
    });

    return withNoStore(jsonResponse(200, { ok: true }));
  });
