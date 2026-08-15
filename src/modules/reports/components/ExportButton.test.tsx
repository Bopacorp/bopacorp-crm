import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reportMetricA, reportMetricB } from '@/test/crm-phase5-fixtures.js';

const mocks = vi.hoisted(() => ({
  listAdvisorMetrics: vi.fn(),
  createExport: vi.fn(),
  toastSuccess: vi.fn(),
  createObjectURL: vi.fn(),
  revokeObjectURL: vi.fn(),
  user: { id: '00000000-0000-4000-8000-000000000101' },
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess } }));
vi.mock('@/modules/auth/context/AuthContext.js', () => ({
  useAuth: () => ({ user: mocks.user }),
}));
vi.mock('../reports.service.js', () => ({
  listAdvisorMetrics: mocks.listAdvisorMetrics,
  createExport: mocks.createExport,
}));
vi.mock('@/components/ui/button.js', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) => (
    <button type="button" onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));
vi.mock('@/components/ui/dropdown-menu.js', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { ExportButton } from './ExportButton.js';

function renderExportButton() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ExportButton />
    </QueryClientProvider>,
  );
}

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listAdvisorMetrics.mockResolvedValue([reportMetricA, reportMetricB]);
    mocks.createExport.mockResolvedValue({});
    mocks.createObjectURL.mockReturnValue('blob:test');
  });

  it('builds an escaped CSV, downloads it, and records the export', async () => {
    const user = userEvent.setup();
    const originalUrl = window.URL;
    let capturedBlob: Blob | undefined;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    mocks.createObjectURL.mockImplementation((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:test';
    });
    Object.defineProperty(window, 'URL', {
      configurable: true,
      value: {
        createObjectURL: mocks.createObjectURL,
        revokeObjectURL: mocks.revokeObjectURL,
      },
    });

    try {
      renderExportButton();
      await user.click(screen.getByRole('button', { name: 'reports.exportMetrics' }));

      await waitFor(() => expect(mocks.createExport).toHaveBeenCalledOnce());
      const csv = await capturedBlob?.text();

      expect(csv).toContain('Asesor,"New, lead",Closing,"Lost ""deal""",Visitados');
      expect(csv).toContain('Alex Advisor,3,2,0,4,1200,300,8');
      expect(csv).toContain('Blair Advisor,0,5,1,2,800,400,');
      expect(mocks.createObjectURL).toHaveBeenCalledOnce();
      expect(click).toHaveBeenCalledOnce();
      expect(mocks.revokeObjectURL).toHaveBeenCalledWith('blob:test');
      expect(mocks.createExport).toHaveBeenCalledWith(
        expect.objectContaining({
          generatedBy: reportMetricA.advisor.id,
          reportType: 'COMMERCIAL_PERFORMANCE',
          fileExtension: 'csv',
          mimeType: 'text/csv',
          filename: expect.stringMatching(/^metricas-asesores-\d{4}-\d{2}-\d{2}\.csv$/),
        }),
      );
      expect(mocks.toastSuccess).toHaveBeenCalledWith('reports.exportSuccess');
    } finally {
      Object.defineProperty(window, 'URL', { configurable: true, value: originalUrl });
      click.mockRestore();
    }
  });

  it('does not create an export record when metric loading fails', async () => {
    const user = userEvent.setup();
    mocks.listAdvisorMetrics.mockRejectedValue(new Error('Metrics unavailable'));

    renderExportButton();
    await user.click(screen.getByRole('button', { name: 'reports.exportMetrics' }));

    await waitFor(() => expect(mocks.listAdvisorMetrics).toHaveBeenCalledOnce());
    expect(mocks.createExport).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });
});
