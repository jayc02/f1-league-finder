import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api/http';

const DASHBOARD_OVERVIEW_CACHE_KEY = 'racehub.dashboardOverview.v2';
const DASHBOARD_OVERVIEW_TTL_MS = 30_000;

interface RegistrationRow {
  raceSlot: { id: string; title: string; scheduledAt: string; league: { name: string } };
}

interface EventRow {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  league: { name: string };
}

interface DuelRow {
  id: string;
  status: string;
  track: string;
  game: string;
  scheduledAt: string | null;
  createdBy: { username: string };
  opponent: { username: string } | null;
  confirmations: { id: string }[];
}

interface CommunitySummary {
  slug: string;
  displayName: string;
  shortDescription: string | null;
  logoUrl: string | null;
  isPublic: boolean;
  featured: boolean;
  verified: boolean;
}

interface DashboardOverviewData {
  upcomingRegistrations: RegistrationRow[];
  upcomingEvents: EventRow[];
  myDuels: DuelRow[];
  managedCommunity: CommunitySummary | null;
  organiserCtaLabel: string;
}

interface CachedDashboardOverview {
  cachedAt: number;
  data: DashboardOverviewData;
}

const readCachedOverview = (): DashboardOverviewData | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(DASHBOARD_OVERVIEW_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedDashboardOverview;
    if (!parsed.cachedAt || Date.now() - parsed.cachedAt > DASHBOARD_OVERVIEW_TTL_MS) {
      window.sessionStorage.removeItem(DASHBOARD_OVERVIEW_CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    window.sessionStorage.removeItem(DASHBOARD_OVERVIEW_CACHE_KEY);
    return null;
  }
};

const writeCachedOverview = (data: DashboardOverviewData) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(DASHBOARD_OVERVIEW_CACHE_KEY, JSON.stringify({ cachedAt: Date.now(), data }));
  } catch {
    // Ignore storage quota/privacy errors.
  }
};

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] ${className}`} />;
}

function EmptyState({ children }: { children: string }) {
  return <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">{children}</p>;
}

export default function DashboardOverview() {
  const [overview, setOverview] = useState<DashboardOverviewData | null>(() => readCachedOverview());
  const [isLoading, setIsLoading] = useState(!overview);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await apiRequest<DashboardOverviewData>('/api/dashboard/overview');
        if (cancelled) return;
        setOverview(response);
        writeCachedOverview(response);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Dashboard overview could not be loaded.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const managedCommunity = overview?.managedCommunity ?? null;
  const organiserCtaLabel = overview?.organiserCtaLabel ?? 'Community hub';
  const statusLabel = useMemo(() => (isLoading ? 'syncing' : error ? 'needs retry' : 'live'), [error, isLoading]);

  if (error && !overview) {
    return (
      <div className="mt-6 rounded-3xl border border-rose-300/25 bg-rose-500/10 p-6 text-sm text-rose-100">
        <p className="font-semibold">Dashboard overview could not be loaded.</p>
        <p className="mt-1 text-rose-100/80">{error}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-full border border-rose-100/35 px-4 py-2 text-xs uppercase tracking-[0.16em]">Retry</button>
      </div>
    );
  }

  return (
    <div className="mt-8 pb-20 md:pb-0" aria-live="polite">
      <div className="mb-3 hidden justify-end md:flex"><span className="rh-badge rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">{statusLabel}</span></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <article className="panel rounded-3xl p-4 sm:p-6">
          <h2 className="font-display text-2xl">My next race</h2>
          <div className="mt-4 space-y-3">
            {overview ? overview.upcomingRegistrations.length ? overview.upcomingRegistrations.map((registration) => (
              <a key={registration.raceSlot.id} href={`/race-slots/${registration.raceSlot.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/40 hover:bg-white/[0.07]">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{registration.raceSlot.league.name}</p>
                <h3 className="mt-1 font-semibold text-white">{registration.raceSlot.title}</h3>
                <p className="mt-2 text-xs text-slate-400">{new Date(registration.raceSlot.scheduledAt).toLocaleString()}</p>
              </a>
            )) : <EmptyState>No upcoming registrations yet.</EmptyState> : Array.from({ length: 3 }, (_, index) => <SkeletonBlock key={index} className="h-24" />)}
          </div>
        </article>

        <article className="panel rounded-3xl p-4 sm:p-6">
          <h2 className="font-display text-2xl">Open grids</h2>
          <div className="mt-4 space-y-2">
            {overview ? overview.upcomingEvents.length ? overview.upcomingEvents.map((slot) => (
              <a key={slot.id} href={`/race-slots/${slot.id}`} className="block rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 transition hover:border-white/35">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{slot.league.name} · {slot.status}</p>
                <p className="mt-1 font-medium text-white">{slot.title}</p>
              </a>
            )) : <EmptyState>No upcoming events available.</EmptyState> : Array.from({ length: 4 }, (_, index) => <SkeletonBlock key={index} className="h-16" />)}
          </div>
        </article>
      </div>

      <article className="panel mt-6 rounded-3xl p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Two-leg challenges</p>
            <h2 className="font-display text-2xl">Pending duel</h2>
          </div>
          <a href="/duels" className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.16em] text-slate-200 transition hover:border-white/40 hover:bg-white/10">Browse duels</a>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {overview ? overview.myDuels.length ? overview.myDuels.map((duel) => (
            <a key={duel.id} href={`/duels/${duel.id}`} className="block rounded-2xl border border-cyan-300/15 bg-cyan-500/[0.06] p-4 transition hover:border-cyan-200/45 hover:bg-cyan-500/10">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/70">{duel.game} · {duel.status.replaceAll('_', ' ')}</p>
              <h3 className="mt-1 font-semibold text-white">{duel.createdBy.username} vs {duel.opponent?.username ?? 'Open opponent'}</h3>
              <p className="mt-2 text-xs text-slate-400">{duel.track} · {duel.scheduledAt ? new Date(duel.scheduledAt).toLocaleString() : 'Open challenge'}{duel.confirmations.length ? ' · awaiting opponent confirmation' : ''}</p>
            </a>
          )) : <EmptyState>No duels yet. Create or accept a 1v1 challenge.</EmptyState> : Array.from({ length: 2 }, (_, index) => <SkeletonBlock key={index} className="h-24" />)}
        </div>
      </article>

      <article className="panel mt-6 rounded-3xl p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            {managedCommunity?.logoUrl && <img src={managedCommunity.logoUrl} alt={`${managedCommunity.displayName} logo`} className="h-14 w-14 rounded-2xl border border-white/10 object-cover" />}
            <div>
              <h2 className="font-display text-2xl">My Community</h2>
              {overview ? managedCommunity ? (
                <>
                  <p className="mt-2 text-lg font-semibold text-white">{managedCommunity.displayName}</p>
                  {managedCommunity.shortDescription && <p className="mt-1 max-w-2xl text-sm text-slate-300 line-clamp-2 md:line-clamp-none">{managedCommunity.shortDescription}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rh-badge rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${managedCommunity.isPublic ? 'border-emerald-300/35 bg-emerald-500/15 text-emerald-100' : 'border-slate-300/25 bg-white/5 text-slate-200'}`}>{managedCommunity.isPublic ? 'Public' : 'Private'}</span>
                    {managedCommunity.verified && <span className="rh-badge rounded-full border border-cyan-300/35 bg-cyan-500/15 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-100">Verified</span>}
                    {managedCommunity.featured && <span className="rh-badge rounded-full border border-amber-300/35 bg-amber-500/15 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-amber-100">Featured</span>}
                  </div>
                </>
              ) : <p className="mt-3 max-w-2xl text-sm text-slate-300">You can create and manage your public RaceHub community at any time.</p> : <SkeletonBlock className="mt-3 h-24 w-full max-w-xl" />}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <a href="/dashboard/community" className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.16em] text-slate-200 transition hover:border-white/40 hover:bg-white/10">{organiserCtaLabel}</a>
            {managedCommunity?.isPublic && <a href={`/communities/${managedCommunity.slug}`} className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.16em] text-slate-200 transition hover:border-white/40 hover:bg-white/10">View Public Page</a>}
          </div>
        </div>
      </article>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-black/80 px-3 py-2 text-center text-[11px] font-semibold text-slate-200 backdrop-blur-xl mobile-safe-bottom md:hidden">
        <a href="/duels" className="rounded-xl px-2 py-2">Duels</a>
        <a href="/race-slots" className="rounded-xl px-2 py-2">Races</a>
        <a href="/dashboard" className="rounded-xl bg-white/10 px-2 py-2 text-white">Dash</a>
        <a href="/profile" className="rounded-xl px-2 py-2">Profile</a>
      </nav>
    </div>
  );
}
