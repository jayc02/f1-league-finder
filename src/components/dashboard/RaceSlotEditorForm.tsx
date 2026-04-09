import { useState } from 'react';
import { apiRequest } from '@/lib/api/http';

interface LeagueOption {
  id: string;
  name: string;
}

interface Props {
  leagues: LeagueOption[];
  slotId?: string;
  defaults?: Record<string, string | number | boolean | null | undefined>;
}

export default function RaceSlotEditorForm({ leagues, slotId, defaults }: Props) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage('');
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    const payload = {
      ...data,
      crossplay: data.crossplay === 'on',
      maxPlayers: Number(data.maxPlayers),
      scheduledAt: new Date(String(data.scheduledAt)).toISOString(),
      registrationCutoffAt: new Date(String(data.registrationCutoffAt)).toISOString(),
      platform: data.platform || undefined,
      region: data.region || undefined,
      stakeTierMetadata: data.stakeTierMetadata || undefined,
    };

    try {
      const endpoint = slotId ? `/api/race-slots/${slotId}` : '/api/race-slots';
      const method = slotId ? 'PATCH' : 'POST';
      await apiRequest(endpoint, { method, body: JSON.stringify(payload) });
      setMessage('Race slot saved successfully.');
      if (!slotId) window.location.href = '/dashboard';
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save race slot');
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel rounded-3xl p-7">
      <div className="grid gap-4 md:grid-cols-2">
        <input name="title" defaultValue={String(defaults?.title ?? '')} placeholder="Slot title" required className="rounded-xl border border-white/20 bg-black/40 px-4 py-3" />
        <select name="leagueId" defaultValue={String(defaults?.leagueId ?? leagues[0]?.id ?? '')} className="rounded-xl border border-white/20 bg-black/40 px-4 py-3">
          {leagues.map((league) => <option key={league.id} value={league.id}>{league.name}</option>)}
        </select>
        <input name="scheduledAt" type="datetime-local" required defaultValue={String(defaults?.scheduledAt ?? '')} className="rounded-xl border border-white/20 bg-black/40 px-4 py-3" />
        <input name="registrationCutoffAt" type="datetime-local" required defaultValue={String(defaults?.registrationCutoffAt ?? '')} className="rounded-xl border border-white/20 bg-black/40 px-4 py-3" />
        <input name="maxPlayers" type="number" min={2} max={30} defaultValue={String(defaults?.maxPlayers ?? 20)} className="rounded-xl border border-white/20 bg-black/40 px-4 py-3" />
        <select name="region" defaultValue={String(defaults?.region ?? 'GLOBAL')} className="rounded-xl border border-white/20 bg-black/40 px-4 py-3">{['EU', 'NA', 'SA', 'APAC', 'MENA', 'GLOBAL'].map((region) => <option key={region}>{region}</option>)}</select>
        <select name="platform" defaultValue={String(defaults?.platform ?? '')} className="rounded-xl border border-white/20 bg-black/40 px-4 py-3"><option value="">Platform</option>{['PC', 'PLAYSTATION', 'XBOX'].map((platform) => <option key={platform}>{platform}</option>)}</select>
        <input name="stakeTierMetadata" defaultValue={String(defaults?.stakeTierMetadata ?? '')} placeholder="Tier metadata" className="rounded-xl border border-white/20 bg-black/40 px-4 py-3" />
      </div>
      <textarea name="formatDetails" defaultValue={String(defaults?.formatDetails ?? '')} placeholder="Race format details" required rows={3} className="mt-4 w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3" />
      <textarea name="rulesSummary" defaultValue={String(defaults?.rulesSummary ?? '')} placeholder="Rules summary" required rows={4} className="mt-4 w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3" />
      <label className="mt-4 flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="crossplay" defaultChecked={Boolean(defaults?.crossplay)} /> Crossplay enabled</label>
      <button disabled={pending} className="mt-5 rounded-xl bg-white px-5 py-3 font-semibold text-black disabled:opacity-50">{pending ? 'Saving...' : slotId ? 'Save changes' : 'Create race slot'}</button>
      {message && <p className="mt-3 text-sm text-slate-200">{message}</p>}
    </form>
  );
}
