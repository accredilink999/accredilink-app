import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { readFileSync, writeFileSync, existsSync } from 'fs'

// Stamps public/sw.js with a unique build timestamp so every deploy
// produces a byte-different service worker file, triggering the browser
// to install the new SW and clear stale caches automatically.
function swVersionStamp() {
  return {
    name: 'sw-version-stamp',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js');
      if (existsSync(swPath)) {
        let content = readFileSync(swPath, 'utf-8');
        content = content.replace(/__BUILD_TS__/g, Date.now().toString());
        writeFileSync(swPath, content);
      }
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    swVersionStamp(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
