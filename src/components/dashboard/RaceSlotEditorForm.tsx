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

const statuses = ['DRAFT', 'OPEN', 'FULL', 'LOCKED', 'COMPLETED', 'CANCELLED'] as const;
const visibilities = ['PUBLIC', 'COMMUNITY_ONLY', 'UNLISTED', 'PRIVATE'] as const;

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
      track: data.track || undefined,
      stakeTierMetadata: data.stakeTierMetadata || undefined,
      eventNotes: data.eventNotes || undefined,
      cancellationReason: data.cancellationReason || undefined,
    };

    try {
      const endpoint = slotId ? `/api/race-slots/${slotId}` : '/api/race-slots';
      const method = slotId ? 'PATCH' : 'POST';
      await apiRequest(endpoint, { method, body: JSON.stringify(payload) });
      if (!slotId) {
        window.location.href = '/dashboard?notice=event-created';
        return;
      }
      setMessage('Event saved successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save event');
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel rounded-3xl p-4 sm:p-6 md:p-7">
      <div className="grid gap-4 md:grid-cols-2">
        <input name="title" defaultValue={String(defaults?.title ?? '')} placeholder="Event title" required className="min-h-11 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm" />
        <input name="track" defaultValue={String(defaults?.track ?? '')} placeholder="Track (e.g. Interlagos)" className="min-h-11 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm" />
        <select name="leagueId" defaultValue={String(defaults?.leagueId ?? leagues[0]?.id ?? '')} className="min-h-11 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm">
          {leagues.map((league) => <option key={league.id} value={league.id}>{league.name}</option>)}
        </select>
        <input name="scheduledAt" type="datetime-local" required defaultValue={String(defaults?.scheduledAt ?? '')} className="min-h-11 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm" />
        <input name="registrationCutoffAt" type="datetime-local" required defaultValue={String(defaults?.registrationCutoffAt ?? '')} className="min-h-11 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm" />
        <input name="maxPlayers" type="number" min={2} max={30} defaultValue={String(defaults?.maxPlayers ?? 20)} className="min-h-11 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm" />
        <select name="region" defaultValue={String(defaults?.region ?? 'GLOBAL')} className="min-h-11 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm">{['EU', 'NA', 'SA', 'APAC', 'MENA', 'GLOBAL'].map((region) => <option key={region}>{region}</option>)}</select>
        <select name="platform" defaultValue={String(defaults?.platform ?? '')} className="min-h-11 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm"><option value="">Platform</option>{['PC', 'PLAYSTATION', 'XBOX'].map((platform) => <option key={platform}>{platform}</option>)}</select>
        <select name="visibility" defaultValue={String(defaults?.visibility ?? (slotId ? 'PUBLIC' : 'COMMUNITY_ONLY'))} className="min-h-11 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm">{visibilities.map((visibility) => <option key={visibility}>{visibility}</option>)}</select>
        <select name="status" defaultValue={String(defaults?.status ?? 'DRAFT')} className="min-h-11 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm">{statuses.map((status) => <option key={status}>{status}</option>)}</select>
        <input name="stakeTierMetadata" defaultValue={String(defaults?.stakeTierMetadata ?? '')} placeholder="Tier metadata" className="min-h-11 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm md:col-span-2" />
      </div>
      <textarea name="formatDetails" defaultValue={String(defaults?.formatDetails ?? '')} placeholder="Race format details" required rows={3} className="mt-4 w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm" />
      <textarea name="rulesSummary" defaultValue={String(defaults?.rulesSummary ?? '')} placeholder="Rules summary" required rows={4} className="mt-4 w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm" />
      <textarea name="eventNotes" defaultValue={String(defaults?.eventNotes ?? '')} placeholder="Promotion notes, stream details, prize info" rows={3} className="mt-4 w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm" />
      <textarea name="cancellationReason" defaultValue={String(defaults?.cancellationReason ?? '')} placeholder="Cancellation reason (required if cancelled)" rows={2} className="mt-4 w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm" />
      <label className="mt-4 flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="crossplay" defaultChecked={Boolean(defaults?.crossplay)} /> Crossplay enabled</label>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button disabled={pending} className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{pending ? 'Saving...' : slotId ? 'Save changes' : 'Create event'}</button>
        {message && <p className="text-sm text-slate-200">{message}</p>}
      </div>
    </form>
  );
}
