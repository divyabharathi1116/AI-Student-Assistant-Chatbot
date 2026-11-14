import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendPort = process.env.BACKEND_PORT || 5000;
const backendTarget = process.env.VITE_BACKEND_TARGET || `http://localhost:${backendPort}`;

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  error: `Backend API service is currently unreachable on ${backendTarget}. Please make sure the backend server on port ${backendPort} is running.`,
                })
              );
            }
          });
        },
      },
    },
  },
});
