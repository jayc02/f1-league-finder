import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { buildAccolades } from '@/server/services/accolade.service';
import { withPerf } from '@/lib/utils/perf';

export interface ProfileRankSummary {
  global: number | null;
  regional: number | null;
  region: string;
}

export const getProfileRankSummary = async (userId: string): Promise<ProfileRankSummary> =>
  withPerf('profile.ranks', async () => {
    const rows = await prisma.$queryRaw<Array<{ global_rank: bigint | number | null; regional_rank: bigint | number | null; region: string }>>(Prisma.sql`
      WITH me AS (
        SELECT
          u.id,
          u.region,
          u."skillRating" AS skill_rating,
          u."honourScore" AS honour_score,
          COALESCE(SUM(rre."pointsAwarded"), 0)::int AS points
        FROM "User" u
        LEFT JOIN "RaceResultEntry" rre ON rre."userId" = u.id
        WHERE u.id = ${userId}
        GROUP BY u.id, u.region, u."skillRating", u."honourScore"
      )
      SELECT
        (
          SELECT COUNT(*) + 1
          FROM "User" u
          CROSS JOIN me
          WHERE u.role != 'ADMIN'
            AND (
              u."skillRating" > me.skill_rating
              OR (
                u."skillRating" = me.skill_rating
                AND (
                  COALESCE((SELECT SUM(peer."pointsAwarded") FROM "RaceResultEntry" peer WHERE peer."userId" = u.id), 0) > me.points
                  OR (
                    COALESCE((SELECT SUM(peer."pointsAwarded") FROM "RaceResultEntry" peer WHERE peer."userId" = u.id), 0) = me.points
                    AND (
                      u."honourScore" > me.honour_score
                      OR (u."honourScore" = me.honour_score AND u.id < me.id)
                    )
                  )
                )
              )
            )
        )::int AS global_rank,
        (
          SELECT COUNT(*) + 1
          FROM "User" u
          CROSS JOIN me
          WHERE u.role != 'ADMIN'
            AND u.region = me.region
            AND (
              u."skillRating" > me.skill_rating
              OR (
                u."skillRating" = me.skill_rating
                AND (
                  COALESCE((SELECT SUM(peer."pointsAwarded") FROM "RaceResultEntry" peer WHERE peer."userId" = u.id), 0) > me.points
                  OR (
                    COALESCE((SELECT SUM(peer."pointsAwarded") FROM "RaceResultEntry" peer WHERE peer."userId" = u.id), 0) = me.points
                    AND (
                      u."honourScore" > me.honour_score
                      OR (u."honourScore" = me.honour_score AND u.id < me.id)
                    )
                  )
                )
              )
            )
        )::int AS regional_rank,
        COALESCE((SELECT region::text FROM me), 'GLOBAL') AS region
    `);

    const row = rows[0];
    return {
      global: row?.global_rank == null ? null : Number(row.global_rank),
      regional: row?.regional_rank == null ? null : Number(row.regional_rank),
      region: row?.region ?? 'GLOBAL',
    };
  });

export const getProfileRecentResults = async (userId: string, limit = 5) =>
  withPerf('profile.recentResults', () =>
    prisma.raceResultEntry.findMany({
      where: { userId },
      select: {
        id: true,
        finishingPosition: true,
        pointsAwarded: true,
        ratingDelta: true,
        honourDelta: true,
        raceResult: {
          select: {
            submittedAt: true,
            raceSlot: { select: { id: true, title: true, track: true, league: { select: { name: true } } } },
          },
        },
      },
      orderBy: { raceResult: { submittedAt: 'desc' } },
      take: limit,
    }),
  );

export const getProfileUpcomingRegistrations = async (userId: string, limit = 5) =>
  withPerf('profile.registrations', () =>
    prisma.raceRegistration.findMany({
      where: { userId, raceSlot: { scheduledAt: { gte: new Date() } } },
      select: {
        id: true,
        createdAt: true,
        raceSlot: {
          select: {
            id: true,
            title: true,
            track: true,
            scheduledAt: true,
            status: true,
            league: { select: { name: true } },
            organiserProfile: { select: { slug: true, displayName: true } },
          },
        },
      },
      orderBy: { raceSlot: { scheduledAt: 'asc' } },
      take: limit,
    }),
  );

