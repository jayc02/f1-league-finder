import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export default function PageMotion() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let lenis: Lenis | null = null;
    if (!reduced) {
      lenis = new Lenis({ smoothWheel: true });
      const raf = (time: number) => {
        lenis?.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }

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

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      lenis?.destroy();
    };
  }, []);

  return null;
}
