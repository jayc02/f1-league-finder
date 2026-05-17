import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api/http';

type DuelStatus = 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED' | 'EXPIRED';

interface DuelUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  skillRating: number;
  honourScore: number;
}

interface DuelConfirmation {
  id: string;
  userId: string;
  confirmedWinnerId: string | null;
  evidenceUrl: string | null;
  notes: string | null;
  confirmedAt: string;
  user: DuelUser;
}

interface AdminDuelRow {
  id: string;
  status: DuelStatus;
  ranked: boolean;
  game: string;
  track: string;
  raceLength: string;
  weather: string;
  rulesSummary: string | null;
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  winnerUserId: string | null;
  resultAppliedAt: string | null;
  createdBy: DuelUser;
  opponent: DuelUser | null;
  winner: DuelUser | null;
  community: { id: string; slug: string; displayName: string } | null;
  confirmations: DuelConfirmation[];
}

const winnerLabel = (duel: AdminDuelRow, userId?: string | null) => {
  if (!userId) return 'No winner selected';
  if (userId === duel.createdBy.id) return duel.createdBy.username;
  if (userId === duel.opponent?.id) return duel.opponent.username;
  return userId;
};

export default function AdminDuelManager({ initialDuels = [] }: { initialDuels?: AdminDuelRow[] }) {
  const [duels, setDuels] = useState(initialDuels);
  const [loading, setLoading] = useState(initialDuels.length === 0);
  const [query, setQuery] = useState('');
  const [flash, setFlash] = useState('');

  const loadDuels = async () => {
    setLoading(true);
    try {
      const response = await apiRequest<{ duels: AdminDuelRow[] }>('/api/admin/duels?limit=75');
      setDuels(response.duels);
      setFlash('');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Unable to load duel disputes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialDuels.length > 0) return;
    void loadDuels();
  }, [initialDuels.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return duels;
    return duels.filter((duel) => [duel.status, duel.game, duel.track, duel.createdBy.username, duel.opponent?.username ?? '', duel.community?.displayName ?? ''].join(' ').toLowerCase().includes(q));
  }, [duels, query]);

  const resolveDuel = async (duel: AdminDuelRow, action: 'COMPLETED' | 'CANCELLED' | 'DISPUTED') => {
    const reason = window.prompt(action === 'COMPLETED' ? 'Admin resolution note (required):' : 'Admin reason/note (required):');
    if (!reason) return;
    let winnerUserId: string | undefined;
    if (action === 'COMPLETED') {
      winnerUserId = window.prompt(`Winner user id (${duel.createdBy.username}: ${duel.createdBy.id}${duel.opponent ? `, ${duel.opponent.username}: ${duel.opponent.id}` : ''})`, duel.confirmations[0]?.confirmedWinnerId ?? duel.createdBy.id) ?? undefined;
      if (!winnerUserId) return;
    }

    try {
      const response = await apiRequest<{ duel: AdminDuelRow }>(`/api/admin/duels/${duel.id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ action, winnerUserId, reason }),
      });
      setDuels((current) => current.map((item) => (item.id === duel.id ? { ...item, ...response.duel } : item)).filter((item) => ['DISPUTED', 'AWAITING_CONFIRMATION'].includes(item.status)));
      setFlash('Duel resolution saved and audited.');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Duel resolution failed.');
    }
  };

  return (
    <section className="panel mt-6 rounded-3xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-2xl text-white">1v1 Duel Dispute Queue</h2>
          <p className="mt-1 text-sm text-slate-300">DISPUTED duels and stale confirmations requiring platform-admin review.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search duels..." className="rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60" />
          <button onClick={() => void loadDuels()} className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-100 transition hover:bg-white/10">Refresh</button>
        </div>
      </div>
      {flash && <p className="mt-4 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">{flash}</p>}

      <div className="mt-4 grid gap-4">
        {loading && !duels.length && Array.from({ length: 3 }, (_, index) => <div key={index} className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />)}
        {!loading && filtered.length === 0 && <p className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-slate-300">No disputed or stale confirmation duels are currently queued.</p>}
        {filtered.map((duel) => (
          <article key={duel.id} className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{duel.createdBy.username} vs {duel.opponent?.username ?? 'Open opponent'}</h3>
                  <span className="rh-badge rounded-full border border-rose-300/35 bg-rose-500/15 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-rose-100">{duel.status.replaceAll('_', ' ')}</span>
                  <span className="rh-badge rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-100">{duel.ranked ? 'Ranked' : 'Unranked'}</span>
                </div>
                <p className="mt-1 text-sm text-slate-300">{duel.game} · {duel.track} · {duel.raceLength} · {duel.weather}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">Created {new Date(duel.createdAt).toLocaleString()} · Updated {new Date(duel.updatedAt).toLocaleString()} · {duel.community?.displayName ?? 'Public arena'}</p>
                {duel.rulesSummary && <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">{duel.rulesSummary}</p>}
              </div>
              <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[26rem]">
                <button onClick={() => void resolveDuel(duel, 'COMPLETED')} className="rounded-xl border border-emerald-300/35 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100 transition hover:bg-emerald-500/25">Complete</button>
                <button onClick={() => void resolveDuel(duel, 'CANCELLED')} className="rounded-xl border border-rose-300/35 bg-rose-500/15 px-3 py-2 text-xs text-rose-100 transition hover:bg-rose-500/25">Cancel</button>
                <button onClick={() => void resolveDuel(duel, 'DISPUTED')} className="rounded-xl border border-amber-300/35 bg-amber-500/15 px-3 py-2 text-xs text-amber-100 transition hover:bg-amber-500/25">Keep disputed</button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {duel.confirmations.map((confirmation) => (
                <div key={confirmation.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-sm font-semibold text-white">{confirmation.user.username} confirmed {winnerLabel(duel, confirmation.confirmedWinnerId)}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{new Date(confirmation.confirmedAt).toLocaleString()}</p>
                  {confirmation.notes && <p className="mt-2 text-sm text-slate-300">{confirmation.notes}</p>}
                  {confirmation.evidenceUrl && <a href={confirmation.evidenceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-cyan-200 underline">Evidence link</a>}
                </div>
              ))}
              {duel.confirmations.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-3 text-sm text-slate-400">No confirmations recorded yet.</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
