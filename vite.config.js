import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    hmr: {
      overlay: false, // Prevent Vite from showing full-screen error overlay
    }
  },
  resolve: {
    alias: {
      // Optional: prevent some node modules from trying to use Unix paths
      fs: false,
      os: false,
      path: false,
    }
  }
});
