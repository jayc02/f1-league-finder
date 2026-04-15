import { useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api/http';

interface Props {
  raceSlotId: string;
  isAuthenticated: boolean;
  initiallyRegistered: boolean;
  isClosed: boolean;
  isFull: boolean;
  status: string;
  registrationCutoffAt: string;
  entrants: number;
  maxPlayers: number;
}

const statusStyle: Record<string, string> = {
  SCHEDULED: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100',
  LOCKED: 'border-amber-300/30 bg-amber-500/10 text-amber-100',
  COMPLETED: 'border-sky-300/30 bg-sky-500/10 text-sky-100',
  CANCELLED: 'border-rose-300/30 bg-rose-500/10 text-rose-100',
};

export default function SlotActionPanel({
  raceSlotId,
  isAuthenticated,
  initiallyRegistered,
  isClosed,
  isFull,
  status,
  registrationCutoffAt,
  entrants,
  maxPlayers,
}: Props) {
  const [registered, setRegistered] = useState(initiallyRegistered);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  const fillPercent = useMemo(() => Math.min(100, Math.round((entrants / maxPlayers) * 100)), [entrants, maxPlayers]);

  const handle = async (mode: 'register' | 'unregister') => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    setPending(true);
    setMessage('');
    try {
      await apiRequest(`/api/race-slots/${raceSlotId}/${mode}`, { method: 'POST' });
      setRegistered(mode === 'register');
      setMessage(mode === 'register' ? 'Grid slot secured. You are race confirmed.' : 'Registration removed. Grid slot released.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setPending(false);
    }
  };

  const disabled = isClosed || (!registered && isFull);

  return (
    <div className="panel rounded-3xl p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-2xl text-white">Registration Control</h3>
        <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${statusStyle[status] ?? 'border-white/20 bg-white/10 text-white'}`}>
          {status}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>Grid filled</span>
          <span>{entrants}/{maxPlayers}</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-white to-slate-400" style={{ width: `${fillPercent}%` }} />
        </div>
        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">Cutoff · {new Date(registrationCutoffAt).toLocaleString()}</p>
      </div>

      <p className="mt-4 text-sm text-slate-300">Lock your place on the starting grid before registrations close.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={pending || disabled || registered}
          onClick={() => handle('register')}
          className="rounded-xl bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Processing…' : registered ? 'Registered' : 'Register'}
        </button>
        <button
          type="button"
          disabled={pending || !registered}
          onClick={() => handle('unregister')}
          className="rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-sm uppercase tracking-[0.14em] text-white transition hover:border-white/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Unregister
        </button>
      </div>

      {disabled && !registered && (
        <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Registration unavailable: this slot is either locked, full, or past cutoff.
        </div>
      )}

      {message && <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">{message}</p>}
    </div>
  );
}
