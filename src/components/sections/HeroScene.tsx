import MagneticButton from '../ui/MagneticButton';

const ruleChips = ['Same car', 'Same track', 'Ranked'];

export default function HeroScene() {
  return (
    <section className="relative min-h-[88vh] overflow-hidden pt-20 md:min-h-screen md:pt-28" id="top">
      <div className="absolute inset-0 z-0 bg-[url('/og/racehub-default.svg')] bg-cover bg-center opacity-20" aria-hidden="true" />
      <video
        autoPlay
        muted
        loop
        playsInline
        webkit-playsinline=""
        preload="metadata"
        poster="/og/racehub-default.svg"
        className="absolute inset-0 z-0 h-full w-full object-cover object-center"
        data-bg-video
        aria-hidden="true"
      >
        <source src="/videos/output.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 z-10 bg-slate-950/45" aria-hidden="true" />
      <div className="absolute inset-0 z-[16] bg-[radial-gradient(circle_at_72%_24%,rgba(181,31,47,.28),transparent_38%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-0 top-0 z-20 h-36 w-full bg-gradient-to-b from-black to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-48 w-full bg-gradient-to-b from-transparent to-black" aria-hidden="true" />

      <div className="section-shell relative z-30 grid min-h-[76vh] items-end gap-7 pb-8 md:gap-10 md:pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(340px,480px)] lg:items-center">
        <div className="space-y-5 md:space-y-7">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/80 md:hidden">Ranked 1v1 racing</p>
          <h1 className="max-w-4xl font-display text-[4.6rem] leading-[0.84] text-white md:text-7xl md:leading-[0.94] lg:text-8xl">
            Race 1v1.
            <span className="block md:hidden">Prove it.</span>
            <span className="hidden md:block">Prove it on track.</span>
          </h1>
          <p className="max-w-xl text-base text-slate-200 md:max-w-2xl md:text-xl">
            <span className="md:hidden">Challenge drivers, confirm results, climb the ladder.</span>
            <span className="hidden md:inline">Create or accept head-to-head racing challenges. Win clean, build your rating, and climb the leaderboard.</span>
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:gap-4">
            <MagneticButton href="/duels" variant="solid">Find a duel</MagneticButton>
            <MagneticButton href="/duels/new" variant="ghost">Create challenge</MagneticButton>
          </div>

          <div className="mobile-scroll-row md:flex md:flex-wrap md:gap-2 md:overflow-visible">
            {ruleChips.map((chip) => (
              <span key={chip} className="rh-badge rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-slate-200 backdrop-blur-sm md:tracking-[0.18em]">{chip}</span>
            ))}
          </div>
        </div>

        <div className="panel rh-glow-card relative overflow-hidden rounded-[2rem] border-cyan-200/15 p-4 md:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 md:tracking-[0.24em]">Open challenge</p>
            <span className="rh-badge rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-emerald-100">Ranked</span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 md:gap-3">
            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 md:text-xs md:tracking-[0.18em]">Driver A</p>
              <h2 className="mt-2 truncate font-display text-2xl text-white md:text-3xl">magicmonkey</h2>
              <p className="mt-1 text-xs text-slate-300 md:text-sm">SR 1280</p>
            </article>

            <div className="my-auto flex h-12 w-12 items-center justify-center rounded-full border border-redline/60 bg-redline/25 font-display text-base text-white shadow-[0_0_38px_rgba(181,31,47,.45)] md:h-14 md:w-14 md:text-lg">VS</div>

            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-right md:p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 md:text-xs md:tracking-[0.18em]">Driver B</p>
              <h2 className="mt-2 truncate font-display text-2xl text-white md:text-3xl">peanut05</h2>
              <p className="mt-1 text-xs text-slate-300 md:text-sm">SR 1215</p>
            </article>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-slate-300 md:gap-3 md:p-4 md:text-sm">
            <p><span className="block text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-[11px]">Track</span>Monza</p>
            <p><span className="block text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-[11px]">Mode</span>1v1</p>
            <p><span className="block text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-[11px]">Status</span>Open</p>
          </div>
          <a href="/duels" className="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-bold uppercase tracking-[0.14em] text-black transition hover:bg-slate-200">Accept challenge</a>
        </div>
      </div>
    </section>
  );
}
