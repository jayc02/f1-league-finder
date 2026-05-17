import { useEffect, useMemo, useRef, useState } from 'react';
import { formatTimeLeft } from '@/lib/format';
import type { RaceSlotSummary, SessionUser } from '@/lib/api/types';

interface Props {
  raceSlots: RaceSlotSummary[];
}

export default function SlotShowcase({ raceSlots }: Props) {
  const [now, setNow] = useState(Date.now());
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [slotState, setSlotState] = useState(() => raceSlots);
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSlotState(raceSlots);
  }, [raceSlots]);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem('racehub.navUser.v2');
      if (raw) {
        const parsed = JSON.parse(raw) as { user?: SessionUser | null; cachedAt?: number };
        if (parsed.cachedAt && Date.now() - parsed.cachedAt <= 45_000) {
          setUser(parsed.user ?? null);
          setAuthLoaded(true);
          return;
        }
      }
    } catch {
      // Ignore malformed browser cache and fall back to the private auth endpoint.
    }

    void fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user ?? null);
        try {
          window.sessionStorage.setItem('racehub.navUser.v2', JSON.stringify({ user: data.user ?? null, cachedAt: Date.now() }));
        } catch {
          // Storage can be unavailable; this only affects nav/auth dedupe.
        }
      })
      .catch(() => setUser(null))
      .finally(() => setAuthLoaded(true));
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

  const upcomingSlots = useMemo(
    () => slotState.filter((slot) => ['OPEN', 'FULL'].includes(slot.status)).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [slotState],
  );

  const nearestSlot = upcomingSlots[0];
  const startsInMinutes = nearestSlot ? Math.floor((new Date(nearestSlot.scheduledAt).getTime() - now) / 60000) : null;

  const handleJoin = async (slot: RaceSlotSummary) => {
    if (loadingId) return;
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setLoadingId(slot.id);
    try {
      const response = await fetch(`/api/race-slots/${slot.id}/register`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 409) {
          setRegisteredIds((prev) => new Set(prev).add(slot.id));
          return;
        }
        return;
      }

      setRegisteredIds((prev) => new Set(prev).add(slot.id));
      setSlotState((prev) =>
        prev.map((entry) =>
          entry.id === slot.id
            ? {
                ...entry,
                _count: { registrations: Math.min(entry.maxPlayers, entry._count.registrations + 1) },
                status: entry._count.registrations + 1 >= entry.maxPlayers ? 'FULL' : entry.status,
              }
            : entry,
        ),
      );
    } finally {
      setLoadingId(null);
    }
  };

  if (!raceSlots.length) {
    return (
      <section ref={sectionRef} id="slots" className="section-shell relative overflow-hidden rounded-3xl" data-reveal>
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0 opacity-65" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/45 via-black/20 to-black/50" aria-hidden="true" />
        <div className="panel relative z-10 rounded-3xl p-8 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Upcoming race slots</p>
          <h2 className="mt-3 font-display text-3xl text-white">No upcoming races yet — check back soon or create one.</h2>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="slots" className="section-shell relative overflow-hidden rounded-3xl" data-reveal>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0 opacity-65" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/40 via-black/20 to-black/45" aria-hidden="true" />
      <div className="relative z-10 space-y-6">
        {nearestSlot && startsInMinutes !== null && startsInMinutes >= 0 && (
          <div className="rounded-2xl border border-white/20 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 backdrop-blur-sm">
            Next race starts in <span className="font-semibold text-white">{startsInMinutes} minutes</span> — {nearestSlot._count.registrations} / {nearestSlot.maxPlayers} drivers joined
          </div>
        )}

        <div className="mb-2 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Upcoming race slots</p>
            <h2 className="section-title mt-2">Join active grids before lights out.</h2>
          </div>
          <a href="/race-slots" className="text-sm text-slate-300 hover:text-white">View all slots →</a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {slotState.map((slot, i) => {
            const scheduledMs = new Date(slot.scheduledAt).getTime();
            const time = formatTimeLeft(scheduledMs - now);
            const fillRatio = slot.maxPlayers ? slot._count.registrations / slot.maxPlayers : 0;
            const isAlmostFull = fillRatio > 0.7 && fillRatio < 1;
            const isStartingSoon = scheduledMs - now > 0 && scheduledMs - now < 15 * 60 * 1000;
            const cutoffPassed = new Date(slot.registrationCutoffAt).getTime() <= now;
            const isClosed = cutoffPassed || ['LOCKED', 'COMPLETED', 'CANCELLED'].includes(slot.status);
            const isFull = slot._count.registrations >= slot.maxPlayers || slot.status === 'FULL';
            const isRegistered = registeredIds.has(slot.id);
            const canJoin = !isClosed && !isFull && !isRegistered;

            return (
              <article
                key={slot.id}
                className="panel group rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/[0.05]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{slot.league.name}</p>
                  <div className="flex flex-wrap justify-end gap-2">
                    {isStartingSoon && <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100">Starting Soon</span>}
                    {isAlmostFull && <span className="rounded-full border border-rose-300/40 bg-rose-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-100">Almost Full</span>}
                  </div>
                </div>
                <h3 className="mt-2 font-display text-2xl text-white">{slot.title}</h3>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-300">
                  <p><span className="block text-[11px] text-slate-500">Region</span>{slot.region}</p>
                  <p><span className="block text-[11px] text-slate-500">Grid</span>{slot._count.registrations}/{slot.maxPlayers}</p>
                  <p><span className="block text-[11px] text-slate-500">Platform</span>{slot.crossplay ? 'Crossplay' : slot.platform ?? 'TBD'}</p>
                  <p><span className="block text-[11px] text-slate-500">Starts in</span>{`${time.hours}h ${time.minutes}m`}</p>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-300">{slot.formatDetails}</p>
                <button
                  onClick={() => void handleJoin(slot)}
                  disabled={!authLoaded || loadingId === slot.id || !canJoin}
                  className="mt-5 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingId === slot.id ? 'Joining…' : isRegistered ? 'Registered' : isClosed ? 'Closed' : isFull ? 'Full' : 'Join Race'}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
