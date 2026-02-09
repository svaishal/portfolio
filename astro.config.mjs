// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://vaishal.hawklab.in',
  integrations: [react()],
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),
  build: {
    assets: '_assets'
  },
  vite: {
    plugins: [tailwindcss()]
  },
  security: {
    checkOrigin: true
  }
});