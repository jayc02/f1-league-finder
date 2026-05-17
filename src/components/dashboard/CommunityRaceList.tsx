import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api/http';

interface RaceRow {
  id: string;
  title: string;
  visibility: string;
  status: string;
  scheduledAt: string;
  maxPlayers: number;
  league: { name: string };
  _count: { registrations: number };
}

export default function CommunityRaceList({ organiserProfileId, canManageRaces }: { organiserProfileId: string; canManageRaces: boolean }) {
  const [races, setRaces] = useState<RaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ organiserProfileId, take: '25' });
        const response = await apiRequest<{ raceSlots: RaceRow[] }>(`/api/organiser/community/races?${params.toString()}`);
        if (!cancelled) setRaces(response.raceSlots);
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Unable to load community races.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [organiserProfileId]);

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />)}</div>;
  if (message) return <p className="rounded-2xl border border-rose-300/25 bg-rose-500/10 p-4 text-sm text-rose-100">{message}</p>;

  return (
    <div className="space-y-3">
      {races.length ? races.map((slot) => (
        <div key={slot.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{slot.league.name} · {slot.visibility} · {slot.status}</p>
              <h3 className="mt-1 font-semibold text-white">{slot.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{new Date(slot.scheduledAt).toLocaleString()} · {slot._count.registrations}/{slot.maxPlayers} entrants</p>
            </div>
            {canManageRaces && <a href={`/dashboard/community/races/${slot.id}/edit`} className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.16em] text-slate-200">Edit</a>}
          </div>
        </div>
      )) : <p className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-slate-300">No races created yet.</p>}
    </div>
  );
}
