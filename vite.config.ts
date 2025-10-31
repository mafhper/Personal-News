import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/personalnews/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': './',
    }
  },
  build: {
    // Output directory for GitHub Pages
    outDir: 'dist',
    // Enable code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'performance': [
            './services/performanceUtils.ts',
            './hooks/usePerformance.ts',
            './components/PerformanceDebugger.tsx'
          ],
          'services': [
            './services/rssParser.ts',
            './services/weatherService.ts',
            './services/articleCache.ts',
            './services/themeUtils.ts',
            './services/searchUtils.ts'
          ]
        }
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable source maps for development only
    sourcemap: false,
    // Minify for production
    minify: 'esbuild',
    // Target modern browsers for better optimization
    target: 'es2020'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: []
  },
  // Performance optimizations
  server: {
    hmr: {
      overlay: false
    }
  }
});
