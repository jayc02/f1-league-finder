import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

const getPublicUpcomingRaceSlotWhere = () =>
  ({
    visibility: 'PUBLIC',
    status: { in: ['OPEN', 'FULL', 'LOCKED'] },
    scheduledAt: { gte: new Date() },
  }) satisfies Prisma.RaceSlotWhereInput;

export interface PublicCommunityDiscoveryOptions {
  limit?: number;
  q?: string | null;
  region?: string | null;
  featuredOnly?: boolean;
}

export const getPublicCommunitySummaries = async (optionsOrLimit: PublicCommunityDiscoveryOptions | number = 30) => {
  const options = typeof optionsOrLimit === 'number' ? { limit: optionsOrLimit } : optionsOrLimit;
  const q = options.q?.trim();
  const publicUpcomingRaceSlotWhere = getPublicUpcomingRaceSlotWhere();

  const communities = await prisma.organiserProfile.findMany({
    where: {
      isPublic: true,
      ...(options.region ? { region: options.region as never } : {}),
      ...(options.featuredOnly ? { featured: true } : {}),
      ...(q
        ? {
            OR: [
              { displayName: { contains: q, mode: 'insensitive' } },
              { shortDescription: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { tags: { hasSome: q.split(' ').filter(Boolean) } },
            ],
          }
        : {}),
    },
    orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
    take: options.limit ?? 30,
    select: {
      id: true,
      userId: true,
      slug: true,
      displayName: true,
      shortDescription: true,
      description: true,
      brandingColor: true,
      logoUrl: true,
      bannerUrl: true,
      websiteUrl: true,
      discordUrl: true,
      redditUrl: true,
      socials: true,
      gameFocus: true,
      platformFocus: true,
      region: true,
      tags: true,
      isPublic: true,
      featured: true,
      verified: true,
      displayedMemberCount: true,
      memberCountSource: true,
      memberCountLastSyncedAt: true,
      credibilityNotes: true,
      createdAt: true,
      updatedAt: true,
      raceSlots: {
        where: publicUpcomingRaceSlotWhere,
        take: 3,
        orderBy: { scheduledAt: 'asc' },
        select: {
          id: true,
          title: true,
          scheduledAt: true,
          maxPlayers: true,
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: { where: { status: 'ACTIVE' } },
          raceSlots: {
            where: publicUpcomingRaceSlotWhere,
          },
        },
      },
    },
  });

  return communities.map((community) => ({
    ...community,
    displayedMemberCount: community.memberCountSource === 'manual' && community.displayedMemberCount > 0
      ? community.displayedMemberCount
      : community._count.members || community.displayedMemberCount,
    memberCountSource: community.memberCountSource === 'manual' && community.displayedMemberCount > 0
      ? community.memberCountSource
      : community._count.members ? 'racehub' : community.memberCountSource,
  }));
};

export type PublicCommunitySummary = Awaited<ReturnType<typeof getPublicCommunitySummaries>>[number];
