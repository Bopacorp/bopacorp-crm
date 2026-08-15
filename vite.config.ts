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
    testTimeout: 15000,
    env: {
      VITE_API_URL: 'http://test.local/api/v1',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/modules/clients/clients.service.ts',
        'src/modules/clients/components/BusinessClientForm.tsx',
        'src/modules/clients/hooks/useBusinessClients.ts',
        'src/modules/auth/components/Can.tsx',
        'src/modules/auth/components/RequireAuth.tsx',
        'src/modules/auth/components/RequirePermission.tsx',
        'src/modules/auth/context/AuthContext.tsx',
        'src/modules/auth/hooks/usePermission.ts',
        'src/modules/auth/pages/LoginPage.tsx',
        'src/modules/negotiations/negotiations.service.ts',
        'src/modules/negotiations/components/ChangeStateDialog.tsx',
        'src/modules/negotiations/components/CreateNegotiationDialog.tsx',
        'src/modules/negotiations/components/CreateVisitSheet.tsx',
        'src/modules/negotiations/components/NegotiationForm.tsx',
        'src/modules/negotiations/components/VisitActions.tsx',
        'src/modules/negotiations/hooks/useNegotiations.ts',
        'src/modules/negotiations/hooks/useVisits.ts',
        'src/services/api.ts',
        'src/services/auth-storage.ts',
        'src/services/auth.service.ts',
        'src/services/jwt.ts',
      ],
    },
  },
});
