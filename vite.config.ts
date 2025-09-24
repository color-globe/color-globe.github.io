// vite.config.ts
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(`v${pkg.version}`),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __BUILD_ENV__: JSON.stringify(process.env.NODE_ENV),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
