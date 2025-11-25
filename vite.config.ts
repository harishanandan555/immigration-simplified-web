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
          // Vendor chunks - split more granularly to reduce bundle size
          if (id.includes('node_modules')) {
            // React core libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // MUI and Emotion - split into separate chunk as they're large
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'ui-vendor';
            }
            // PDF libraries - large, keep separate
            if (id.includes('pdf') || id.includes('pdfjs')) {
              return 'pdf-vendor';
            }
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('react-day-picker')) {
              return 'form-vendor';
            }
            // Chart library
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            // Nutrient SDK
            if (id.includes('@nutrient-sdk')) {
              return 'nutrient-vendor';
            }
            // Large animation library
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // HTTP client
            if (id.includes('axios')) {
              return 'http-vendor';
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
