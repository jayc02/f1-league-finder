import { useEffect } from 'react';

export default function CursorGlow() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const glow = document.createElement('div');
    glow.className = 'fixed pointer-events-none z-20 h-80 w-80 rounded-full';
    glow.style.background = 'radial-gradient(circle, rgba(165,178,203,0.17), transparent 68%)';
    glow.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(glow);

    const move = (e: MouseEvent) => {
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
    };

    window.addEventListener('mousemove', move);
    return () => {
      window.removeEventListener('mousemove', move);
      glow.remove();
    };
  }, []);

  return null;
}
