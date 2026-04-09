import { useState } from 'react';
import { apiRequest } from '@/lib/api/http';

interface Props {
  raceSlotId: string;
  isAuthenticated: boolean;
  initiallyRegistered: boolean;
  isClosed: boolean;
  isFull: boolean;
}

export default function SlotActionPanel({ raceSlotId, isAuthenticated, initiallyRegistered, isClosed, isFull }: Props) {
  const [registered, setRegistered] = useState(initiallyRegistered);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

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
      setMessage(mode === 'register' ? 'You are confirmed for this slot.' : 'You have been removed from this slot.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setPending(false);
    }
  };

  const disabled = isClosed || (!registered && isFull);

  return (
    <div className="panel rounded-2xl p-5">
      <h3 className="font-display text-xl text-white">Registration</h3>
      <p className="mt-2 text-sm text-slate-300">Lock your grid slot before the registration cutoff.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending || disabled || registered}
          onClick={() => handle('register')}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Working...' : registered ? 'Registered' : 'Register'}
        </button>
        <button
          type="button"
          disabled={pending || !registered}
          onClick={() => handle('unregister')}
          className="rounded-xl border border-white/25 bg-white/5 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Unregister
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-slate-200">{message}</p>}
      {disabled && !registered && <p className="mt-2 text-sm text-amber-200">This slot is currently unavailable for registration.</p>}
    </div>
  );
}
