import { useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api/http';

type EventStatus = 'DRAFT' | 'OPEN' | 'FULL' | 'LOCKED' | 'COMPLETED' | 'CANCELLED';
type EventVisibility = 'PUBLIC' | 'COMMUNITY_ONLY' | 'UNLISTED' | 'PRIVATE';

interface EventItem {
  id: string;
  title: string;
  scheduledAt: string;
  track: string | null;
  status: EventStatus;
  visibility: EventVisibility;
  maxPlayers: number;
  registrations: number;
  communityName: string;
}

interface Props {
  events: EventItem[];
}

const badgeTone: Record<EventStatus, string> = {
  DRAFT: 'border-slate-400/25 bg-slate-500/10 text-slate-100',
  OPEN: 'border-emerald-300/35 bg-emerald-500/12 text-emerald-100',
  FULL: 'border-fuchsia-300/35 bg-fuchsia-500/12 text-fuchsia-100',
  LOCKED: 'border-amber-300/35 bg-amber-500/12 text-amber-100',
  COMPLETED: 'border-sky-300/35 bg-sky-500/12 text-sky-100',
  CANCELLED: 'border-rose-300/35 bg-rose-500/12 text-rose-100',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function OrganiserEventManager({ events }: Props) {
  const [items, setItems] = useState(events);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState('');

  const grouped = useMemo(() => {
    const now = Date.now();
    return {
      drafts: items.filter((event) => event.status === 'DRAFT'),
      publishedUpcoming: items.filter((event) => ['OPEN', 'FULL', 'LOCKED'].includes(event.status) && new Date(event.scheduledAt).getTime() >= now),
      completed: items.filter((event) => event.status === 'COMPLETED'),
      cancelled: items.filter((event) => event.status === 'CANCELLED'),
    };
  }, [items]);

  const applyUpdate = async (id: string, data: Record<string, unknown>, message: string) => {
    setBusyId(id);
    setFlash('');
    try {
      const response = await apiRequest<{ raceSlot: EventItem & { _count?: { registrations: number } } }>(`/api/race-slots/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                ...response.raceSlot,
                registrations: response.raceSlot._count?.registrations ?? item.registrations,
              }
            : item,
        ),
      );
      setFlash(message);
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Unable to update event status.');
    } finally {
      setBusyId(null);
    }
  };

  const publish = (id: string) => applyUpdate(id, { status: 'OPEN', visibility: 'PUBLIC' }, 'Event published to public discovery.');
  const unpublish = (id: string) => applyUpdate(id, { status: 'DRAFT', visibility: 'PRIVATE' }, 'Event moved back to draft and hidden publicly.');
  const complete = (id: string) => applyUpdate(id, { status: 'COMPLETED', visibility: 'PUBLIC' }, 'Event marked as completed.');

  const cancel = async (id: string) => {
    const reason = window.prompt('Why are you cancelling this event?');
    if (!reason?.trim()) return;
    await applyUpdate(id, { status: 'CANCELLED', cancellationReason: reason.trim() }, 'Event cancelled with organiser note.');
  };

  const sections: Array<{ key: string; title: string; subtitle: string; data: EventItem[] }> = [
    { key: 'drafts', title: 'Draft Events', subtitle: 'Not publicly visible yet.', data: grouped.drafts },
    { key: 'published', title: 'Published & Upcoming', subtitle: 'Visible across communities and race slots.', data: grouped.publishedUpcoming },
    { key: 'completed', title: 'Completed', subtitle: 'Closed events in your archive.', data: grouped.completed },
    { key: 'cancelled', title: 'Cancelled', subtitle: 'Publicly marked as cancelled.', data: grouped.cancelled },
  ];

  return (
    <div className="space-y-5">
      {flash && <p className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">{flash}</p>}

      {sections.map((section) => (
        <section key={section.key} className="rounded-2xl border border-white/10 bg-black/20 p-4 md:p-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="font-display text-xl text-white">{section.title}</h3>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{section.subtitle}</p>
            </div>
            <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">{section.data.length} events</p>
          </div>

          {section.data.length ? (
            <div className="grid gap-3">
              {section.data.map((event) => {
                const locked = busyId === event.id;
                const isDraft = event.status === 'DRAFT';
                const isPublished = ['OPEN', 'FULL', 'LOCKED'].includes(event.status);
                const canComplete = ['OPEN', 'FULL', 'LOCKED'].includes(event.status);
                const canCancel = ['OPEN', 'FULL', 'LOCKED', 'DRAFT'].includes(event.status);

                return (
                  <article key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${badgeTone[event.status]}`}>{event.status}</span>
                          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">{event.visibility}</span>
                        </div>
                        <h4 className="font-semibold text-white">{event.title}</h4>
                        <p className="text-xs text-slate-300">{formatDate(event.scheduledAt)} · {event.track ?? 'Track TBA'}</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{event.communityName} · {event.registrations}/{event.maxPlayers} entrants</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a href={`/dashboard/race-slots/${event.id}/edit`} className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.14em] text-white transition hover:border-white/45 hover:bg-white/12">Edit</a>
                        {isDraft && <button type="button" disabled={locked} onClick={() => publish(event.id)} className="rounded-full border border-emerald-300/35 bg-emerald-500/15 px-4 py-2 text-xs uppercase tracking-[0.14em] text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-50">Publish Event</button>}
                        {isPublished && <button type="button" disabled={locked} onClick={() => unpublish(event.id)} className="rounded-full border border-slate-300/30 bg-slate-500/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-slate-100 transition hover:bg-slate-500/20 disabled:opacity-50">Unpublish</button>}
                        {canComplete && <button type="button" disabled={locked} onClick={() => complete(event.id)} className="rounded-full border border-sky-300/35 bg-sky-500/15 px-4 py-2 text-xs uppercase tracking-[0.14em] text-sky-100 transition hover:bg-sky-500/25 disabled:opacity-50">Mark Completed</button>}
                        {canCancel && event.status !== 'CANCELLED' && <button type="button" disabled={locked} onClick={() => cancel(event.id)} className="rounded-full border border-rose-300/35 bg-rose-500/15 px-4 py-2 text-xs uppercase tracking-[0.14em] text-rose-100 transition hover:bg-rose-500/25 disabled:opacity-50">Cancel</button>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">No events in this state yet.</p>
          )}
        </section>
      ))}
    </div>
  );
}
