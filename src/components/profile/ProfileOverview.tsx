import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api/http';
import { PROFILE_OVERVIEW_CACHE_KEY } from '@/lib/profile-overview-cache';

const PROFILE_OVERVIEW_TTL_MS = 30_000;

interface OverviewStats {
  skillRating: number | null;
  honourScore: number | null;
  starts: number;
  wins: number;
  podiums: number;
  cleanRaceRatio: number;
  rank: number | null;
  regionalRank: number | null;
  region: string;
  completedRaces: number;
  winRate: number;
  podiumRate: number;
  bestFinish: number | null;
  points: number;
}

interface RecentResult {
  id: string;
  finishingPosition: number;
  pointsAwarded: number;
  ratingDelta: number;
  honourDelta: number;
  raceResult: {
    submittedAt: string;
    raceSlot: { id: string; title: string; track?: string | null; league: { name: string } };
  };
}

interface UpcomingRegistration {
  id: string;
  createdAt: string;
  raceSlot: {
    id: string;
    title: string;
    track?: string | null;
    scheduledAt: string;
    status: string;
    league: { name: string };
    organiserProfile?: { slug: string; displayName: string } | null;
  };
}

interface Accolade {
  id: string;
  title: string;
  description: string;
  category: string;
  tier: 'legend' | 'elite' | 'pro' | 'core';
}

interface OverviewData {
  stats: OverviewStats;
  recentResults: RecentResult[];
  upcomingRegistrations: UpcomingRegistration[];
  community: { owned: null | { displayName: string; slug: string; verified: boolean; displayedMemberCount: number }; membershipCount: number };
  accolades: Accolade[];
  counts: { registrations: number; recentResults: number; upcomingRegistrations: number; communities: number };
}

interface CachedOverview {
  cachedAt: number;
  data: OverviewData;
}

const readCachedOverview = (): OverviewData | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PROFILE_OVERVIEW_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedOverview;
    if (!parsed.cachedAt || Date.now() - parsed.cachedAt > PROFILE_OVERVIEW_TTL_MS) {
      window.sessionStorage.removeItem(PROFILE_OVERVIEW_CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    window.sessionStorage.removeItem(PROFILE_OVERVIEW_CACHE_KEY);
    return null;
  }
};

const writeCachedOverview = (data: OverviewData) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(PROFILE_OVERVIEW_CACHE_KEY, JSON.stringify({ cachedAt: Date.now(), data }));
  } catch {
    // Ignore storage failures; the freshly fetched data is still rendered.
  }
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const tierClass: Record<Accolade['tier'], string> = {
  legend: 'border-amber-300/40 bg-amber-400/10 text-amber-100',
  elite: 'border-fuchsia-300/35 bg-fuchsia-400/10 text-fuchsia-100',
  pro: 'border-sky-300/35 bg-sky-400/10 text-sky-100',
  core: 'border-white/15 bg-white/[0.04] text-slate-100',
};

function SkeletonCard({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" aria-label={`${label} loading`}>
      <div className="h-3 w-24 rounded bg-white/10" />
      <div className="mt-3 h-8 w-16 rounded bg-white/10" />
    </div>
  );
}

function EmptyState({ children }: { children: string }) {
  return <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">{children}</p>;
}

