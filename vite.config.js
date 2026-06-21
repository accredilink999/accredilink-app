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
      // Parse .env as fallback when process.env doesn't have VITE_ vars (local builds)
      const envFile = path.resolve(__dirname, '.env');
      const envVars = {};
      if (existsSync(envFile)) {
        readFileSync(envFile, 'utf-8').split('\n').forEach(line => {
          const eq = line.indexOf('=');
          if (eq > 0) {
            const k = line.slice(0, eq).trim();
            const v = line.slice(eq + 1).trim();
            if (k) envVars[k] = v;
          }
        });
      }
      const get = k => process.env[k] || envVars[k] || '';

      const swPath = path.resolve(__dirname, 'dist/sw.js');
      if (existsSync(swPath)) {
        let content = readFileSync(swPath, 'utf-8');
        content = content.replace(/__BUILD_TS__/g, Date.now().toString());
        content = content.replace(/__SUPABASE_URL__/g, get('VITE_SUPABASE_URL'));
        content = content.replace(/__SUPABASE_ANON_KEY__/g, get('VITE_SUPABASE_ANON_KEY'));
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
