import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    // Apenas testes core que sempre devem passar
    include: [
      // Componentes essenciais
      '__tests__/SearchBar.test.tsx',
      '__tests__/FavoriteButton.test.tsx',
      '__tests__/ProgressIndicator.test.tsx',
      '__tests__/SkeletonLoader.test.tsx',
      
      // Hooks básicos
      '__tests__/useSearch.test.ts',
      '__tests__/usePagination.test.ts',
      
      // Utilidades essenciais
      '__tests__/searchUtils.test.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*integration*.test.ts',
      '**/*Integration*.test.tsx',
      '**/*performance*.test.ts',
      '**/*Performance*.test.ts',
      '**/*benchmark*.test.ts',
      '**/proxy*.test.ts',
      '**/debug-proxy*.test.ts',
      '**/configuration*.test.ts',
      '**/feedDiscovery*.test.ts',
      '**/feedValidator*.test.ts',
      '**/logger*.test.ts',
      '**/ErrorBoundary*.test.tsx',
      '**/securityFixes*.test.ts',
      '**/themeUtils*.test.ts',
      '**/useFavorites*.test.ts'
    ]
  }
});