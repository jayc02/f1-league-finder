import MagneticButton from '../ui/MagneticButton';
import CountUpStat from '../ui/CountUpStat';

const words = ['Race for position.', 'Earn your place.', 'Ranked. Rated. Respected.'];

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
      <div className="absolute inset-0 z-10 bg-slate-950/25" aria-hidden="true" />
      <div className="absolute inset-0 z-[16] bg-[radial-gradient(circle_at_70%_20%,rgba(181,31,47,.2),transparent_42%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-0 top-0 z-20 h-36 w-full bg-gradient-to-b from-black to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-48 w-full bg-gradient-to-b from-transparent to-black" aria-hidden="true" />
      <div className="section-shell relative z-30 grid min-h-[78vh] content-end gap-10 pb-12">
        <div className="space-y-8">
          <p className="max-w-fit border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">Competitive Sim Racing Operations Platform</p>
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
