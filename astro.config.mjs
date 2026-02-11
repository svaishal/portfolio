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
    plugins: [tailwindcss()],
    build: {
      // Code-splitting optimization
      rollupOptions: {
        output: {
          manualChunks: {
            // Split React runtime
            'react-vendor': ['react', 'react-dom'],
            // Split Supabase
            'supabase-vendor': ['@supabase/supabase-js', '@supabase/ssr'],
            // Split Framer Motion (if used)
            'motion': ['framer-motion'],
          }
        }
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 500,
    },
    // Optimize deps pre-bundling
    optimizeDeps: {
      include: ['react', 'react-dom', '@supabase/supabase-js'],
    }
  },
  security: {
    checkOrigin: true
  }
});