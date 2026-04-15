import { useEffect, useRef } from 'react';

const steps = [
  { title: 'Choose a slot', copy: 'Select a region, tier, and assist profile aligned with your pace and setup.' },
  { title: 'Race under standards', copy: 'Every lobby uses verified settings and stewarding rules so outcomes stay credible.' },
  { title: 'Score and honour update', copy: 'Performance and conduct both feed your profile with transparent adjustments.' },
  { title: 'Unlock stronger grids', copy: 'Higher ratings open premium events, organiser invites, and better-ranked sessions.' }
];

export default function HowItWorksTimeline() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let cancelled = false;
    let cleanup = () => {};

    const run = async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger')
      ]);

      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      const track = wrap.querySelector<HTMLElement>('[data-track]');
      if (!track) return;

      const ctx = gsap.context(() => {
        gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth + 80),
          ease: 'none',
          scrollTrigger: {
            trigger: wrap,
            start: 'top top',
            end: () => `+=${track.scrollWidth}`,
            pin: true,
            scrub: 1
          }
        });
      }, wrap);

      cleanup = () => {
        ctx.revert();
      };
    };

    void run();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <section id="how" ref={wrapRef} className="relative h-[110vh] overflow-hidden border-y border-white/[0.04] bg-transparent" data-reveal>
      <div className="flex h-full items-center gap-8 px-[6vw]" data-track>
        {steps.map((step, i) => (
          <article key={step.title} className="panel w-[80vw] max-w-[540px] flex-none rounded-3xl p-10 md:w-[48vw]">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Step {i + 1}</p>
            <h3 className="mt-4 font-display text-4xl text-white">{step.title}</h3>
            <p className="mt-5 text-lg text-slate-300">{step.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
