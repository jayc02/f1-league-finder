import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
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
  mode?: 'create' | 'edit';
}

interface SaveCommunityResponse {
  community: {
    id: string;
    slug: string;
    displayName: string;
    publicUrl?: string;
    manageUrl: string;
  };
}

export default function CommunityEditorForm({ initialState, mode = 'create' }: Props) {
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [savedCommunity, setSavedCommunity] = useState<SaveCommunityResponse['community'] | null>(null);

  const computedSlug = useMemo(() => form.slug || form.displayName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), [form.slug, form.displayName]);
  const effectiveLogo = logoPreview || form.logoUrl;
  const effectiveBanner = bannerPreview || form.bannerUrl;

  useEffect(() => () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
  }, [logoPreview, bannerPreview]);

  const handleAssetFile = (event: ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Please choose a valid image file.');
      return;
    }

    const max = type === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > max) {
      setMessage(type === 'logo' ? 'Logo must be under 2MB.' : 'Banner must be under 5MB.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(objectUrl);
    } else {
      setBannerFile(file);
      setBannerPreview(objectUrl);
    }
    setMessage(`${type === 'logo' ? 'Logo' : 'Banner'} selected. Save to upload.`);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const payload = new FormData();
      payload.append('displayName', form.displayName);
      payload.append('slug', computedSlug);
      payload.append('shortDescription', form.shortDescription || '');
      payload.append('description', form.description || '');
      payload.append('brandingColor', form.brandingColor || '');
      payload.append('logoUrl', form.logoUrl || '');
      payload.append('bannerUrl', form.bannerUrl || '');
      payload.append('websiteUrl', form.websiteUrl || '');
      payload.append('discordUrl', form.discordUrl || '');
      payload.append('redditUrl', form.redditUrl || '');
      payload.append('gameFocus', form.gameFocus || '');
      payload.append('platformFocus', form.platformFocus || '');
      payload.append('region', form.region);
      payload.append('tags', form.tags);
      payload.append('displayedMemberCount', String(form.displayedMemberCount || 0));
      payload.append('memberCountSource', form.memberCountSource);
      payload.append('isPublic', String(form.isPublic));
      payload.append('featured', String(form.featured));
      payload.append('credibilityNotes', form.credibilityNotes || '');
      if (logoFile) payload.append('logo', logoFile);
      if (bannerFile) payload.append('banner', bannerFile);

      const response = await apiRequest<SaveCommunityResponse>('/api/organiser/community', {
        method: 'PATCH',
        body: payload,
      });
      setSavedCommunity(response.community);
      setForm((state) => ({ ...state, slug: response.community.slug }));
      setMessage(mode === 'edit' ? 'Community profile updated.' : 'Community profile created.');
      window.setTimeout(() => {
        window.location.href = response.community.manageUrl;
      }, 1000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update community.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="panel rounded-3xl p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{mode === 'edit' ? 'Existing OrganiserProfile' : 'New OrganiserProfile'}</p>
          <h2 className="mt-2 font-display text-2xl text-white">{mode === 'edit' ? 'Edit Community' : 'Create Community'}</h2>
        </div>
        {mode === 'edit' && form.isPublic && computedSlug && (
          <a href={`/communities/${computedSlug}`} className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.16em] text-slate-200 transition hover:border-white/40 hover:bg-white/10">
            View public page
          </a>
        )}
      </div>
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Community banner</p>
              {effectiveBanner && <img src={effectiveBanner} alt="Banner preview" className="mt-2 h-24 w-full rounded-xl border border-white/10 object-cover" />}
              <input type="file" accept="image/*" onChange={(event) => handleAssetFile(event, 'banner')} className="mt-3 w-full text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1 file:text-black" />
              <p className="mt-2 text-xs text-slate-400">PNG/JPG/WebP/AVIF/GIF, up to 5MB.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Community logo</p>
              {effectiveLogo && <img src={effectiveLogo} alt="Logo preview" className="mt-2 h-20 w-20 rounded-xl border border-white/10 object-cover" />}
              <input type="file" accept="image/*" onChange={(event) => handleAssetFile(event, 'logo')} className="mt-3 w-full text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1 file:text-black" />
              <p className="mt-2 text-xs text-slate-400">PNG/JPG/WebP/AVIF/GIF, up to 2MB.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
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
                          </select>
          </div>
          <textarea value={form.credibilityNotes} onChange={(event) => setForm((state) => ({ ...state, credibilityNotes: event.target.value }))} placeholder="Credibility markers (stewarded since 2024, partnered casters, etc.)" className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublic} onChange={(event) => setForm((state) => ({ ...state, isPublic: event.target.checked }))} /> Public profile</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(event) => setForm((state) => ({ ...state, featured: event.target.checked }))} /> Featured spotlight</label>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button disabled={saving} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-50">{saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Community'}</button>
        <a href="/dashboard" className="rounded-full border border-white/20 px-5 py-2 text-sm">Cancel</a>
      </div>
      {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}
      {savedCommunity && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a href={savedCommunity.manageUrl} className="rounded-full border border-white/20 px-4 py-2 text-slate-100">Manage community</a>
          {savedCommunity.publicUrl && <a href={savedCommunity.publicUrl} className="rounded-full border border-white/20 px-4 py-2 text-slate-100">View public page</a>}
        </div>
      )}
    </form>
  );
}
