import { prisma } from '@/lib/db/prisma';
import { withPerf } from '@/lib/utils/perf';

export type CompetitiveLeaderboardType = 'overall' | 'honour' | 'clean' | 'wins' | 'weekly';
export interface LeaderboardEntry { id:string; rank:number; username:string; avatarUrl:string|null; role:'PLAYER'|'ORGANISER'|'ADMIN'; createdAt:Date; region:string; honourScore:number; skillRating:number; racesEntered:number; starts:number; wins:number; podiums:number; cleanFinishes:number; cleanRaceRatio:number; points:number; weeklyPoints:number; averageFinish:number|null; bestFinish:number|null; trend:'up'|'down'|'stable'; }

const CACHE_TTL_MS = 45_000;
const cache = new Map<string, { expires:number; value: LeaderboardEntry[] }>();

const buildBaseRows = async () => withPerf('leaderboard.baseRows', async () => {
  const users = await prisma.user.findMany({ where: { role: { not: 'ADMIN' } }, select: { id:true, username:true, avatarUrl:true, role:true, createdAt:true, region:true, honourScore:true, skillRating:true }, take: 1000 });
  if (!users.length) return [];
  const userIds = users.map((u) => u.id);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [regs, results, clean, weekly] = await Promise.all([
    prisma.raceRegistration.groupBy({ by:['userId'], where:{ userId:{ in:userIds } }, _count:{ userId:true } }),
    prisma.raceResultEntry.findMany({ where:{ userId:{ in:userIds } }, select:{ userId:true, finishingPosition:true, pointsAwarded:true } }),
    prisma.honourEvent.groupBy({ by:['userId'], where:{ userId:{ in:userIds }, type:'CLEAN_RACE', delta:{ gt:0 } }, _count:{ userId:true } }),
    prisma.raceResultEntry.findMany({ where:{ userId:{ in:userIds }, raceResult:{ submittedAt:{ gte:sevenDaysAgo } } }, select:{ userId:true, pointsAwarded:true } }),
  ]);
  const regMap = new Map(regs.map((e) => [e.userId, e._count.userId]));
  const cleanMap = new Map(clean.map((e)=>[e.userId,e._count.userId]));
  const resultStats = new Map<string, {wins:number;podiums:number;points:number;finishes:number;finishSum:number;bestFinish:number|null}>();
  for (const e of results){const c=resultStats.get(e.userId)??{wins:0,podiums:0,points:0,finishes:0,finishSum:0,bestFinish:null};c.wins+=e.finishingPosition===1?1:0;c.podiums+=e.finishingPosition<=3?1:0;c.points+=e.pointsAwarded;c.finishes++;c.finishSum+=e.finishingPosition;c.bestFinish=c.bestFinish?Math.min(c.bestFinish,e.finishingPosition):e.finishingPosition;resultStats.set(e.userId,c)}
  const weeklyMap=new Map<string,number>(); for (const e of weekly) weeklyMap.set(e.userId,(weeklyMap.get(e.userId)??0)+e.pointsAwarded);
  return users.map((u)=>{const r=resultStats.get(u.id)??{wins:0,podiums:0,points:0,finishes:0,finishSum:0,bestFinish:null};const wp=weeklyMap.get(u.id)??0;const cf=cleanMap.get(u.id)??0;return {...u,racesEntered:regMap.get(u.id)??0,starts:r.finishes,wins:r.wins,podiums:r.podiums,cleanFinishes:cf,cleanRaceRatio:r.finishes?cf/r.finishes:0,points:r.points,weeklyPoints:wp,averageFinish:r.finishes?r.finishSum/r.finishes:null,bestFinish:r.bestFinish,trend:wp>=30?'up':wp>0?'stable':'down'};});
});

const sortRowsByType = (rows: Awaited<ReturnType<typeof buildBaseRows>>, type: CompetitiveLeaderboardType) => [...rows].sort((a,b)=> type==='honour'? b.honourScore-a.honourScore||b.cleanRaceRatio-a.cleanRaceRatio||b.skillRating-a.skillRating : type==='clean'? b.cleanRaceRatio-a.cleanRaceRatio||b.cleanFinishes-a.cleanFinishes||b.honourScore-a.honourScore : type==='wins'? b.wins-a.wins||b.podiums-a.podiums||b.skillRating-a.skillRating : type==='weekly'? b.weeklyPoints-a.weeklyPoints||b.skillRating-a.skillRating : b.skillRating-a.skillRating||b.points-a.points||b.honourScore-a.honourScore).map((r,i)=>({...r,rank:i+1}));

export const getRankedLeaderboard = async (type: CompetitiveLeaderboardType): Promise<LeaderboardEntry[]> => {
  const key=`ranked:${type}`; const cached=cache.get(key); if(cached&&cached.expires>Date.now()) return cached.value;
  const ranked = sortRowsByType(await buildBaseRows(), type);
  cache.set(key,{value:ranked,expires:Date.now()+CACHE_TTL_MS});
  return ranked;
};
export const getCompetitiveLeaderboard = async (type: CompetitiveLeaderboardType, limit: number) => (await getRankedLeaderboard(type)).slice(0, limit);
export const getLeaderboardWindowForUser = async (type: CompetitiveLeaderboardType, userId: string, radius = 3) => { const ranked = await getRankedLeaderboard(type); const index = ranked.findIndex((entry) => entry.id === userId); if (index === -1) return { me: null, window: [] }; return { me: ranked[index], window: ranked.slice(Math.max(index - radius, 0), index + radius + 1) }; };
export const getRegionalRanks = async (userId: string) => { const [overall, user] = await Promise.all([getRankedLeaderboard('overall'), prisma.user.findUnique({ where: { id: userId }, select: { region: true } })]); const global = overall.find((entry) => entry.id === userId)?.rank ?? null; const regionalPool = overall.filter((entry) => entry.region === (user?.region ?? 'GLOBAL')); const regional = regionalPool.find((entry) => entry.id === userId)?.rank ?? null; return { global, regional, region: user?.region ?? 'GLOBAL' }; };
export const getGlobalSkillLeaderboard = async (limit: number) => (await getRankedLeaderboard('overall')).slice(0, limit);
export const getHonourLeaderboard = async (limit: number) => (await getRankedLeaderboard('honour')).slice(0, limit);
export const getLeagueStandings = async (leagueSlug: string, limit: number) => { const league = await prisma.league.findUnique({ where: { slug: leagueSlug }, select: { id: true, name: true, slug: true, raceSlots: { where: { status: 'COMPLETED', result: { isNot: null } }, select: { result: { select: { entries: { select: { userId: true, pointsAwarded: true } } } } } } } }); if (!league) return null; const aggregate = new Map<string, number>(); for (const slot of league.raceSlots) for (const entry of slot.result?.entries ?? []) aggregate.set(entry.userId, (aggregate.get(entry.userId) ?? 0) + entry.pointsAwarded); const ids = [...aggregate.keys()]; const users = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, username: true, avatarUrl: true, skillRating: true, honourScore: true } }) : []; const standings = users.map((u) => ({ ...u, points: aggregate.get(u.id) ?? 0 })).sort((a, b) => b.points - a.points || b.skillRating - a.skillRating).slice(0, limit); return { league: { id: league.id, name: league.name, slug: league.slug }, standings }; };
