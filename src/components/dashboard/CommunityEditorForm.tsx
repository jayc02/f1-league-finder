import { useMemo, useState, type FormEvent } from 'react';
import { apiRequest } from '@/lib/api/http';

interface CommunityState {
  displayName: string;
  slug: string;
  shortDescription: string;
  description: string;
  brandingColor: string;
  logoUrl: string;
  bannerUrl: string;
  websiteUrl: string;
  discordUrl: string;
  redditUrl: string;
  gameFocus: string;
  platformFocus: '' | 'PC' | 'PLAYSTATION' | 'XBOX';
  region: 'EU' | 'NA' | 'SA' | 'APAC' | 'MENA' | 'GLOBAL';
  tags: string;
  displayedMemberCount: number;
  memberCountSource: 'manual' | 'discord-sync' | 'reddit-sync';
  isPublic: boolean;
  featured: boolean;
  credibilityNotes: string;
}

interface Props {
  initialState: CommunityState;
}

export default function CommunityEditorForm({ initialState }: Props) {
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const computedSlug = useMemo(() => form.slug || form.displayName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), [form.slug, form.displayName]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await apiRequest('/api/organiser/community', {
        method: 'PATCH',
        body: JSON.stringify({
          ...form,
          slug: computedSlug,
          platformFocus: form.platformFocus || null,
          shortDescription: form.shortDescription || null,
          description: form.description || null,
          brandingColor: form.brandingColor || null,
          logoUrl: form.logoUrl || null,
          bannerUrl: form.bannerUrl || null,
          websiteUrl: form.websiteUrl || null,
          discordUrl: form.discordUrl || null,
          redditUrl: form.redditUrl || null,
          gameFocus: form.gameFocus || null,
          credibilityNotes: form.credibilityNotes || null,
          tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        }),
      });
      setMessage('Community profile updated.');
      window.setTimeout(() => {
        window.location.href = `/communities/${computedSlug}`;
      }, 800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update community.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="panel rounded-3xl p-6 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Community name</label>
            <input value={form.displayName} onChange={(event) => setForm((state) => ({ ...state, displayName: event.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3" required />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Slug</label>
            <input value={computedSlug} onChange={(event) => setForm((state) => ({ ...state, slug: event.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3" required />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Short description</label>
            <input value={form.shortDescription} onChange={(event) => setForm((state) => ({ ...state, shortDescription: event.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Community story</label>
            <textarea value={form.description} onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))} className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.bannerUrl} onChange={(event) => setForm((state) => ({ ...state, bannerUrl: event.target.value }))} placeholder="Banner image URL" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3" />
            <input value={form.logoUrl} onChange={(event) => setForm((state) => ({ ...state, logoUrl: event.target.value }))} placeholder="Logo URL" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3" />
            <input value={form.brandingColor} onChange={(event) => setForm((state) => ({ ...state, brandingColor: event.target.value }))} placeholder="#E10600" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3" />
            <input value={form.gameFocus} onChange={(event) => setForm((state) => ({ ...state, gameFocus: event.target.value }))} placeholder="Game focus" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <select value={form.region} onChange={(event) => setForm((state) => ({ ...state, region: event.target.value as CommunityState['region'] }))} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              {['EU', 'NA', 'SA', 'APAC', 'MENA', 'GLOBAL'].map((region) => <option key={region}>{region}</option>)}
            </select>
            <select value={form.platformFocus} onChange={(event) => setForm((state) => ({ ...state, platformFocus: event.target.value as CommunityState['platformFocus'] }))} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <option value="">Platform focus</option>
              <option value="PC">PC</option>
              <option value="PLAYSTATION">PlayStation</option>
              <option value="XBOX">Xbox</option>
            </select>
          </div>
          <input value={form.tags} onChange={(event) => setForm((state) => ({ ...state, tags: event.target.value }))} placeholder="Tags, comma separated" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3" />
          <input value={form.websiteUrl} onChange={(event) => setForm((state) => ({ ...state, websiteUrl: event.target.value }))} placeholder="Website" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3" />
          <input value={form.discordUrl} onChange={(event) => setForm((state) => ({ ...state, discordUrl: event.target.value }))} placeholder="Discord invite" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3" />
          <input value={form.redditUrl} onChange={(event) => setForm((state) => ({ ...state, redditUrl: event.target.value }))} placeholder="Reddit community" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" min={0} value={form.displayedMemberCount} onChange={(event) => setForm((state) => ({ ...state, displayedMemberCount: Number(event.target.value) || 0 }))} placeholder="Member count" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3" />
            <select value={form.memberCountSource} onChange={(event) => setForm((state) => ({ ...state, memberCountSource: event.target.value as CommunityState['memberCountSource'] }))} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <option value="manual">Manual</option>
              <option value="discord-sync">Discord sync (planned)</option>
              <option value="reddit-sync">Reddit sync (planned)</option>
            </select>
          </div>
          <textarea value={form.credibilityNotes} onChange={(event) => setForm((state) => ({ ...state, credibilityNotes: event.target.value }))} placeholder="Credibility markers (stewarded since 2024, partnered casters, etc.)" className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublic} onChange={(event) => setForm((state) => ({ ...state, isPublic: event.target.checked }))} /> Public profile</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(event) => setForm((state) => ({ ...state, featured: event.target.checked }))} /> Featured spotlight</label>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button disabled={saving} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-50">{saving ? 'Saving…' : 'Save community profile'}</button>
        <a href="/dashboard" className="rounded-full border border-white/20 px-5 py-2 text-sm">Cancel</a>
      </div>
      {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}
    </form>
  );
}
