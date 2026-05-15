import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
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
  memberCountSource: 'manual' | 'discord-sync' | 'reddit-sync' | 'racehub';
  isPublic: boolean;
  featured: boolean;
  credibilityNotes: string;
}

interface Props {
  initialState: CommunityState;
  mode?: 'create' | 'edit';
  canManagePlatformBadges?: boolean;
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

const inputClass = 'mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-redline/60 focus:ring-2 focus:ring-redline/25';
const selectClass = `${inputClass} min-h-12`;
const helperClass = 'mt-1 text-xs leading-5 text-slate-400';
const labelClass = 'text-xs font-semibold uppercase tracking-[0.18em] text-slate-300';
const slugPattern = /^[a-z0-9-]+$/;
const hexPattern = /^#[a-fA-F0-9]{6}$/;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

const isOptionalUrl = (value: string) => !value.trim() || /^https?:\/\//i.test(value.trim());
const isDiscordInvite = (value: string) => !value.trim() || /^https:\/\/(discord\.gg|discord\.com\/invite)\/[a-z0-9-]+/i.test(value.trim());
const isRedditUrl = (value: string) => !value.trim() || /^https:\/\/(www\.)?reddit\.com\/r\/[a-z0-9_]+\/?/i.test(value.trim());

function Field({ label, helper, children }: { label: string; helper: string; children: ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <p className={helperClass}>{helper}</p>
      {children}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="font-display text-xl text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function CommunityEditorForm({ initialState, mode = 'create', canManagePlatformBadges = false }: Props) {
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [slugEdited, setSlugEdited] = useState(mode === 'edit' && Boolean(initialState.slug));
  const [savedCommunity, setSavedCommunity] = useState<SaveCommunityResponse['community'] | null>(null);

  const computedSlug = useMemo(() => slugify(form.slug || form.displayName), [form.slug, form.displayName]);
  const effectiveLogo = logoPreview || form.logoUrl;
  const effectiveBanner = bannerPreview || form.bannerUrl;
  const safeBrandingColor = hexPattern.test(form.brandingColor) ? form.brandingColor : '#E10600';

  useEffect(() => () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
  }, [logoPreview, bannerPreview]);

  const updateDisplayName = (value: string) => {
    setForm((state) => ({ ...state, displayName: value, slug: slugEdited ? state.slug : slugify(value) }));
  };

  const validateForm = () => {
    if (!form.displayName.trim()) return 'Community name is required.';
    if (form.displayName.trim().length < 3) return 'Community name must be at least 3 characters.';
    if (!computedSlug) return 'Community URL is required.';
    if (!slugPattern.test(computedSlug)) return 'Community URL can only use lowercase letters, numbers, and hyphens.';
    if (form.brandingColor && !hexPattern.test(form.brandingColor)) return 'Brand accent colour must be a 6-digit hex colour, for example #E10600.';
    if (!isOptionalUrl(form.websiteUrl)) return 'Website must be a valid URL starting with http:// or https://.';
    if (!isDiscordInvite(form.discordUrl)) return 'Discord link must be a valid Discord invite URL.';
    if (!isRedditUrl(form.redditUrl)) return 'Reddit community must be a valid subreddit URL.';
    if (form.displayedMemberCount < 0) return 'Displayed member count cannot be negative.';
    return '';
  };

  const handleAssetFile = (event: ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setMessage(type === 'logo' ? 'Logo must be PNG, JPG, or WebP and under 2MB.' : 'Banner must be PNG, JPG, or WebP and under 5MB.');
      return;
    }

    const max = type === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > max) {
      setMessage(type === 'logo' ? 'Logo must be PNG, JPG, or WebP and under 2MB.' : 'Banner must be PNG, JPG, or WebP and under 5MB.');
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
    const validationMessage = validateForm();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const payload = new FormData();
      payload.append('displayName', form.displayName.trim());
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
      if (canManagePlatformBadges) payload.append('featured', String(form.featured));
      payload.append('credibilityNotes', form.credibilityNotes || '');
      if (logoFile) payload.append('logo', logoFile);
      if (bannerFile) payload.append('banner', bannerFile);

      const response = await apiRequest<SaveCommunityResponse>('/api/organiser/community', {
        method: 'PATCH',
        body: payload,
      });
      window.sessionStorage.removeItem('racehub.navUser.v1');
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
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Set up your organiser community</p>
          <h2 className="mt-2 font-display text-2xl text-white">{mode === 'edit' ? 'Edit community profile' : 'Create community profile'}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Shape how drivers discover, trust, and join your RaceHub community.</p>
        </div>
        {mode === 'edit' && form.isPublic && computedSlug && (
          <a href={`/communities/${computedSlug}`} className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.16em] text-slate-200 transition hover:border-white/40 hover:bg-white/10">
            View public page
          </a>
        )}
      </div>

