import { features } from '@/data/site';

export default function FeatureStrip() {
  const repeated = [...features, ...features];
  return (
    <section className="overflow-hidden border-y border-white/[0.04] bg-transparent py-7" data-reveal>
      <div className="animate-[marquee_26s_linear_infinite] whitespace-nowrap">
        {repeated.map((item, idx) => (
          <span key={`${item}-${idx}`} className="mx-6 inline-flex items-center text-sm uppercase tracking-[0.18em] text-slate-300">
            <span className="mr-6 text-redline">●</span>{item}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from {transform: translateX(0)} to {transform: translateX(-50%)} }`}</style>
    </section>
  );
}
