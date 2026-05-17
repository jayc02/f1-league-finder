import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api/http';

type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
type Scope = 'open' | 'closed' | 'all';

interface DisputeSummary {
  id: string;
  reason: string;
  details: string | null;
  status: DisputeStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  openedBy: { id: string; username: string; email: string };
  resolvedBy?: { id: string; username: string } | null;
  raceSlot: {
    id: string;
    title: string;
    organiser: { id: string; username: string; email: string };
    organiserProfile?: { id: string; displayName: string } | null;
    league: { id: string; name: string };
  };
  _count: { moderationActions: number; emailLogs: number };
}

interface StatusLog {
  id: string;
  fromStatus: DisputeStatus | null;
  toStatus: DisputeStatus;
  note: string | null;
  createdAt: string;
  changedBy: { username: string };
}

interface EmailLog {
  id: string;
  subject: string;
  recipientEmail: string;
  createdAt: string;
  sentBy: { username: string };
  recipient: { username: string };
}

interface DisputeDetail extends DisputeSummary {
  adminNotes: string | null;
  resolutionNotes: string | null;
  statusLogs: StatusLog[];
  emailLogs: EmailLog[];
}

export default function AdminDisputeManager({ disputes = [] }: { disputes?: DisputeSummary[] }) {
  const [rows, setRows] = useState(disputes);
  const [loading, setLoading] = useState(disputes.length === 0);
  const [scope, setScope] = useState<Scope>('open');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DisputeDetail | null>(null);
  const [flash, setFlash] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (disputes.length > 0) return;
    let cancelled = false;
    const loadRows = async () => {
      setLoading(true);
      try {
        const response = await apiRequest<{ disputes: DisputeSummary[] }>('/api/admin/disputes?limit=50');
        if (!cancelled) setRows(response.disputes);
      } catch (error) {
        if (!cancelled) setFlash(error instanceof Error ? error.message : 'Unable to load admin rows.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadRows();
    return () => { cancelled = true; };
  }, [disputes.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((dispute) => {
      const isClosed = ['RESOLVED', 'REJECTED'].includes(dispute.status);
      const inScope = scope === 'all' || (scope === 'open' ? !isClosed : isClosed);
      if (!inScope) return false;
      if (!q) return true;
      return [dispute.id, dispute.reason, dispute.raceSlot.title, dispute.openedBy.username, dispute.raceSlot.organiser.username].join(' ').toLowerCase().includes(q);
    });
  }, [rows, scope, query]);

  const loadDetail = async (id: string) => {
    try {
      setBusy(true);
      const response = await apiRequest<{ dispute: DisputeDetail }>(`/api/admin/disputes/${id}`);
      setSelected(response.dispute);
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Unable to load dispute details.');
    } finally {
      setBusy(false);
    }
  };

  const updateDispute = async (id: string, patch: { status?: DisputeStatus; adminNotes?: string; resolutionNotes?: string }) => {
    try {
      setBusy(true);
      const response = await apiRequest<{ dispute: DisputeSummary & { adminNotes?: string | null; resolutionNotes?: string | null } }>(`/api/admin/disputes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });

      setRows((current) => current.map((item) => (item.id === id ? { ...item, ...response.dispute } : item)));
      if (selected?.id === id) await loadDetail(id);
      setFlash('Dispute updated.');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Unable to update dispute.');
    } finally {
      setBusy(false);
    }
  };

  const closeDispute = async (id: string) => {
    const resolutionNotes = window.prompt('Resolution summary (required):');
    if (!resolutionNotes?.trim()) return;
    const confirmed = window.confirm('Close dispute as RESOLVED?');
    if (!confirmed) return;

    await updateDispute(id, {
      status: 'RESOLVED',
      resolutionNotes: resolutionNotes.trim(),
    });
  };

  const sendEmail = async (id: string, recipientMode: 'REPORTER' | 'ORGANISER' | 'BOTH') => {
    const subject = window.prompt('Email subject:', `Dispute ${id} status update`);
    if (!subject?.trim()) return;
    const body = window.prompt('Email body:', 'We are reviewing your dispute. Please share any additional evidence by replying to this message.');
    if (!body?.trim()) return;

    try {
      setBusy(true);
      await apiRequest<{ ok: boolean }>(`/api/admin/disputes/${id}/email`, {
        method: 'POST',
        body: JSON.stringify({ recipientMode, subject: subject.trim(), body: body.trim() }),
      });
      if (selected?.id === id) await loadDetail(id);
      setFlash('Dispute email sent successfully.');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Unable to send email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_1fr]">
      <section className="panel rounded-3xl p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['open', 'closed', 'all'] as Scope[]).map((value) => (
              <button key={value} onClick={() => setScope(value)} className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition ${scope === value ? 'border-rose-300/45 bg-rose-500/20 text-rose-100' : 'border-white/15 bg-white/5 text-slate-300 hover:border-white/35 hover:text-white'}`}>
                {value}
              </button>
            ))}
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search disputes, event, user..." className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white outline-none transition focus:border-rose-300/60 lg:max-w-sm" />
        </div>

        {flash && <p className="mt-4 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">{flash}</p>}

        <div className="mt-4 grid gap-3">
          {filtered.map((dispute) => (
            <article key={dispute.id} className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">#{dispute.id.slice(-8)}</p>
                    <span className="rh-badge rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-100">{dispute.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-white">{dispute.reason}</p>
                  <p className="mt-1 text-xs text-slate-300">{dispute.raceSlot.title} · {dispute.raceSlot.league.name}</p>
                  <p className="mt-1 text-xs text-slate-400">Reporter: {dispute.openedBy.username} · Organiser: {dispute.raceSlot.organiserProfile?.displayName ?? dispute.raceSlot.organiser.username}</p>
                  <p className="mt-1 text-xs text-slate-500">Created {new Date(dispute.createdAt).toLocaleString()} · emails {dispute._count.emailLogs} · actions {dispute._count.moderationActions}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button disabled={busy} onClick={() => loadDetail(dispute.id)} className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10 disabled:opacity-45">View details</button>
                  {['OPEN', 'UNDER_REVIEW'].includes(dispute.status) && <button disabled={busy} onClick={() => closeDispute(dispute.id)} className="rounded-xl border border-emerald-300/35 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-45">Close dispute</button>}
                  <button disabled={busy} onClick={() => sendEmail(dispute.id, 'REPORTER')} className="rounded-xl border border-sky-300/35 bg-sky-500/15 px-3 py-2 text-xs text-sky-100 transition hover:bg-sky-500/25 disabled:opacity-45">Email reporter</button>
                  <button disabled={busy} onClick={() => sendEmail(dispute.id, 'BOTH')} className="rounded-xl border border-violet-300/35 bg-violet-500/15 px-3 py-2 text-xs text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-45">Email both sides</button>
                </div>
              </div>
            </article>
          ))}
          {!filtered.length && <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">No disputes found for this filter.</p>}
        </div>
      </section>

      <section className="panel rounded-3xl p-4 sm:p-6">
        <h2 className="font-display text-2xl text-white">Dispute Detail</h2>
        {!selected ? (
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">Select a dispute to review full detail, send email updates, inspect logs, and close with resolution notes.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Status</p>
              <p className="mt-1 font-semibold text-white">{selected.status}</p>
              <p className="mt-1 text-sm text-slate-300">{selected.reason}</p>
              <p className="mt-1 text-xs text-slate-400">{selected.details ?? 'No extra details provided.'}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button disabled={busy} onClick={() => updateDispute(selected.id, { status: 'UNDER_REVIEW' })} className="rounded-xl border border-amber-300/35 bg-amber-500/15 px-3 py-2 text-xs text-amber-100 transition hover:bg-amber-500/25 disabled:opacity-45">Set Under Review</button>
                <button disabled={busy} onClick={() => updateDispute(selected.id, { status: 'REJECTED', resolutionNotes: 'Rejected by moderation team after review.' })} className="rounded-xl border border-rose-300/35 bg-rose-500/15 px-3 py-2 text-xs text-rose-100 transition hover:bg-rose-500/25 disabled:opacity-45">Reject dispute</button>
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Status History</p>
              <div className="mt-2 space-y-2">
                {selected.statusLogs.length ? selected.statusLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-200">
                    <p>{log.fromStatus ?? '—'} → {log.toStatus}</p>
                    <p className="mt-1 text-slate-400">{new Date(log.createdAt).toLocaleString()} · {log.changedBy.username}</p>
                    {log.note && <p className="mt-1 text-slate-300">{log.note}</p>}
                  </div>
                )) : <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">No status transitions logged yet.</p>}
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Email Log</p>
              <div className="mt-2 space-y-2">
                {selected.emailLogs.length ? selected.emailLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-200">
                    <p>{log.subject}</p>
                    <p className="mt-1 text-slate-400">{log.recipient.username} ({log.recipientEmail}) · sent by {log.sentBy.username}</p>
                    <p className="mt-1 text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                )) : <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">No dispute emails have been sent yet.</p>}
              </div>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}
