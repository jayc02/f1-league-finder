export type HonourGrade = 'D' | 'C' | 'B' | 'A' | 'S';

export interface HonourGradeResult {
  grade: HonourGrade;
  label: string;
  tone: string;
  toneClasses: string;
}

export function getHonourGrade(score: number | null | undefined): HonourGradeResult {
  const safeScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  if (safeScore >= 140) {
    return { grade: 'S', label: 'Honour S', tone: 'border-fuchsia-300/40 bg-fuchsia-400/15 text-fuchsia-100', toneClasses: 'border-fuchsia-300/40 bg-fuchsia-400/15 text-fuchsia-100' };
  }
  if (safeScore >= 115) {
    return { grade: 'A', label: 'Honour A', tone: 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100', toneClasses: 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100' };
  }
  if (safeScore >= 90) {
    return { grade: 'B', label: 'Honour B', tone: 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100', toneClasses: 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100' };
  }
  if (safeScore >= 60) {
    return { grade: 'C', label: 'Honour C', tone: 'border-amber-300/40 bg-amber-400/15 text-amber-100', toneClasses: 'border-amber-300/40 bg-amber-400/15 text-amber-100' };
  }
  return { grade: 'D', label: 'Honour D', tone: 'border-rose-300/40 bg-rose-400/15 text-rose-100', toneClasses: 'border-rose-300/40 bg-rose-400/15 text-rose-100' };
}
