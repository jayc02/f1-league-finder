import { prisma } from '@/lib/db/prisma';
import { withPerf } from '@/lib/utils/perf';

export type CompetitiveLeaderboardType = 'overall' | 'honour' | 'clean' | 'wins' | 'weekly';
export interface LeaderboardEntry { id:string; rank:number; username:string; avatarUrl:string|null; role:'PLAYER'|'ORGANISER'|'ADMIN'; createdAt:Date; region:string; honourScore:number; skillRating:number; racesEntered:number; starts:number; wins:number; podiums:number; cleanFinishes:number; cleanRaceRatio:number; points:number; weeklyPoints:number; averageFinish:number|null; bestFinish:number|null; trend:'up'|'down'|'stable'; }

const CACHE_TTL_MS = 45_000;
const cache = new Map<string, { expires:number; value: LeaderboardEntry[] }>();

const orderByByType: Record<CompetitiveLeaderboardType, string> = {
  overall: 'skill_rating DESC, points DESC, honour_score DESC, id ASC',
  honour: 'honour_score DESC, clean_race_ratio DESC, skill_rating DESC, id ASC',
  clean: 'clean_race_ratio DESC, clean_finishes DESC, honour_score DESC, id ASC',
  wins: 'wins DESC, podiums DESC, skill_rating DESC, id ASC',
  weekly: 'weekly_points DESC, skill_rating DESC, id ASC',
};

const leaderboardCTE = `
WITH weekly_cutoff AS (
  SELECT NOW() - INTERVAL '7 days' AS ts
),
registration_stats AS (
  SELECT rr."userId" AS user_id, COUNT(*)::int AS races_entered
  FROM "RaceRegistration" rr
  GROUP BY rr."userId"
),
result_stats AS (
  SELECT rre."userId" AS user_id,
    COUNT(*)::int AS starts,
    SUM(CASE WHEN rre."finishingPosition" = 1 THEN 1 ELSE 0 END)::int AS wins,
    SUM(CASE WHEN rre."finishingPosition" <= 3 THEN 1 ELSE 0 END)::int AS podiums,
    COALESCE(SUM(rre."pointsAwarded"), 0)::int AS points,
    AVG(rre."finishingPosition")::float8 AS average_finish,
    MIN(rre."finishingPosition")::int AS best_finish
  FROM "RaceResultEntry" rre
  GROUP BY rre."userId"
),
clean_stats AS (
  SELECT he."userId" AS user_id, COUNT(*)::int AS clean_finishes
  FROM "HonourEvent" he
  WHERE he.type = 'CLEAN_RACE' AND he.delta > 0
  GROUP BY he."userId"
),
weekly_stats AS (
  SELECT rre."userId" AS user_id, COALESCE(SUM(rre."pointsAwarded"), 0)::int AS weekly_points
  FROM "RaceResultEntry" rre
  INNER JOIN "RaceResult" rr ON rr.id = rre."raceResultId"
  WHERE rr."submittedAt" >= (SELECT ts FROM weekly_cutoff)
  GROUP BY rre."userId"
),
leaderboard_base AS (
  SELECT u.id,
    u.username,
    u."avatarUrl" AS avatar_url,
    u.role,
    u."createdAt" AS created_at,
    u.region::text AS region,
    u."honourScore" AS honour_score,
    u."skillRating" AS skill_rating,
    COALESCE(reg.races_entered, 0)::int AS races_entered,
    COALESCE(res.starts, 0)::int AS starts,
    COALESCE(res.wins, 0)::int AS wins,
    COALESCE(res.podiums, 0)::int AS podiums,
    COALESCE(clean.clean_finishes, 0)::int AS clean_finishes,
    CASE WHEN COALESCE(res.starts, 0) > 0 THEN COALESCE(clean.clean_finishes, 0)::float8 / res.starts::float8 ELSE 0::float8 END AS clean_race_ratio,
    COALESCE(res.points, 0)::int AS points,
    COALESCE(weekly.weekly_points, 0)::int AS weekly_points,
    res.average_finish,
    res.best_finish,
    CASE WHEN COALESCE(weekly.weekly_points, 0) >= 30 THEN 'up' WHEN COALESCE(weekly.weekly_points, 0) > 0 THEN 'stable' ELSE 'down' END::text AS trend
  FROM "User" u
  LEFT JOIN registration_stats reg ON reg.user_id = u.id
  LEFT JOIN result_stats res ON res.user_id = u.id
  LEFT JOIN clean_stats clean ON clean.user_id = u.id
  LEFT JOIN weekly_stats weekly ON weekly.user_id = u.id
  WHERE u.role != 'ADMIN'
)
`;

const fetchRankedLeaderboard = async (type: CompetitiveLeaderboardType, limit: number): Promise<LeaderboardEntry[]> => {
  const orderBy = orderByByType[type];
  const rows = await withPerf('leaderboard.baseRows', () => prisma.$queryRawUnsafe<Array<any>>(`${leaderboardCTE}
    SELECT id, username, avatar_url, role::text, created_at, region, honour_score, skill_rating,
      races_entered, starts, wins, podiums, clean_finishes, clean_race_ratio, points, weekly_points,
      average_finish, best_finish, trend,
      ROW_NUMBER() OVER (ORDER BY ${orderBy})::int AS rank
    FROM leaderboard_base
    ORDER BY ${orderBy}
    LIMIT $1
  `, limit));

  return rows.map((row) => ({
    id: row.id,
    rank: Number(row.rank),
    username: row.username,
    avatarUrl: row.avatar_url,
    role: row.role,
    createdAt: new Date(row.created_at),
    region: row.region,
    honourScore: Number(row.honour_score),
    skillRating: Number(row.skill_rating),
    racesEntered: Number(row.races_entered),
    starts: Number(row.starts),
    wins: Number(row.wins),
    podiums: Number(row.podiums),
    cleanFinishes: Number(row.clean_finishes),
    cleanRaceRatio: Number(row.clean_race_ratio),
    points: Number(row.points),
    weeklyPoints: Number(row.weekly_points),
    averageFinish: row.average_finish == null ? null : Number(row.average_finish),
    bestFinish: row.best_finish == null ? null : Number(row.best_finish),
    trend: row.trend,
  }));
};

