import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // This allows access from your LAN and public IP
    port: 3000,      // Default React dev server port
    strictPort: true // If port 3000 is in use, don't switch to another port
  }
});
