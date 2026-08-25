import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appVersion = Date.now().toString()

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'emit-app-version',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: appVersion }),
        })
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
