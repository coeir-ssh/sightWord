import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: ['es2019', 'safari13', 'chrome87', 'edge88', 'firefox78'],
  },
  server: {
    host: true,
  },
});
