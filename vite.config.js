import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.REPL_ID || process.env.REPLIT_ENVIRONMENT ? 5000 : 3000,
    host: '0.0.0.0',
    allowedHosts: true
  }
});
