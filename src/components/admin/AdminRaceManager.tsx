import { useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api/http';

interface RaceRow {
  id: string;
  title: string;
  status: 'DRAFT' | 'OPEN' | 'FULL' | 'LOCKED' | 'COMPLETED' | 'CANCELLED';
  visibility: 'PUBLIC' | 'COMMUNITY_ONLY' | 'UNLISTED' | 'PRIVATE';
  scheduledAt: string;
  registrationCutoffAt: string;
  maxPlayers: number;
  cancellationReason: string | null;
  league: { name: string };
  organiser: { username: string };
  organiserProfile?: { displayName: string } | null;
  _count: { registrations: number; disputes: number; moderationActions: number };
}

export default function AdminRaceManager({ raceSlots }: { raceSlots: RaceRow[] }) {
  const [rows, setRows] = useState(raceSlots);
  const [query, setQuery] = useState('');
  const [flash, setFlash] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((slot) => [slot.title, slot.league.name, slot.organiser.username, slot.organiserProfile?.displayName ?? '', slot.status].join(' ').toLowerCase().includes(q));
  }, [rows, query]);

  const patchSlot = async (id: string, patch: Record<string, unknown>) => {
    try {
      const response = await apiRequest<{ raceSlot: RaceRow }>(`/api/admin/race-slots/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setRows((current) => current.map((item) => (item.id === id ? { ...item, ...response.raceSlot } : item)));
      setFlash('Race slot updated.');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Update failed.');
    }
  };

  const removeSlot = async (id: string) => {
    if (!window.confirm('Delete this race slot permanently?')) return;
    try {
      await apiRequest<{ ok: boolean }>(`/api/admin/race-slots/${id}`, { method: 'DELETE' });
      setRows((current) => current.filter((item) => item.id !== id));
      setFlash('Race slot removed.');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Delete failed.');
    }
  };

  return (
    <section className="panel mt-6 rounded-3xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, organiser, status..." className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 lg:max-w-md" />
        <p className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.16em] text-slate-300">{filtered.length} Events</p>
      </div>
      {flash && <p className="mt-4 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">{flash}</p>}

      <div className="mt-4 grid gap-3">
        {filtered.map((slot) => (
          <article key={slot.id} className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{slot.title}</h3>
                  <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-100">{slot.status}</span>
                  <span className="rounded-full border border-white/20 bg-black/40 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">{slot.visibility}</span>
                </div>
                <p className="mt-1 text-sm text-slate-300">{slot.league.name} · {new Date(slot.scheduledAt).toLocaleString()} · {slot.organiserProfile?.displayName ?? slot.organiser.username}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">{slot._count.registrations}/{slot.maxPlayers} drivers · disputes {slot._count.disputes} · mod actions {slot._count.moderationActions}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <button onClick={() => patchSlot(slot.id, { status: 'OPEN', visibility: 'PUBLIC' })} className="rounded-xl border border-emerald-300/35 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100 transition hover:bg-emerald-500/25">Open</button>
                <button onClick={() => patchSlot(slot.id, { status: 'LOCKED', visibility: 'UNLISTED' })} className="rounded-xl border border-amber-300/35 bg-amber-500/15 px-3 py-2 text-xs text-amber-100 transition hover:bg-amber-500/25">Lock</button>
                <button onClick={() => patchSlot(slot.id, { status: 'COMPLETED' })} className="rounded-xl border border-sky-300/35 bg-sky-500/15 px-3 py-2 text-xs text-sky-100 transition hover:bg-sky-500/25">Complete</button>
                <button onClick={() => patchSlot(slot.id, { status: 'CANCELLED', cancellationReason: 'Cancelled by platform administration.' })} className="rounded-xl border border-rose-300/35 bg-rose-500/15 px-3 py-2 text-xs text-rose-100 transition hover:bg-rose-500/25">Cancel</button>
                <button onClick={() => patchSlot(slot.id, { status: 'DRAFT', visibility: 'PRIVATE' })} className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-slate-100 transition hover:bg-white/10">Move to Draft</button>
                <button onClick={() => removeSlot(slot.id)} className="rounded-xl border border-rose-400/55 bg-rose-500/25 px-3 py-2 text-xs text-rose-50 transition hover:bg-rose-500/35">Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