export const getRankedLeaderboard = async (type: CompetitiveLeaderboardType, options: { limit?: number } = {}): Promise<LeaderboardEntry[]> => {
  const limit = options.limit ?? 100;
  const key=`ranked:${type}:${limit}`; const cached=cache.get(key); if(cached&&cached.expires>Date.now()) return cached.value;
  const ranked = await withPerf('getRankedLeaderboard', () => fetchRankedLeaderboard(type, limit));
  cache.set(key,{value:ranked,expires:Date.now()+CACHE_TTL_MS});
  return ranked;
};

export const getCompetitiveLeaderboard = async (type: CompetitiveLeaderboardType, limit: number) => getRankedLeaderboard(type, { limit });

export const getLeaderboardWindowForUser = async (type: CompetitiveLeaderboardType, userId: string, radius = 3) => withPerf('getLeaderboardWindowForUser', async () => {
  const orderBy = orderByByType[type];
  const rows = await prisma.$queryRawUnsafe<Array<any>>(`${leaderboardCTE}
    , ranked AS (
      SELECT *, ROW_NUMBER() OVER (ORDER BY ${orderBy})::int AS rank
      FROM leaderboard_base
    ), me AS (
      SELECT rank FROM ranked WHERE id = $1
    )
    SELECT r.id, r.username, r.avatar_url, r.role::text, r.created_at, r.region, r.honour_score, r.skill_rating,
      r.races_entered, r.starts, r.wins, r.podiums, r.clean_finishes, r.clean_race_ratio, r.points, r.weekly_points,
      r.average_finish, r.best_finish, r.trend, r.rank
    FROM ranked r
    CROSS JOIN me
    WHERE r.rank BETWEEN GREATEST(me.rank - $2, 1) AND me.rank + $2
    ORDER BY r.rank ASC
  `, userId, radius);

  if (!rows.length) return { me: null, window: [] };
  const window = rows.map((row) => ({
    id: row.id,
    rank: Number(row.rank),
    username: row.username,
    avatarUrl: row.avatar_url,
    role: row.role,
    createdAt: new Date(row.created_at),
    region: row.region,
    honourScore: Number(row.honour_score),
    skillRating: Number(row.skill_rating),
    racesEntered: Number(row.races_entered),
    starts: Number(row.starts),
    wins: Number(row.wins),
    podiums: Number(row.podiums),
    cleanFinishes: Number(row.clean_finishes),
    cleanRaceRatio: Number(row.clean_race_ratio),
    points: Number(row.points),
    weeklyPoints: Number(row.weekly_points),
    averageFinish: row.average_finish == null ? null : Number(row.average_finish),
    bestFinish: row.best_finish == null ? null : Number(row.best_finish),
    trend: row.trend,
  })) as LeaderboardEntry[];
  return { me: window.find((entry) => entry.id === userId) ?? null, window };
});

export const getRegionalRanks = async (userId: string) =>
  withPerf('getRegionalRanks', async () => {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; region: string; global_rank: number; regional_rank: number }>>(`${leaderboardCTE}
      , ranked AS (
        SELECT id, region,
          ROW_NUMBER() OVER (ORDER BY ${orderByByType.overall})::int AS global_rank,
          ROW_NUMBER() OVER (PARTITION BY region ORDER BY ${orderByByType.overall})::int AS regional_rank
        FROM leaderboard_base
      )
      SELECT id, region, global_rank, regional_rank
      FROM ranked
      WHERE id = $1
      LIMIT 1
    `, userId);

    const row = rows[0];
    return {
      global: row ? Number(row.global_rank) : null,
      regional: row ? Number(row.regional_rank) : null,
      region: row?.region ?? 'GLOBAL',
    };
  });
export const getGlobalSkillLeaderboard = async (limit: number) => getRankedLeaderboard('overall', { limit });
export const getHonourLeaderboard = async (limit: number) => getRankedLeaderboard('honour', { limit });
export const getLeagueStandings = async (leagueSlug: string, limit: number) => { const league = await prisma.league.findUnique({ where: { slug: leagueSlug }, select: { id: true, name: true, slug: true, raceSlots: { where: { status: 'COMPLETED', result: { isNot: null } }, select: { result: { select: { entries: { select: { userId: true, pointsAwarded: true } } } } } } } }); if (!league) return null; const aggregate = new Map<string, number>(); for (const slot of league.raceSlots) for (const entry of slot.result?.entries ?? []) aggregate.set(entry.userId, (aggregate.get(entry.userId) ?? 0) + entry.pointsAwarded); const ids = [...aggregate.keys()]; const users = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, username: true, avatarUrl: true, skillRating: true, honourScore: true } }) : []; const standings = users.map((u) => ({ ...u, points: aggregate.get(u.id) ?? 0 })).sort((a, b) => b.points - a.points || b.skillRating - a.skillRating).slice(0, limit); return { league: { id: league.id, name: league.name, slug: league.slug }, standings }; };
