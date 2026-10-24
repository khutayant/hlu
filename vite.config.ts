import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/** Nest serves UI at /ui/hlu/; Vercel static root uses VITE_BASE=/ */
function normalizeBase(value: string | undefined): string {
  if (!value || value === '/') {
    return '/';
  }
  return value.endsWith('/') ? value : `${value}/`;
}

const base = normalizeBase(process.env.VITE_BASE ?? '/ui/hlu');

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'assets/icons/favicon-16x16.png',
        'assets/icons/favicon-32x32.png',
        'assets/icons/apple-touch-icon.png',
      ],
      manifest: {
        name: 'HLU',
        short_name: 'HLU',
        description: 'HLU',
        theme_color: '#1565c0',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'assets/icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'assets/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'assets/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: 5191,
  },
});
