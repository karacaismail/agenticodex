/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/agenticodex/' : '/',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, strictPort: false },
  build: {
    manifest: true,
    chunkSizeWarningLimit: 2500,
    // Automatic splitting preserves lazy diagram imports and avoids shared-helper capture.
    rolldownOptions: { output: { codeSplitting: true } },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    testTimeout: 60000,
    css: false,
  },
});
