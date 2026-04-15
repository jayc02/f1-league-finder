import { useEffect, useRef } from 'react';
import MagneticButton from '../ui/MagneticButton';
import CountUpStat from '../ui/CountUpStat';

const words = ['Race for position.', 'Earn your place.', 'Ranked. Rated. Respected.'];

export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    const setSize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const draw = () => {
      t += 0.008;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 18; i++) {
        const y = h * 0.2 + i * 26;
        const shift = Math.sin(t + i * 0.25) * 80;
        ctx.strokeStyle = `rgba(198,210,231,${0.04 + i * 0.0025})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-40, y + shift);
        ctx.bezierCurveTo(w * 0.35, y - 40, w * 0.6, y + 60, w + 40, y + shift * 0.6);
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };

    setSize();
    draw();
    window.addEventListener('resize', setSize);
    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden pt-28" id="top">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src="/output.mp4"
        aria-hidden="true"
      />
      <div className="absolute inset-0 z-10 bg-slate-950/25" aria-hidden="true" />
      <canvas ref={canvasRef} className="absolute inset-0 z-[15] opacity-80" aria-hidden="true" />
      <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_70%_20%,rgba(181,31,47,.2),transparent_42%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-44 w-full bg-gradient-to-b from-transparent to-black" aria-hidden="true" />
      <div className="section-shell relative z-30 grid min-h-[78vh] content-end gap-10 pb-12">
        <div className="space-y-8">
          <p className="max-w-fit border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">Competitive F1 Operations Platform</p>
          <h1 className="font-display text-5xl leading-[0.94] text-white md:text-7xl lg:text-8xl">
            {words.map((word) => (
              <span className="block overflow-hidden" key={word}>
                <span data-hero-word className="block">{word}</span>
              </span>
            ))}
          </h1>
          <p className="max-w-2xl text-lg text-slate-300 md:text-xl">
            Structured race slots, verified stewarding, and honour-based progression for drivers and organisers building serious competitive lobbies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <MagneticButton href="/race-slots" variant="solid">Enter Race Calendar</MagneticButton>
          <MagneticButton href="/leagues" variant="ghost">Explore league tools</MagneticButton>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Active drivers', 12840],
            ['Verified leagues', 312],
            ['Clean race ratio', 94]
          ].map(([label, value], idx) => (
            <div key={label} className="panel rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
              <p className="mt-2 font-display text-4xl text-white"><CountUpStat value={Number(value)} suffix={idx === 2 ? '%' : ''} /></p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
