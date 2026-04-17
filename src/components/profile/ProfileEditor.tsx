import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { apiRequest } from '@/lib/api/http';

interface Props {
  initialUser: {
    username: string;
    bio: string;
    region: 'EU' | 'NA' | 'SA' | 'APAC' | 'MENA' | 'GLOBAL';
    preferredPlatform: 'PC' | 'PLAYSTATION' | 'XBOX' | '';
    avatarUrl: string;
  };
}

const avatarPresets = [
  'https://api.dicebear.com/9.x/shapes/svg?seed=GRID-1',
  'https://api.dicebear.com/9.x/shapes/svg?seed=GRID-2',
  'https://api.dicebear.com/9.x/shapes/svg?seed=GRID-3',
  'https://api.dicebear.com/9.x/shapes/svg?seed=GRID-4',
];

export default function ProfileEditor({ initialUser }: Props) {
  const [form, setForm] = useState(initialUser);
  const [status, setStatus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string>('');

  const preview = useMemo(() => localPreview || form.avatarUrl || avatarPresets[0], [localPreview, form.avatarUrl]);

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setStatus('Image too large. Use an image under 2MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setStatus('Please choose a valid image file.');
      return;
    }

    setAvatarFile(file);
    setLocalPreview(URL.createObjectURL(file));
    setStatus('Avatar selected. Save profile to upload.');
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus('');

    try {
      const payload = new FormData();
      payload.append('username', form.username);
      payload.append('bio', form.bio || '');
      payload.append('region', form.region);
      payload.append('preferredPlatform', form.preferredPlatform || '');
      payload.append('avatarUrl', form.avatarUrl || '');
      if (avatarFile) payload.append('avatar', avatarFile);

      await apiRequest<{ user: unknown }>('/api/profile', {
        method: 'PATCH',
        body: payload,
      });

      setStatus('Profile updated successfully.');
      window.setTimeout(() => {
        window.location.href = '/profile';
      }, 600);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="panel rounded-3xl p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-64">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Identity</p>
          <img src={preview} alt="Profile preview" className="mt-3 h-24 w-24 rounded-2xl border border-white/20 bg-black/30 object-cover" />
          <label className="mt-4 block text-xs text-slate-400">Upload avatar</label>
          <input type="file" accept="image/*" onChange={onFile} className="mt-2 w-full text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1 file:text-black" />
          <p className="mt-4 text-xs text-slate-400">Or select a preset:</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {avatarPresets.map((avatar) => (
              <button
                key={avatar}
                type="button"
                onClick={() => {
                  setAvatarFile(null);
                  setLocalPreview('');
                  setForm((current) => ({ ...current, avatarUrl: avatar }));
                }}
                className="rounded-xl border border-white/10 bg-white/5 p-1 transition hover:border-white/40"
              >
                <img src={avatar} alt="Avatar preset" className="h-10 w-10 rounded-lg" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <label htmlFor="username" className="text-xs uppercase tracking-[0.2em] text-slate-400">Display name</label>
            <input id="username" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" required />
          </div>
          <div>
            <label htmlFor="bio" className="text-xs uppercase tracking-[0.2em] text-slate-400">Bio</label>
            <textarea id="bio" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none" placeholder="Competitive focus, race craft style, and preferred leagues." />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="region" className="text-xs uppercase tracking-[0.2em] text-slate-400">Region</label>
              <select id="region" value={form.region} onChange={(event) => setForm((current) => ({ ...current, region: event.target.value as Props['initialUser']['region'] }))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none">
                {['EU', 'NA', 'SA', 'APAC', 'MENA', 'GLOBAL'].map((region) => <option key={region} value={region}>{region}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="platform" className="text-xs uppercase tracking-[0.2em] text-slate-400">Preferred platform</label>
              <select id="platform" value={form.preferredPlatform} onChange={(event) => setForm((current) => ({ ...current, preferredPlatform: event.target.value as Props['initialUser']['preferredPlatform'] }))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none">
                <option value="">Not set</option>
                <option value="PC">PC</option>
                <option value="PLAYSTATION">PlayStation</option>
                <option value="XBOX">Xbox</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button disabled={isSaving} type="submit" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-slate-100 disabled:opacity-50">
              {isSaving ? 'Saving…' : 'Save profile'}
            </button>
            <a href="/profile" className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/90">Cancel</a>
          </div>
          {status && <p className="text-sm text-slate-300">{status}</p>}
        </div>
      </div>
    </form>
  );
}
