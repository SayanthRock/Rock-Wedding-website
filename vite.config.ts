import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    // Relative asset paths work both inside Capacitor's Android WebView and on GitHub Pages.
    // Absolute repo paths make Android builds open a blank screen, because apparently URLs enjoy drama.
    base: env.VITE_BASE_PATH || './',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Rock Wedding',
          short_name: 'Rock Wedding',
          description: 'AI-powered wedding photography portal',
          theme_color: '#000000',
          icons: [
            {
              src: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify this unless you specifically want noisy dev-server flickering.
      hmr: false,
      watch: null,
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
