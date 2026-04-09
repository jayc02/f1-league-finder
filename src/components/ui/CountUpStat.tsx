import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CountUpStat({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const data = { v: 0 };
    gsap.to(data, {
      v: value,
      duration: 1.4,
      ease: 'power3.out',
      onUpdate: () => {
        node.textContent = `${Math.floor(data.v).toLocaleString()}${suffix}`;
      }
    });
  }, [value, suffix]);

  return <span ref={ref}>0</span>;
}
