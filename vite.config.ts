import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { createReadStream, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Connect, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const rootDir = dirname(fileURLToPath(import.meta.url));
const faviconPath = join(rootDir, 'public/favicon.ico');
const packageJson = JSON.parse(
  readFileSync(join(rootDir, 'package.json'), 'utf8'),
) as { version?: string };
const appVersion = packageJson.version ?? '0.0.0';

function normalizeBase(value: string | undefined): string {
  if (!value || value === '/') {
    return '/';
  }
  return value.endsWith('/') ? value : `${value}/`;
}

const base = normalizeBase(process.env.VITE_BASE ?? '/ui/hluwork');

function basePathPlugin(): Plugin {
  const baseWithoutSlash = base.replace(/\/$/, '');

  const middleware: Connect.NextHandleFunction = (
    req: IncomingMessage,
    res: ServerResponse,
    next: Connect.NextFunction,
  ) => {
    const [pathname = '', search = ''] = (req.url ?? '').split('?');
    const query = search ? `?${search}` : '';

    if (baseWithoutSlash && pathname === baseWithoutSlash) {
      res.statusCode = 302;
      res.setHeader('Location', `${base}${query}`);
      res.end();
      return;
    }

    if (pathname === '/favicon.ico') {
      res.setHeader('Content-Type', 'image/x-icon');
      createReadStream(faviconPath).pipe(res);
      return;
    }

    next();
  };

  return {
    name: 'base-path',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  base,
  define: {
    'import.meta.env.VITE_VERSION': JSON.stringify(appVersion),
  },
  plugins: [
    basePathPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'assets/icons/hlu-logo/favicon-16x16.png',
        'assets/icons/hlu-logo/favicon-32x32.png',
        'assets/icons/hlu-logo/apple-touch-icon.png',
      ],
      manifest: {
        name: 'HLU Work',
        short_name: 'HLU Work',
        description: 'HLU Work',
        theme_color: '#1565c0',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'assets/icons/hlu-logo/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'assets/icons/hlu-logo/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'assets/icons/hlu-logo/android-chrome-512x512.png',
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
    port: 5192,
  },
});
