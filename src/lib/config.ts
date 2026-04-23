const DEFAULT_SITE_URL = 'https://racehub.gg';

const normalizeOrigin = (value: string) => value.replace(/\/$/, '');

export const siteConfig = {
  name: 'RaceHub',
  domain: 'racehub.gg',
  defaultDescription:
    'RaceHub is the competitive sim racing platform for organised events, verified communities, and transparent rankings.',
  siteUrl: normalizeOrigin(import.meta.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL),
};

export const absoluteUrl = (path = '/') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(cleanPath, `${siteConfig.siteUrl}/`).toString();
};

export const resolveAssetUrl = (value: string | null | undefined, fallbackPath: string) => {
  if (!value) return fallbackPath;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return value;
  return `/${value}`;
};
