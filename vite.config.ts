import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import copy from 'rollup-plugin-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    copy({
      targets: [
        {
          // Nutrient Web SDK requires its assets to be in the `public` directory so it can load them at runtime.
          src: "node_modules/@nutrient-sdk/viewer/dist/nutrient-viewer-lib",
          dest: "public/",
        },
      ],
      hook: "buildStart", // Copy assets when build starts.
    }),
    react(),
  ],
  base: '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  logLevel: 'warn',
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'ui-vendor';
            }
            if (id.includes('pdf') || id.includes('pdfjs')) {
              return 'pdf-vendor';
            }
            if (id.includes('react-hook-form') || id.includes('react-day-picker')) {
              return 'form-vendor';
            }
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            if (id.includes('@nutrient-sdk')) {
              return 'nutrient-vendor';
            }
            // Other node_modules go into vendor chunk
            return 'vendor';
          }
          // Controller chunks
          if (id.includes('/controllers/')) {
            return 'controllers';
          }
        },
      },
    },
  },
});
