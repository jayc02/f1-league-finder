import { useEffect } from 'react';

export default function PageMotion() {
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    const run = async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('lenis')
      ]);

      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      let lenis: InstanceType<typeof Lenis> | null = null;
      let rafId = 0;
      if (!reduced) {
        lenis = new Lenis({ smoothWheel: true });
        const raf = (time: number) => {
          lenis?.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);
      }

      const ctx = gsap.context(() => {
        gsap.from('[data-hero-word]', {
          yPercent: 105,
          opacity: 0,
          duration: 1,
          stagger: 0.08,
          ease: 'power3.out',
          delay: 0.25
        });

        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((item) => {
          gsap.from(item, {
            y: 36,
            opacity: 0,
            duration: 0.9,
            ease: 'power2.out',
            scrollTrigger: { trigger: item, start: 'top 85%' }
          });
        });

        const header = document.querySelector<HTMLElement>('[data-header]');
        if (header) {
          ScrollTrigger.create({
            start: 20,
            end: 99999,
            onUpdate: (self) => {
              header.style.transform = self.direction === 1 ? 'translateY(-100%)' : 'translateY(0)';
            }
          });
        }
      });

      cleanup = () => {
        ctx.revert();
        if (rafId) cancelAnimationFrame(rafId);
        lenis?.destroy();
      };
    };

    void run();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
