import { useEffect, useRef } from 'react';

export default function CountUpStat({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let cancelled = false;
    let cleanup = () => {};

    const run = async () => {
      const { default: gsap } = await import('gsap');
      if (cancelled) return;

      const data = { v: 0 };
      const tween = gsap.to(data, {
        v: value,
        duration: 1.4,
        ease: 'power3.out',
        onUpdate: () => {
          node.textContent = `${Math.floor(data.v).toLocaleString()}${suffix}`;
        }
      });

      cleanup = () => tween.kill();
    };

    void run();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [value, suffix]);

  return <span ref={ref}>0</span>;
}
