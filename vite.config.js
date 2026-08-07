import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://119.148.51.38:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
           
          });
          proxy.on('error', (err, req, res) => {
            
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      fs: false,
      os: false,
      path: false,
    }
  }
});