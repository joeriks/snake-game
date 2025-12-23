import { defineConfig } from 'vite';

export default defineConfig({
  // For GitHub Pages: uses repo name from env, defaults to '/' for local dev
  base: process.env.GITHUB_PAGES ? '/snake-game/' : '/',
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 5173,
    open: true
  }
});
