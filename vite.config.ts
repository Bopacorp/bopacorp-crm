import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['bopacorp-crm.jointrymyride.com'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_API_URL: 'http://test.local/api/v1',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/modules/auth/components/Can.tsx',
        'src/modules/auth/components/RequireAuth.tsx',
        'src/modules/auth/components/RequirePermission.tsx',
        'src/modules/auth/context/AuthContext.tsx',
        'src/modules/auth/hooks/usePermission.ts',
        'src/modules/auth/pages/LoginPage.tsx',
        'src/services/api.ts',
        'src/services/auth-storage.ts',
        'src/services/auth.service.ts',
        'src/services/jwt.ts',
      ],
    },
  },
});
