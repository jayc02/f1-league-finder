import { useState } from 'react';
import { apiRequest } from '@/lib/api/http';

interface Props {
  raceSlotId: string;
  raceResultId?: string;
  canSubmit: boolean;
}

export default function DisputeForm({ raceSlotId, raceResultId, canSubmit }: Props) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('');
    setPending(true);
    try {
      await apiRequest('/api/disputes', {
        method: 'POST',
        body: JSON.stringify({ raceSlotId, raceResultId, reason, details }),
      });
      setReason('');
      setDetails('');
      setStatus('Dispute submitted to stewards.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to submit dispute.');
    } finally {
      setPending(false);
    }
  };

  if (!canSubmit) return null;

  return (
    <form onSubmit={submit} className="panel mt-6 rounded-2xl p-5">
      <h3 className="font-display text-xl text-white">Open a dispute</h3>
      <div className="mt-4 space-y-3">
        <input
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason"
          className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-white"
        />
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Describe incident, lap and evidence context"
          rows={4}
          className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-white"
        />
      </div>
      <button disabled={pending} className="mt-3 rounded-xl bg-white px-4 py-2 text-black disabled:opacity-60">
        {pending ? 'Submitting...' : 'Submit dispute'}
      </button>
      {status && <p className="mt-2 text-sm text-slate-200">{status}</p>}
    </form>
  );
}
