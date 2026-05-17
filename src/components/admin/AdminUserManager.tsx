import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api/http';

type Role = 'PLAYER' | 'ORGANISER' | 'ADMIN';
interface UserRow {
  id: string;
  username: string;
  email: string;
  role: Role;
  region: string;
  honourScore: number;
  skillRating: number;
  suspensionNote: string | null;
  createdAt: string;
  preferredPlatform: 'PC' | 'PLAYSTATION' | 'XBOX' | null;
  organiserProfile?: { displayName: string; verified: boolean; isPublic: boolean; featured: boolean } | null;
  _count: { raceRegistrations: number; raceSlotsOrganised: number; disputesOpened: number };
}

const emptyRatingForm = { skillRating: '', honourScore: '', reason: '' };

export default function AdminUserManager({ users = [] }: { users?: UserRow[] }) {
  const [rows, setRows] = useState(users);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState('');
  const [loading, setLoading] = useState(users.length === 0);
  const [ratingForms, setRatingForms] = useState<Record<string, typeof emptyRatingForm>>({});

  const loadUsers = async (q = query) => {
    setLoading(true);
    setFlash('');
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (q.trim()) params.set('q', q.trim());
      const response = await apiRequest<{ users: UserRow[] }>(`/api/admin/users?${params.toString()}`);
      setRows(response.users.map((user) => ({ ...user, createdAt: String(user.createdAt) })));
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (users.length === 0) void loadUsers('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((user) => [user.username, user.email, user.role, user.region, user.organiserProfile?.displayName ?? ''].join(' ').toLowerCase().includes(q));
  }, [rows, query]);

  const updateUser = async (id: string, patch: Partial<Pick<UserRow, 'role' | 'suspensionNote'>>) => {
    setBusyId(id);
    setFlash('');
    try {
      const response = await apiRequest<{ user: Pick<UserRow, 'id' | 'role' | 'honourScore' | 'skillRating' | 'suspensionNote'> }>(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setRows((current) => current.map((item) => (item.id === id ? { ...item, ...response.user } : item)));
      setFlash('User profile controls updated.');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Unable to update user.');
    } finally {
      setBusyId(null);
    }
  };

  const ratingFormFor = (user: UserRow) => ratingForms[user.id] ?? { skillRating: String(user.skillRating), honourScore: String(user.honourScore), reason: '' };
  const setRatingForm = (id: string, patch: Partial<typeof emptyRatingForm>) => setRatingForms((current) => ({ ...current, [id]: { ...(current[id] ?? emptyRatingForm), ...patch } }));

  const saveRatings = async (user: UserRow) => {
    const form = ratingFormFor(user);
    const skillRating = Number(form.skillRating);
    const honourScore = Number(form.honourScore);
    if (!Number.isInteger(skillRating) || !Number.isInteger(honourScore)) {
      setFlash('Skill rating and honour must be whole numbers.');
      return;
    }
    if (form.reason.trim().length < 5) {
      setFlash('A reason of at least 5 characters is required for rating changes.');
      return;
    }
    const summary = `${user.username}: SR ${user.skillRating} → ${skillRating}, Honour ${user.honourScore} → ${honourScore}.`;
    if (!window.confirm(`Apply manual rating adjustment?\n\n${summary}\n\nReason: ${form.reason.trim()}`)) return;
    setBusyId(user.id);
    setFlash('');
    try {
      const response = await apiRequest<{ user: Pick<UserRow, 'id' | 'skillRating' | 'honourScore'> }>(`/api/admin/users/${user.id}/ratings`, {
        method: 'PATCH',
        body: JSON.stringify({ skillRating, honourScore, reason: form.reason.trim() }),
      });
      setRows((current) => current.map((item) => (item.id === user.id ? { ...item, ...response.user } : item)));
      setRatingForms((current) => ({ ...current, [user.id]: { skillRating: String(response.user.skillRating), honourScore: String(response.user.honourScore), reason: '' } }));
      setFlash('Manual rating adjustment saved and audited.');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Unable to update ratings.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="panel mt-6 rounded-3xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-2xl">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users, email, region, role..." className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-rose-300/60" />
          <button type="button" onClick={() => loadUsers()} className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.16em] text-slate-100 transition hover:bg-white/10">Search</button>
        </div>
        <p className="rh-badge rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.16em] text-slate-300">{loading ? 'Loading' : `${filtered.length} Users`}</p>
      </div>
      {flash && <p className="mt-4 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">{flash}</p>}

      <div className="mt-4 grid gap-3">
        {loading && !rows.length && Array.from({ length: 6 }, (_, index) => <div key={index} className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />)}
        {filtered.map((user) => {
          const busy = busyId === user.id;
          const form = ratingFormFor(user);
          return (
            <article key={user.id} className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{user.username}</h3>
                    <span className="rh-badge rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">{user.role}</span>
                    {user.suspensionNote && <span className="rh-badge rounded-full border border-rose-300/40 bg-rose-500/20 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-rose-100">Suspended</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{user.email} · {user.region} · {user.preferredPlatform ?? 'No platform set'}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">SR {user.skillRating} · Honour {user.honourScore} · Entries {user._count.raceRegistrations} · Organised {user._count.raceSlotsOrganised} · Disputes {user._count.disputesOpened}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-4">
                  <button disabled={busy} onClick={() => updateUser(user.id, { role: 'PLAYER' })} className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-slate-100 transition hover:bg-white/10 disabled:opacity-45">Set PLAYER</button>
                  <button disabled={busy} onClick={() => updateUser(user.id, { role: 'ORGANISER' })} className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-slate-100 transition hover:bg-white/10 disabled:opacity-45">Set ORGANISER</button>
                  <button disabled={busy} onClick={() => updateUser(user.id, { role: 'ADMIN' })} className="rounded-xl border border-amber-300/40 bg-amber-500/15 px-3 py-2 text-xs text-amber-100 transition hover:bg-amber-500/25 disabled:opacity-45">Set ADMIN</button>
                  <button disabled={busy} onClick={() => updateUser(user.id, { suspensionNote: user.suspensionNote ? null : 'Suspended by admin for investigation.' })} className="rounded-xl border border-rose-300/40 bg-rose-500/15 px-3 py-2 text-xs text-rose-100 transition hover:bg-rose-500/25 disabled:opacity-45">{user.suspensionNote ? 'Clear suspension' : 'Suspend'}</button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Manual SR / Honour adjustment</p>
                <div className="mt-3 grid gap-3 lg:grid-cols-[120px_120px_1fr_auto]">
                  <input type="number" min={0} max={9999} value={form.skillRating} onChange={(event) => setRatingForm(user.id, { skillRating: event.target.value })} className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" aria-label="Skill rating" />
                  <input type="number" min={0} max={9999} value={form.honourScore} onChange={(event) => setRatingForm(user.id, { honourScore: event.target.value })} className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" aria-label="Honour score" />
                  <input value={form.reason} onChange={(event) => setRatingForm(user.id, { reason: event.target.value })} placeholder="Required audit reason / steward note" className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" />
                  <button disabled={busy} onClick={() => saveRatings(user)} className="rounded-xl border border-cyan-300/40 bg-cyan-500/15 px-4 py-2 text-xs uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-500/25 disabled:opacity-45">Save ratings</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setRatingForm(user.id, { skillRating: String(Number(form.skillRating || user.skillRating) + 25) })} className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200">+25 SR</button>
                  <button type="button" onClick={() => setRatingForm(user.id, { skillRating: String(Math.max(0, Number(form.skillRating || user.skillRating) - 25)) })} className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200">-25 SR</button>
                  <button type="button" onClick={() => setRatingForm(user.id, { honourScore: String(Number(form.honourScore || user.honourScore) + 10) })} className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200">+10 Honour</button>
                  <button type="button" onClick={() => setRatingForm(user.id, { honourScore: String(Math.max(0, Number(form.honourScore || user.honourScore) - 10)) })} className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200">-10 Honour</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
