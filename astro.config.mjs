import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

const site = (process.env.PUBLIC_SITE_URL || 'https://racehub.gg').replace(/\/$/, '');

export default defineConfig({
  site,
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [react(), tailwind({ applyBaseStyles: false })],
  vite: {
    build: {
      target: 'esnext',
    },
  },
});
