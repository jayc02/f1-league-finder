interface CoinFlipBarProps {
  value: number | null;
  headsLabel: string;
  tailsLabel: string;
  winnerSide?: 'HEADS' | 'TAILS' | null;
  animated?: boolean;
}

export default function CoinFlipBar({ value, headsLabel, tailsLabel, winnerSide, animated = true }: CoinFlipBarProps) {
  if (typeof value !== 'number') {
    return (
      <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.04] p-5 text-center text-sm text-slate-300">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Coin flip pending</p>
        <p className="mt-2">Coin flip happens when the challenge is accepted.</p>
      </div>
    );
  }

  const clamped = Math.max(0, Math.min(100, value));
  const winnerLabel = winnerSide === 'HEADS' ? headsLabel : tailsLabel;

  return (
    <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.09] via-black/45 to-black/75 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em]">
        <span className={`rounded-full border px-3 py-1 ${winnerSide === 'HEADS' ? 'border-amber-200/70 bg-amber-400/20 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.25)]' : 'border-white/15 bg-white/5 text-slate-300'}`}>Heads · {headsLabel}</span>
        <span className="text-slate-500">0–100</span>
        <span className={`rounded-full border px-3 py-1 ${winnerSide === 'TAILS' ? 'border-cyan-200/70 bg-cyan-400/20 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : 'border-white/15 bg-white/5 text-slate-300'}`}>Tails · {tailsLabel}</span>
      </div>

      <div className="relative mt-6 h-5 rounded-full border border-white/15 bg-gradient-to-r from-amber-300/70 via-white/25 to-cyan-300/70 shadow-inner">
        <div className="absolute left-1/2 top-1/2 h-8 w-px -translate-y-1/2 bg-white/30" />
        <div
          className={`absolute top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-black shadow-[0_0_30px_rgba(255,255,255,0.35)] ${animated ? 'transition-[left] duration-1000 ease-out' : ''}`}
          style={{ left: `${clamped}%` }}
          aria-label={`Coin flip marker at ${clamped}`}
        >
          <span className="absolute inset-1 rounded-full bg-gradient-to-br from-white to-slate-400" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 sm:items-center">
        <p className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-slate-300"><span className="block text-[11px] uppercase tracking-[0.16em] text-slate-500">Result number</span>{clamped}</p>
        <p className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-slate-300"><span className="block text-[11px] uppercase tracking-[0.16em] text-slate-500">Closer to</span>{winnerSide === 'HEADS' ? 'Heads / 0' : 'Tails / 100'}</p>
        <p className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 p-3 text-sm text-emerald-100"><span className="block text-[11px] uppercase tracking-[0.16em] text-emerald-200/70">Leg 1 advantage</span>{winnerLabel}</p>
      </div>
    </div>
  );
}
