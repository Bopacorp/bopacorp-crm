import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: './src/test/integration-setup.ts',
    include: ['src/integration/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
  },
});
