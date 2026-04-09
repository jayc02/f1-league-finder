import { useEffect, useState } from 'react';
import { raceSlots } from '@/data/site';
import { formatTimeLeft } from '@/lib/format';

export default function SlotShowcase() {
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const slot = raceSlots[index];
  const time = formatTimeLeft(new Date(slot.startsAt).getTime() - now);

  return (
    <section id="slots" className="section-shell" data-reveal>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Upcoming race slots</p>
          <h2 className="section-title mt-2">Grid-ready sessions with verified standards.</h2>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <article className="panel rounded-3xl p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{slot.tier}</p>
          <h3 className="mt-2 font-display text-4xl text-white">{slot.event}</h3>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-300 md:grid-cols-4">
            <p><span className="block text-xs text-slate-500">Platform</span>{slot.platform}</p>
            <p><span className="block text-xs text-slate-500">Region</span>{slot.region}</p>
            <p><span className="block text-xs text-slate-500">Assists</span>{slot.assists}</p>
            <p><span className="block text-xs text-slate-500">Starts</span>{new Date(slot.startsAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
          <div className="mt-8 flex gap-3 text-center">
            {Object.entries(time).map(([k, v]) => (
              <div key={k} className="min-w-20 rounded-xl border border-white/15 bg-black/30 px-3 py-3">
                <p className="font-display text-3xl">{String(v).padStart(2, '0')}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{k}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-3">
          {raceSlots.map((entry, i) => (
            <button
              key={entry.event}
              onClick={() => setIndex(i)}
              className={`panel w-full rounded-2xl p-4 text-left transition ${index === i ? 'border-redline bg-redline/10' : 'hover:-translate-y-1'}`}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{entry.region}</p>
              <p className="mt-1 font-semibold text-white">{entry.event}</p>
            </button>
          ))}
        </aside>
      </div>
    </section>
  );
}
