interface ModerationAction {
  id: string;
  actionType: string;
  notes: string;
  createdAt: string;
  admin: { username: string };
  targetUser: { username: string };
  raceSlot?: { id: string; title: string } | null;
  dispute?: { id: string; status: string } | null;
}

interface DisputeItem {
  id: string;
  reason: string;
  details?: string | null;
  status: string;
  createdAt: string;
  openedBy: { username: string };
  raceSlot: { id: string; title: string };
}

export default function AdminModerationFeed({ actions, disputes }: { actions: ModerationAction[]; disputes: DisputeItem[] }) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <section className="panel rounded-3xl p-4 sm:p-6">
        <h2 className="font-display text-2xl text-white">Moderation Activity</h2>
        <div className="mt-4 space-y-3">
          {actions.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{entry.actionType} · {new Date(entry.createdAt).toLocaleString()}</p>
              <p className="mt-1 text-sm text-white">{entry.notes}</p>
              <p className="mt-2 text-xs text-slate-300">Admin {entry.admin.username} → {entry.targetUser.username}</p>
              {(entry.raceSlot || entry.dispute) && (
                <p className="mt-1 text-xs text-slate-400">
                  {entry.raceSlot ? `Event: ${entry.raceSlot.title}` : ''}
                  {entry.raceSlot && entry.dispute ? ' · ' : ''}
                  {entry.dispute ? `Dispute: ${entry.dispute.status}` : ''}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel rounded-3xl p-4 sm:p-6">
        <h2 className="font-display text-2xl text-white">Open Disputes</h2>
        <div className="mt-4 space-y-3">
          {disputes.length ? disputes.map((dispute) => (
            <article key={dispute.id} className="rounded-2xl border border-amber-300/25 bg-amber-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-amber-100/80">{dispute.status} · {new Date(dispute.createdAt).toLocaleString()}</p>
              <p className="mt-1 font-medium text-white">{dispute.reason}</p>
              <p className="mt-1 text-sm text-slate-200">{dispute.raceSlot.title}</p>
              <p className="mt-2 text-xs text-amber-100/80">Opened by {dispute.openedBy.username}</p>
            </article>
          )) : <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">No active disputes right now.</p>}
        </div>
      </section>
    </div>
  );
}
