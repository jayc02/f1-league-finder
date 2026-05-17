import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api/http';

interface CommunityRow {
  id: string;
  displayName: string;
  slug: string;
  region: string;
  verified: boolean;
  featured: boolean;
  isPublic: boolean;
  displayedMemberCount: number;
  credibilityNotes: string | null;
  user: { username: string; email: string };
  _count: { raceSlots: number; leagues: number };
}

export default function AdminCommunityManager({ communities = [] }: { communities?: CommunityRow[] }) {
  const [rows, setRows] = useState(communities);
  const [loading, setLoading] = useState(communities.length === 0);
  const [query, setQuery] = useState('');
  const [flash, setFlash] = useState('');

  useEffect(() => {
    if (communities.length > 0) return;
    let cancelled = false;
    const loadRows = async () => {
      setLoading(true);
      try {
        const response = await apiRequest<{ communities: CommunityRow[] }>('/api/admin/communities?limit=50');
        if (!cancelled) setRows(response.communities);
      } catch (error) {
        if (!cancelled) setFlash(error instanceof Error ? error.message : 'Unable to load admin rows.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadRows();
    return () => { cancelled = true; };
  }, [communities.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((community) => [community.displayName, community.slug, community.user.username, community.region].join(' ').toLowerCase().includes(q));
  }, [rows, query]);

  const patchCommunity = async (id: string, patch: Record<string, unknown>) => {
    try {
      const response = await apiRequest<{ community: CommunityRow }>(`/api/admin/communities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setRows((current) => current.map((item) => (item.id === id ? { ...item, ...response.community } : item)));
      setFlash('Community settings updated.');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Unable to update community.');
    }
  };

  const deleteCommunity = async (id: string) => {
    if (!window.confirm('Remove this community profile?')) return;
    try {
      await apiRequest<{ ok: boolean }>(`/api/admin/communities/${id}`, { method: 'DELETE' });
      setRows((current) => current.filter((item) => item.id !== id));
      setFlash('Community removed.');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Unable to remove community.');
    }
  };

  return (
    <section className="panel mt-6 rounded-3xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search communities, owner, region..." className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60 lg:max-w-md" />
        <p className="rh-badge rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.16em] text-slate-300">{loading ? 'Loading' : `${filtered.length} Communities`}</p>
      </div>
      {flash && <p className="mt-4 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">{flash}</p>}

      <div className="mt-4 grid gap-3">
        {loading && !rows.length && Array.from({ length: 5 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />)}
        {filtered.map((community) => (
          <article key={community.id} className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{community.displayName}</h3>
                  {community.verified && <span className="rh-badge rounded-full border border-cyan-300/35 bg-cyan-500/15 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-100">Verified</span>}
                  {community.featured && <span className="rh-badge rounded-full border border-amber-300/35 bg-amber-500/15 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-amber-100">Featured</span>}
                  <span className="rh-badge rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-100">{community.isPublic ? 'Public' : 'Private'}</span>
                </div>
                <p className="mt-1 text-sm text-slate-300">/{community.slug} · {community.region} · owner {community.user.username}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">{community._count.raceSlots} events · {community._count.leagues} leagues · displayed members {community.displayedMemberCount.toLocaleString()}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <button onClick={() => patchCommunity(community.id, { verified: !community.verified })} className="rounded-xl border border-cyan-300/35 bg-cyan-500/15 px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-500/25">{community.verified ? 'Unverify' : 'Verify'}</button>
                <button onClick={() => patchCommunity(community.id, { featured: !community.featured })} className="rounded-xl border border-amber-300/35 bg-amber-500/15 px-3 py-2 text-xs text-amber-100 transition hover:bg-amber-500/25">{community.featured ? 'Unfeature' : 'Feature'}</button>
                <button onClick={() => patchCommunity(community.id, { isPublic: !community.isPublic })} className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-slate-100 transition hover:bg-white/10">{community.isPublic ? 'Make Private' : 'Make Public'}</button>
                <button onClick={() => patchCommunity(community.id, { displayedMemberCount: Math.max(0, community.displayedMemberCount) })} className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-slate-100 transition hover:bg-white/10">Resave Count</button>
                <button onClick={() => patchCommunity(community.id, { credibilityNotes: 'Admin reviewed and updated.' })} className="rounded-xl border border-violet-300/35 bg-violet-500/15 px-3 py-2 text-xs text-violet-100 transition hover:bg-violet-500/25">Add Review Note</button>
                <button onClick={() => deleteCommunity(community.id)} className="rounded-xl border border-rose-400/55 bg-rose-500/25 px-3 py-2 text-xs text-rose-50 transition hover:bg-rose-500/35">Remove</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
