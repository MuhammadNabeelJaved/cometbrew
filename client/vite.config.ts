import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    minify: 'esbuild',
    chunkSizeWarningLimit: 800,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-charts': ['recharts'],
          'vendor-socket': ['socket.io-client'],
          'vendor-icons':  ['lucide-react'],
          'vendor-utils':  ['axios', 'date-fns'],
          'vendor-ui':     ['sonner', 'clsx', 'tailwind-merge'],
          'vendor-radix':  ['@radix-ui/react-dropdown-menu', '@radix-ui/react-scroll-area'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        proxyTimeout: 300000,
        timeout: 300000,
      },
      '/socket.io': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (err.message.includes('ECONNREFUSED') || err.message.includes('ECONNABORTED')) {
              if ('writeHead' in res && typeof res.writeHead === 'function') {
                res.writeHead(503, { 'Content-Type': 'text/plain' });
                res.end('Backend unavailable');
              }
              return;
            }
            console.error('socket.io proxy error', err);
          });
        },
      },
    },
  },
})
