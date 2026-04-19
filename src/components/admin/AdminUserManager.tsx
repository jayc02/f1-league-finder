import { useMemo, useState } from 'react';
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

export default function AdminUserManager({ users }: { users: UserRow[] }) {
  const [rows, setRows] = useState(users);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((user) => [user.username, user.email, user.role, user.region, user.organiserProfile?.displayName ?? ''].join(' ').toLowerCase().includes(q));
  }, [rows, query]);

  const updateUser = async (id: string, patch: Partial<Pick<UserRow, 'role' | 'honourScore' | 'skillRating' | 'suspensionNote'>>) => {
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

  return (
    <section className="panel mt-6 rounded-3xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users, email, region, role..." className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-rose-300/60 lg:max-w-md" />
        <p className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.16em] text-slate-300">{filtered.length} Users</p>
      </div>
      {flash && <p className="mt-4 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">{flash}</p>}

      <div className="mt-4 grid gap-3">
        {filtered.map((user) => {
          const busy = busyId === user.id;
          return (
            <article key={user.id} className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{user.username}</h3>
                    <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">{user.role}</span>
                    {user.suspensionNote && <span className="rounded-full border border-rose-300/40 bg-rose-500/20 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-rose-100">Suspended</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{user.email} · {user.region} · {user.preferredPlatform ?? 'No platform set'}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">Entries {user._count.raceRegistrations} · Organised {user._count.raceSlotsOrganised} · Disputes {user._count.disputesOpened}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-4">
                  <button disabled={busy} onClick={() => updateUser(user.id, { role: 'PLAYER' })} className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-slate-100 transition hover:bg-white/10 disabled:opacity-45">Set PLAYER</button>
                  <button disabled={busy} onClick={() => updateUser(user.id, { role: 'ORGANISER' })} className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-slate-100 transition hover:bg-white/10 disabled:opacity-45">Set ORGANISER</button>
                  <button disabled={busy} onClick={() => updateUser(user.id, { role: 'ADMIN' })} className="rounded-xl border border-amber-300/40 bg-amber-500/15 px-3 py-2 text-xs text-amber-100 transition hover:bg-amber-500/25 disabled:opacity-45">Set ADMIN</button>
                  <button disabled={busy} onClick={() => updateUser(user.id, { suspensionNote: user.suspensionNote ? null : 'Suspended by admin for investigation.' })} className="rounded-xl border border-rose-300/40 bg-rose-500/15 px-3 py-2 text-xs text-rose-100 transition hover:bg-rose-500/25 disabled:opacity-45">{user.suspensionNote ? 'Clear suspension' : 'Suspend'}</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
