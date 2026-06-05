import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(),
<<<<<<< HEAD
      tailwindcss(),
=======
>>>>>>> origin/main
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'E. Moments',
          short_name: 'E. Moments',
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
      hmr: false,
      watch: null,
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      chunkSizeWarningLimit: 1000,
    }
  };
});
