import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // « prompt » : une nouvelle version ne s'active que quand l'utilisateur le décide,
      // pour ne jamais recharger la page au milieu du remplissage d'un bulletin.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/apple-touch-icon.png', 'genies-wordmark.png', 'genies-symbols.png', 'symbols/*.png'],
      manifest: {
        id: '/',
        name: 'Genies · Vote',
        short_name: 'Genies',
        description: 'Plateforme de vote proposée par Genies pour élire le responsable de votre groupe.',
        lang: 'fr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#241A5C',
        background_color: '#241A5C',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [{ name: 'Scrutins', short_name: 'Scrutins', url: '/dashboard', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] }]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        // L'API ne doit jamais être servie par le cache ni par la page d'accueil de secours.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // Les données (votes, résultats, comptes) passent toujours par le réseau : jamais de copie en cache.
          { urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Les polices restent des fichiers séparés (jamais en « data: »), ce qui permet une CSP stricte : font-src 'self'.
    assetsInlineLimit: (file: string) => (file.endsWith('.woff2') ? false : undefined),
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          icons: ['lucide-react'],
          motion: ['gsap', '@gsap/react'],
          three: ['three']
        }
      }
    }
  }
});
