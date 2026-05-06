import type { AstroGlobal } from 'astro';

export const publicPageShort = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300';
export const publicPageMedium = 'public, max-age=0, s-maxage=300, stale-while-revalidate=600';
export const publicPageLong = 'public, max-age=0, s-maxage=600, stale-while-revalidate=1800';
export const privateNoStore = 'private, no-store';
export const publicApiShort = 'public, max-age=0, s-maxage=45, stale-while-revalidate=60';
export const privateApiNoStore = 'private, no-store';

export const setAstroCache = (Astro: AstroGlobal, value: string) => {
  const { headers } = Astro.response;
  headers.set('Cache-Control', value);
};
