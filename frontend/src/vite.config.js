// vite.config.js - force restart 1780089821414
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Auto-clear deps cache on restart
const cacheDir = path.join(process.cwd(), 'node_modules', '.vite');
try { 
  if(fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, {recursive:true, force:true});
    console.log('[HireMind] Cleared Vite cache');
  }
} catch(e) {}

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173 }
});
