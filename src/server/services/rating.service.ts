export const computeRacePoints = (position: number): number => {
  const table = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  return table[position - 1] ?? 0;
};

export const computeSkillDelta = (position: number, totalDrivers: number): number => {
  const midpoint = (totalDrivers + 1) / 2;
  return Math.round((midpoint - position) * 4);
};

export const computeHonourDeltaForResult = (position: number, totalDrivers: number): number => {
  if (position === 1) return 2;
  if (position <= Math.ceil(totalDrivers / 2)) return 1;
  return 0;
};
