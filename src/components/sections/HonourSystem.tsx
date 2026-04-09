import { useEffect, useState } from 'react';

export default function HonourSystem() {
  const [score, setScore] = useState(84);

  useEffect(() => {
    const timer = setInterval(() => {
      setScore((v) => (v >= 98 ? 84 : v + 1));
    }, 220);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="section-shell" data-reveal>
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Honour System</p>
          <h2 className="section-title mt-3">Fast is respected. Clean is rewarded.</h2>
          <p className="mt-5 text-lg text-slate-300">The honour model monitors incident history, steward confirmations, and racecraft behaviour. Better conduct unlocks premier grids and organiser trust.</p>
        </div>
        <div className="panel rounded-3xl p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Live conduct index</p>
          <p className="mt-2 font-display text-7xl text-white">{score}</p>
          <div className="mt-4 h-3 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-redline via-orange-200 to-emerald-300 transition-all duration-300" style={{ width: `${score}%` }} />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-slate-300">
            <p className="rounded-xl border border-white/10 p-3">Incident-free laps: +2</p>
            <p className="rounded-xl border border-white/10 p-3">Penalty upheld: -4</p>
            <p className="rounded-xl border border-white/10 p-3">Steward commendation: +3</p>
          </div>
        </div>
      </div>
    </section>
  );
}