export default function ProfileOverview() {
  const [overview, setOverview] = useState<OverviewData | null>(() => readCachedOverview());
  const [isLoading, setIsLoading] = useState(() => !readCachedOverview());
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const cached = readCachedOverview();
    if (cached) {
      setOverview(cached);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    apiRequest<OverviewData>('/api/profile/overview')
      .then((data) => {
        writeCachedOverview(data);
        if (!cancelled) {
          setOverview(data);
          setError('');
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Unable to load profile overview.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const statusCards = useMemo(() => {
    if (!overview) return [];
    return [
      ['Win Rate', `${overview.stats.winRate}%`],
      ['Podium Rate', `${overview.stats.podiumRate}%`],
      ['Clean Ratio', `${overview.stats.cleanRaceRatio}%`],
      ['Best Finish', overview.stats.bestFinish ? `P${overview.stats.bestFinish}` : '—'],
    ];
  }, [overview]);

  if (error && !overview) {
    return (
      <div className="mt-6 rounded-3xl border border-rose-300/25 bg-rose-500/10 p-6 text-sm text-rose-100">
        <p className="font-semibold">Profile overview could not be loaded.</p>
        <p className="mt-1 text-rose-100/80">{error}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-full border border-rose-100/35 px-4 py-2 text-xs uppercase tracking-[0.16em]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6" aria-live="polite">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {overview ? [
          ['SR', overview.stats.skillRating ?? '—'],
          ['Honour', overview.stats.honourScore ?? '—'],
          ['Global Rank', overview.stats.rank ? `#${overview.stats.rank}` : '—'],
          ['Completed', overview.stats.completedRaces],
          ['Regional Rank', overview.stats.regionalRank ? `#${overview.stats.regionalRank}` : '—'],
          ['Starts', overview.stats.starts],
        ].map(([label, value], index) => (
          <div key={label} className={`rounded-2xl border border-white/10 bg-black/25 p-4 ${index > 3 ? 'hidden md:block' : ''}`}>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </div>
        )) : Array.from({ length: 4 }, (_, index) => <SkeletonCard key={index} label="summary" />)}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="panel hidden min-h-[220px] rounded-3xl p-6 md:block">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Profile Status</h2>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{isLoading ? 'syncing' : 'live'}</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {overview ? statusCards.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-2 font-display text-3xl">{value}</p>
              </div>
            )) : Array.from({ length: 4 }, (_, index) => <SkeletonCard key={index} label="status" />)}
          </div>
        </article>

        <article className="panel min-h-[220px] rounded-3xl p-6">
          <h2 className="font-display text-2xl">Community</h2>
          {overview ? (
            overview.community.owned ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="font-medium text-white">{overview.community.owned.displayName}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-500">
                  {overview.community.owned.verified ? 'Verified' : 'Community'} · {overview.community.owned.displayedMemberCount} members
                </p>
                <a className="mt-2 inline-block text-xs uppercase tracking-[0.15em] text-slate-300 hover:text-white" href={`/communities/${overview.community.owned.slug}`}>View public page</a>
              </div>
            ) : (
              <EmptyState>No community created yet.</EmptyState>
            )
          ) : (
            <div className="mt-4 h-24 rounded-xl border border-white/10 bg-white/[0.03]" />
          )}
          {overview && overview.community.membershipCount > 0 && <p className="mt-3 text-xs text-slate-400">Member of {overview.community.membershipCount} RaceHub communities.</p>}
        </article>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="panel min-h-[260px] rounded-3xl p-6">
          <h2 className="font-display text-2xl">Upcoming Races</h2>
          <div className="mt-4 space-y-2">
            {overview ? (
              overview.upcomingRegistrations.length ? overview.upcomingRegistrations.map((registration) => (
                <a key={registration.id} href={`/race-slots/${registration.raceSlot.id}`} className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-white/35">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{registration.raceSlot.league.name}</p>
                  <p className="mt-1 font-medium text-white">{registration.raceSlot.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(registration.raceSlot.scheduledAt)} · {registration.raceSlot.status}</p>
                </a>
              )) : <EmptyState>No upcoming races.</EmptyState>
            ) : Array.from({ length: 3 }, (_, index) => <div key={index} className="h-20 rounded-xl border border-white/10 bg-white/[0.03]" />)}
          </div>
        </article>

        <article className="panel min-h-[260px] rounded-3xl p-6">
          <h2 className="font-display text-2xl">Recent Results</h2>
          <div className="mt-4 space-y-2">
            {overview ? (
              overview.recentResults.length ? overview.recentResults.map((entry) => (
                <a key={entry.id} href={`/race-slots/${entry.raceResult.raceSlot.id}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-white/35">
                  <div>
                    <p className="font-medium text-white">{entry.raceResult.raceSlot.title}</p>
                    <p className="text-xs text-slate-500">{new Date(entry.raceResult.submittedAt).toLocaleDateString()} · {entry.pointsAwarded} pts</p>
                  </div>
                  <p className="text-sm font-semibold text-white">P{entry.finishingPosition}</p>
                </a>
              )) : <EmptyState>No race results yet.</EmptyState>
            ) : Array.from({ length: 3 }, (_, index) => <div key={index} className="h-16 rounded-xl border border-white/10 bg-white/[0.03]" />)}
          </div>
        </article>
      </div>

      <article className="panel mt-6 min-h-[170px] rounded-3xl p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Accolades</h2>
          {overview && <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{overview.counts.registrations} registrations</p>}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {overview ? (
            overview.accolades.length ? overview.accolades.map((accolade) => (
              <div key={accolade.id} className={`rounded-2xl border p-4 ${tierClass[accolade.tier]}`} title={accolade.description}>
                <p className="text-[10px] uppercase tracking-[0.18em] opacity-70">{accolade.category}</p>
                <p className="mt-1 font-semibold uppercase tracking-[0.08em]">{accolade.title}</p>
              </div>
            )) : <p className="col-span-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">Accolades unlock as you race, win, and keep it clean.</p>
          ) : Array.from({ length: 3 }, (_, index) => <SkeletonCard key={index} label="accolade" />)}
        </div>
      </article>
    </div>
  );
}