      <div className="space-y-5">
        <Section title="Basic details" description="Name the community, set its public link, and tell drivers what to expect.">
          <Field label="Community name" helper="This is the name players will see on RaceHub.">
            <input value={form.displayName} onChange={(event) => updateDisplayName(event.target.value)} placeholder="e.g. Super Racing" className={inputClass} required />
          </Field>
          <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" open={mode === 'edit'}>
            <summary className="cursor-pointer text-sm font-semibold text-white">Advanced: Community URL</summary>
            <div className="mt-4">
              <Field label="Community URL" helper="This becomes your public page link: racehub.gg/communities/super-racing. Use lowercase letters, numbers, and hyphens only.">
                <input value={computedSlug} onChange={(event) => { setSlugEdited(true); setForm((state) => ({ ...state, slug: slugify(event.target.value) })); }} placeholder="super-racing" pattern="[a-z0-9-]+" className={inputClass} required />
              </Field>
              <p className="mt-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-300">Preview: <span className="text-white">/communities/{computedSlug || 'your-community'}</span></p>
            </div>
          </details>
          <Field label="Short description" helper="A one-line summary shown on community cards.">
            <input value={form.shortDescription} onChange={(event) => setForm((state) => ({ ...state, shortDescription: event.target.value }))} placeholder="e.g. Weekly F1 and GT3 races for clean drivers" className={inputClass} />
          </Field>
          <Field label="About your community" helper="Tell drivers what your community runs, who it is for, and what makes it worth joining.">
            <textarea value={form.description} onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))} placeholder="Describe your racing format, standards, schedule, and community vibe." className={`${inputClass} min-h-32`} />
          </Field>
        </Section>

        <Section title="Branding" description="Add the imagery and accent colour drivers will associate with your events.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className={labelClass}>Community banner</p>
              <p className={helperClass}>Wide image shown at the top of your public community page.</p>
              {effectiveBanner && <img src={effectiveBanner} alt="Banner preview" className="mt-3 h-28 w-full rounded-xl border border-white/10 object-cover" />}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" onChange={(event) => handleAssetFile(event, 'banner')} className="mt-3 w-full text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1 file:text-black" />
              <p className="mt-2 text-xs text-slate-400">PNG, JPG, WebP, AVIF, or GIF, up to 5MB.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className={labelClass}>Community logo</p>
              <p className={helperClass}>Square icon shown on community cards and race listings.</p>
              {effectiveLogo && <img src={effectiveLogo} alt="Logo preview" className="mt-3 h-20 w-20 rounded-xl border border-white/10 object-cover" />}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" onChange={(event) => handleAssetFile(event, 'logo')} className="mt-3 w-full text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1 file:text-black" />
              <p className="mt-2 text-xs text-slate-400">PNG, JPG, WebP, AVIF, or GIF, up to 2MB.</p>
            </div>
          </div>
          <Field label="Brand accent colour" helper="Used for highlights, badges, and community styling.">
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input type="color" value={safeBrandingColor} onChange={(event) => setForm((state) => ({ ...state, brandingColor: event.target.value.toUpperCase() }))} className="h-12 w-20 rounded-xl border border-white/15 bg-black/40 p-1" aria-label="Brand accent colour picker" />
              <input value={form.brandingColor} onChange={(event) => setForm((state) => ({ ...state, brandingColor: event.target.value.toUpperCase() }))} placeholder="#E10600" className={`${inputClass} mt-0 sm:max-w-xs`} />
              <span className="h-10 w-10 rounded-full border border-white/20" style={{ backgroundColor: safeBrandingColor }} aria-hidden="true" />
            </div>
          </Field>
        </Section>

        <Section title="Discovery" description="Help drivers find communities that match their region, platform, and racing style.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Region" helper="Where most of your events are based. Use GLOBAL if you support multiple regions.">
              <select value={form.region} onChange={(event) => setForm((state) => ({ ...state, region: event.target.value as CommunityState['region'] }))} className={selectClass}>
                {['EU', 'NA', 'SA', 'APAC', 'MENA', 'GLOBAL'].map((region) => <option key={region} value={region}>{region}</option>)}
              </select>
            </Field>
            <Field label="Platform focus" helper="Choose the main platform, or Cross-platform if your events support multiple platforms.">
              <select value={form.platformFocus} onChange={(event) => setForm((state) => ({ ...state, platformFocus: event.target.value as CommunityState['platformFocus'] }))} className={selectClass}>
                <option value="">Cross-platform / not platform-specific</option>
                <option value="PC">PC</option>
                <option value="PLAYSTATION">PlayStation</option>
                <option value="XBOX">Xbox</option>
              </select>
            </Field>
            <Field label="Main game / racing focus" helper="The game or racing category your community mainly runs.">
              <input value={form.gameFocus} onChange={(event) => setForm((state) => ({ ...state, gameFocus: event.target.value }))} placeholder="e.g. F1, GT7, Assetto Corsa, iRacing, GT3" className={inputClass} />
            </Field>
          </div>
          <Field label="Tags" helper="Add searchable tags separated by commas.">
            <input value={form.tags} onChange={(event) => setForm((state) => ({ ...state, tags: event.target.value }))} placeholder="clean racing, weekly races, GT3, beginners welcome" className={inputClass} />
          </Field>
        </Section>

        <Section title="Links" description="Connect drivers to your official pages and social spaces.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Website" helper="Optional official website or organiser page.">
              <input value={form.websiteUrl} onChange={(event) => setForm((state) => ({ ...state, websiteUrl: event.target.value }))} placeholder="https://yourcommunity.gg" className={inputClass} />
            </Field>
            <Field label="Discord invite link" helper="Used for the Join Discord button and optional member count syncing.">
              <input value={form.discordUrl} onChange={(event) => setForm((state) => ({ ...state, discordUrl: event.target.value }))} placeholder="https://discord.gg/yourinvite" className={inputClass} />
            </Field>
            <Field label="Reddit community" helper="Optional subreddit link used for the Join Reddit button and member count syncing.">
              <input value={form.redditUrl} onChange={(event) => setForm((state) => ({ ...state, redditUrl: event.target.value }))} placeholder="https://reddit.com/r/yourcommunity" className={inputClass} />
            </Field>
          </div>
        </Section>

        <Section title="Member counts" description="Control the public member count shown while automated sync options are being connected.">
          <p className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">Manual count is used until Discord/Reddit syncing is available.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Displayed member count" helper="Fallback member count shown if Discord/Reddit/RaceHub count is not available.">
              <input type="number" min={0} value={form.displayedMemberCount} onChange={(event) => setForm((state) => ({ ...state, displayedMemberCount: Number(event.target.value) || 0 }))} placeholder="0" className={inputClass} />
            </Field>
            <Field label="Member count source" helper="Choose where the public member count should come from.">
              <select value={form.memberCountSource} onChange={(event) => setForm((state) => ({ ...state, memberCountSource: event.target.value as CommunityState['memberCountSource'] }))} className={selectClass}>
                <option value="manual">Manual count</option>
                <option value="racehub">RaceHub members</option>
                <option value="discord-sync">Discord members</option>
                <option value="reddit-sync">Reddit subscribers</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Trust and visibility" description="Share credibility signals and choose whether the community appears publicly.">
          <Field label="Credibility notes" helper="Optional trust signals shown to players, such as stewarded events, partnered casters, verified leagues, or clean racing rules.">
            <textarea value={form.credibilityNotes} onChange={(event) => setForm((state) => ({ ...state, credibilityNotes: event.target.value }))} placeholder="e.g. Stewarded since 2024, weekly broadcasts, partnered commentators" className={`${inputClass} min-h-24`} />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
              <span className="flex items-center gap-2 font-semibold text-white"><input type="checkbox" checked={form.isPublic} onChange={(event) => setForm((state) => ({ ...state, isPublic: event.target.checked }))} /> Public profile</span>
              <span className="mt-2 block text-xs leading-5 text-slate-400">Show this community on the public communities page.</span>
            </label>
            {canManagePlatformBadges && (
              <label className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-50">
                <span className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={form.featured} onChange={(event) => setForm((state) => ({ ...state, featured: event.target.checked }))} /> Featured spotlight</span>
                <span className="mt-2 block text-xs leading-5 text-amber-100/80">Only platform admins should normally control this. Featured communities appear more prominently.</span>
              </label>
            )}
          </div>
        </Section>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button disabled={saving} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-50">{saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create community'}</button>
        <a href="/dashboard" className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-100 transition hover:bg-white/10">Cancel</a>
      </div>
      {message && <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">{message}</p>}
      {savedCommunity && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a href={savedCommunity.manageUrl} className="rounded-full border border-white/20 px-4 py-2 text-slate-100">Manage community</a>
          {savedCommunity.publicUrl && <a href={savedCommunity.publicUrl} className="rounded-full border border-white/20 px-4 py-2 text-slate-100">View public page</a>}
        </div>
      )}
    </form>
  );
}
