import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/modules/auth/context/AuthContext.js';

function TestProviders({ children, route = '/' }: { children: ReactNode; route?: string }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <TooltipProvider>
          <AuthProvider>{children}</AuthProvider>
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options?: { route?: string }) {
  return render(<TestProviders route={options?.route}>{ui}</TestProviders>);
}
