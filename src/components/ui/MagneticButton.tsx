import { useRef } from 'react';

type Props = {
  children: React.ReactNode;
  href?: string;
  variant?: 'solid' | 'ghost';
};

export default function MagneticButton({ children, href = '#', variant = 'solid' }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  const move = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    node.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = 'translate(0,0)';
  };

  const classes =
    variant === 'solid'
      ? 'bg-white text-black hover:bg-slate-200'
      : 'border border-white/20 bg-white/5 text-white hover:bg-white/10';

  return (
    <a
      ref={ref}
      href={href}
      onMouseMove={move}
      onMouseLeave={reset}
      className={`magnetic inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold tracking-wide transition duration-300 ${classes}`}
    >
      {children}
    </a>
  );
}
