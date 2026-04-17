import { useEffect, useRef, useState } from 'react';
import { formatTimeLeft } from '@/lib/format';
import type { RaceSlotSummary } from '@/lib/api/types';

interface Props {
  raceSlots: RaceSlotSummary[];
}

export default function SlotShowcase({ raceSlots }: Props) {
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;

    const setSize = () => {
      const rect = section.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      t += 0.006;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const lineCount = w < 768 ? 9 : 14;
      const lineSpacing = h / (lineCount + 2);
      const lineStart = h * 0.22;

      for (let i = 0; i < lineCount; i++) {
        const y = lineStart + i * lineSpacing;
        const shift = Math.sin(t + i * 0.36) * (w < 768 ? 28 : 54);
        ctx.strokeStyle = `rgba(198,210,231,${0.022 + i * 0.0018})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-30, y + shift);
        ctx.bezierCurveTo(w * 0.3, y - 36, w * 0.64, y + 46, w + 30, y + shift * 0.55);
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    setSize();
    draw();

    const resizeObserver = new ResizeObserver(() => setSize());
    resizeObserver.observe(section);
    window.addEventListener('resize', setSize);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener('resize', setSize);
    };
  }, []);

  if (!raceSlots.length) {
    return (
      <section ref={sectionRef} id="slots" className="section-shell relative overflow-hidden rounded-3xl" data-reveal>
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0 opacity-65" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/45 via-black/20 to-black/50" aria-hidden="true" />
        <div className="panel relative z-10 rounded-3xl p-8 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Upcoming race slots</p>
          <h2 className="mt-3 font-display text-3xl text-white">No race slots are currently open.</h2>
          <p className="mt-3 text-slate-300">Check back shortly as organisers publish new sessions.</p>
        </div>
      </section>
    );
  }

  const slot = raceSlots[Math.min(index, raceSlots.length - 1)];
  const time = formatTimeLeft(new Date(slot.scheduledAt).getTime() - now);

  return (
    <section ref={sectionRef} id="slots" className="section-shell relative overflow-hidden rounded-3xl" data-reveal>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0 opacity-65" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/40 via-black/20 to-black/45" aria-hidden="true" />
      <div className="relative z-10 mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Upcoming race slots</p>
          <h2 className="section-title mt-2">Grid-ready sessions with verified standards.</h2>
        </div>
        <a href="/race-slots" className="text-sm text-slate-300 hover:text-white">View all slots →</a>
      </div>
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        <article className="panel rounded-3xl p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{slot.league.name} · {slot.status}</p>
          <h3 className="mt-2 font-display text-4xl text-white">{slot.title}</h3>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-300 md:grid-cols-4">
            <p><span className="block text-xs text-slate-500">Platform</span>{slot.crossplay ? 'Crossplay' : slot.platform ?? 'TBD'}</p>
            <p><span className="block text-xs text-slate-500">Region</span>{slot.region}</p>
            <p><span className="block text-xs text-slate-500">Entrants</span>{slot._count.registrations}/{slot.maxPlayers}</p>
            <p><span className="block text-xs text-slate-500">Starts</span>{new Date(slot.scheduledAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-slate-300">{slot.formatDetails}</p>
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
              key={entry.id}
              onClick={() => setIndex(i)}
              className={`panel w-full rounded-2xl p-4 text-left transition ${index === i ? 'border-redline bg-redline/10' : 'hover:-translate-y-1'}`}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{entry.region} · {entry._count.registrations}/{entry.maxPlayers}</p>
              <p className="mt-1 font-semibold text-white">{entry.title}</p>
            </button>
          ))}
        </aside>
      </div>
    </section>
  );
}