export const getProfileOverview = async (userId: string) =>
  withPerf('profile.total', async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [user, recentResults, upcomingRegistrations, ranks, statsRows, ownedCommunity, memberCommunityCount] = await Promise.all([
      withPerf('profile.shell', () =>
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true, createdAt: true, honourScore: true, skillRating: true, region: true },
        }),
      ),
      getProfileRecentResults(userId, 5),
      getProfileUpcomingRegistrations(userId, 5),
      getProfileRankSummary(userId),
      withPerf('profile.summary', () =>
        prisma.$queryRaw<
          Array<{
            starts: bigint | number;
            wins: bigint | number;
            podiums: bigint | number;
            points: bigint | number;
            best_finish: number | null;
            weekly_starts: bigint | number;
            weekly_points: bigint | number;
            clean_finishes: bigint | number;
            registration_count: bigint | number;
          }>
        >(Prisma.sql`
          SELECT
            COUNT(rre.id)::int AS starts,
            COALESCE(SUM(CASE WHEN rre."finishingPosition" = 1 THEN 1 ELSE 0 END), 0)::int AS wins,
            COALESCE(SUM(CASE WHEN rre."finishingPosition" <= 3 THEN 1 ELSE 0 END), 0)::int AS podiums,
            COALESCE(SUM(rre."pointsAwarded"), 0)::int AS points,
            MIN(rre."finishingPosition")::int AS best_finish,
            COALESCE(SUM(CASE WHEN rr."submittedAt" >= ${weekAgo} THEN 1 ELSE 0 END), 0)::int AS weekly_starts,
            COALESCE(SUM(CASE WHEN rr."submittedAt" >= ${weekAgo} THEN rre."pointsAwarded" ELSE 0 END), 0)::int AS weekly_points,
            (SELECT COUNT(*)::int FROM "HonourEvent" he WHERE he."userId" = ${userId} AND he.type = 'CLEAN_RACE' AND he.delta > 0) AS clean_finishes,
            (SELECT COUNT(*)::int FROM "RaceRegistration" reg WHERE reg."userId" = ${userId}) AS registration_count
          FROM "RaceResultEntry" rre
          LEFT JOIN "RaceResult" rr ON rr.id = rre."raceResultId"
          WHERE rre."userId" = ${userId}
        `),
      ),
      withPerf('profile.community', () =>
        prisma.organiserProfile.findUnique({
          where: { userId },
          select: { displayName: true, slug: true, verified: true, displayedMemberCount: true },
        }),
      ),
      withPerf('profile.communityMemberships', () =>
        prisma.organiserProfileMember.count({ where: { userId, status: 'ACTIVE' } }),
      ),
    ]);

    const summary = statsRows[0];
    const starts = Number(summary?.starts ?? 0);
    const wins = Number(summary?.wins ?? 0);
    const podiums = Number(summary?.podiums ?? 0);
    const cleanFinishes = Number(summary?.clean_finishes ?? 0);
    const weeklyStarts = Number(summary?.weekly_starts ?? 0);
    const weeklyPoints = Number(summary?.weekly_points ?? 0);
    const bestFinish = summary?.best_finish ?? null;
    const cleanRaceRatio = starts ? Math.round((cleanFinishes / starts) * 100) : 0;

    const accolades = await withPerf('profile.accolades', async () =>
      user
        ? buildAccolades({
            profile: {
              role: user.role,
              createdAt: user.createdAt,
              honourScore: user.honourScore,
              region: user.region,
            },
            stats: { starts, wins, podiums, cleanFinishes, bestFinish, weeklyStarts, weeklyPoints },
            ranks,
          }).slice(0, 6)
        : [],
    );

    return {
      stats: {
        skillRating: user?.skillRating ?? null,
        honourScore: user?.honourScore ?? null,
        starts,
        wins,
        podiums,
        cleanRaceRatio,
        rank: ranks.global,
        regionalRank: ranks.regional,
        region: ranks.region,
        completedRaces: starts,
        winRate: starts ? Math.round((wins / starts) * 100) : 0,
        podiumRate: starts ? Math.round((podiums / starts) * 100) : 0,
        bestFinish,
        points: Number(summary?.points ?? 0),
      },
      recentResults,
      upcomingRegistrations,
      community: ownedCommunity
        ? { owned: ownedCommunity, membershipCount: memberCommunityCount }
        : { owned: null, membershipCount: memberCommunityCount },
      accolades,
      counts: {
        registrations: Number(summary?.registration_count ?? 0),
        recentResults: recentResults.length,
        upcomingRegistrations: upcomingRegistrations.length,
        communities: memberCommunityCount + (ownedCommunity ? 1 : 0),
      },
    };
  });

/**
 * Deprecated compatibility wrapper. Keep callers working while /profile SSR uses
 * the faster shell and /api/profile/overview loads this data after first paint.
 */
export const getProfilePageData = async (userId: string) => {
  const overview = await getProfileOverview(userId);
  return {
    recentResults: overview.recentResults,
    upcomingRegistrations: overview.upcomingRegistrations,
    starts: overview.stats.starts,
    completedRaces: overview.stats.completedRaces,
    wins: overview.stats.wins,
    podiums: overview.stats.podiums,
    cleanRaces: Math.round((overview.stats.cleanRaceRatio / 100) * Math.max(overview.stats.starts, 1)),
    ranks: { global: overview.stats.rank, regional: overview.stats.regionalRank, region: overview.stats.region },
    ownedCommunity: overview.community.owned,
  };
};
