import MagneticButton from '../ui/MagneticButton';

const ruleChips = ['Same car', 'Same track', 'Ranked result'];

export default function HeroScene() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-28" id="top">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 z-0 h-full w-full object-cover"
        aria-hidden="true"
      >
        <source src="/videos/output.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 z-10 bg-slate-950/45" aria-hidden="true" />
      <div className="absolute inset-0 z-[16] bg-[radial-gradient(circle_at_72%_24%,rgba(181,31,47,.28),transparent_38%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-0 top-0 z-20 h-36 w-full bg-gradient-to-b from-black to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-48 w-full bg-gradient-to-b from-transparent to-black" aria-hidden="true" />

      <div className="section-shell relative z-30 grid min-h-[78vh] items-end gap-10 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(340px,480px)] lg:items-center">
        <div className="space-y-7">
          <h1 className="max-w-4xl font-display text-5xl leading-[0.94] text-white md:text-7xl lg:text-8xl">
            Race 1v1.
            <span className="block">Prove it on track.</span>
          </h1>
          <p className="max-w-2xl text-lg text-slate-300 md:text-xl">
            Create or accept head-to-head racing challenges. Win clean, build your rating, and climb the leaderboard.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <MagneticButton href="/race-slots" variant="solid">Find a 1v1 race</MagneticButton>
            <MagneticButton href="/dashboard/community/races/new" variant="ghost">Create a challenge</MagneticButton>
          </div>

          <div className="flex flex-wrap gap-2">
            {ruleChips.map((chip) => (
              <span key={chip} className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-200 backdrop-blur-sm">{chip}</span>
            ))}
          </div>
        </div>

        <div className="panel relative rounded-[2rem] p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Open challenge</p>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-100">Ranked</span>
          </div>

          <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Driver A</p>
              <h2 className="mt-2 font-display text-3xl text-white">magicmonkey</h2>
              <p className="mt-1 text-sm text-slate-300">SR 1280</p>
            </article>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-redline/60 bg-redline/20 font-display text-lg text-white shadow-[0_0_38px_rgba(181,31,47,.35)]">VS</div>

            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left sm:text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Driver B</p>
              <h2 className="mt-2 font-display text-3xl text-white">peanut05</h2>
              <p className="mt-1 text-sm text-slate-300">SR 1215</p>
            </article>
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300 sm:grid-cols-3">
            <p><span className="block text-[11px] uppercase tracking-[0.16em] text-slate-500">Track</span>Monza</p>
            <p><span className="block text-[11px] uppercase tracking-[0.16em] text-slate-500">Format</span>1v1 sprint</p>
            <p><span className="block text-[11px] uppercase tracking-[0.16em] text-slate-500">Status</span>Challenger needed</p>
          </div>
        </div>
      </div>
    </section>
  );
}
