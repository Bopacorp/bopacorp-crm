import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  reportPageResult,
  reportPerformanceA,
  reportPerformanceB,
  reportTarget,
} from '@/test/crm-phase5-fixtures.js';

const mocks = vi.hoisted(() => ({
  useAdvisorPerformance: vi.fn(),
  useReportExports: vi.fn(),
  useSalesTargets: vi.fn(),
  useTeamAdvisors: vi.fn(),
  updateTarget: vi.fn(),
  useAuth: vi.fn(),
  canEdit: true,
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
vi.mock('@/modules/auth/context/AuthContext.js', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/modules/auth/components/Can.js', () => ({
  Can: ({ children }: { children: ReactNode }) => (mocks.canEdit ? children : null),
}));
vi.mock('../components/ExportButton.js', () => ({
  ExportButton: () => <button type="button">reports.generateReport</button>,
}));
vi.mock('../components/PerformanceChart.js', () => ({
  PerformanceChart: () => <div data-testid="performance-chart">performance-chart</div>,
}));
vi.mock('../hooks/useAdvisorPerformance.js', () => ({
  useAdvisorPerformance: mocks.useAdvisorPerformance,
}));
vi.mock('../hooks/useReportExports.js', () => ({ useReportExports: mocks.useReportExports }));
vi.mock('../hooks/useSalesTargets.js', () => ({ useSalesTargets: mocks.useSalesTargets }));
vi.mock('../hooks/useTeamAdvisors.js', () => ({ useTeamAdvisors: mocks.useTeamAdvisors }));
vi.mock('../reports.service.js', () => ({ updateTarget: mocks.updateTarget }));
vi.mock('@/shared/hooks/usePageReset.js', () => ({ usePageReset: vi.fn() }));
vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="check-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
  Pencil: () => <span data-testid="pencil-icon" />,
  Users: () => <span data-testid="users-icon" />,
  X: () => <span data-testid="x-icon" />,
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
vi.mock('@/components/ui/card.js', () => ({
  Card: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));
vi.mock('@/components/ui/field.js', () => ({
  Field: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FieldLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock('@/components/ui/input.js', () => ({
  Input: (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
vi.mock('@/components/ui/badge.js', () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock('@/components/ui/skeleton.js', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));
vi.mock('@/components/ui/tabs.js', () => ({
  Tabs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
}));
vi.mock('@/shared/ui', () => ({
  EmptyState: ({ title, description }: { title: ReactNode; description: ReactNode }) => (
    <div>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
  EntityTable: ({
    data,
    columns,
    keyExtractor,
  }: {
    data: readonly unknown[];
    columns: Array<{ header: ReactNode; accessor: (item: never) => ReactNode }>;
    keyExtractor: (item: never) => string;
  }) => (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={String(column.header)}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={keyExtractor(item as never)}>
            {columns.map((column) => (
              <td key={String(column.header)}>{column.accessor(item as never)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  ErrorState: ({ onRetry }: { onRetry: () => void }) => (
    <button type="button" onClick={onRetry}>
      reports.error
    </button>
  ),
  FilterBar: ({
    searchValue,
    onSearchChange,
    searchPlaceholder,
  }: {
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder: string;
  }) => (
    <input
      aria-label="export-search"
      placeholder={searchPlaceholder}
      value={searchValue}
      onChange={(event) => onSearchChange(event.target.value)}
    />
  ),
  KpiCard: ({ title, value }: { title: ReactNode; value: ReactNode }) => (
    <div data-testid={`kpi-${String(title)}`}>
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
  PaginationFooter: () => <div>pagination</div>,
  SectionHeader: ({ title, actions }: { title: ReactNode; actions: ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
  TableSkeleton: () => <div data-testid="table-skeleton" />,
}));

import ReportsPage from './ReportsPage.js';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReportsPage />
    </QueryClientProvider>,
  );
}

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canEdit = true;
    mocks.useAuth.mockReturnValue({ user: { id: '00000000-0000-4000-8000-000000000104' } });
    mocks.useTeamAdvisors.mockReturnValue({ isSupervisor: false });
    mocks.useAdvisorPerformance.mockReturnValue({
      data: [reportPerformanceA, reportPerformanceB],
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    });
    mocks.useSalesTargets.mockReturnValue({ data: [reportTarget], isLoading: false });
    mocks.useReportExports.mockReturnValue({
      data: reportPageResult,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    });
    mocks.updateTarget.mockResolvedValue(reportTarget);
  });

  it('renders advisor KPIs, performance, targets, and export history', () => {
    renderPage();

    expect(screen.getByTestId('kpi-reports.totalAdvisors')).toHaveTextContent('2');
    expect(screen.getByTestId('kpi-reports.meetingTarget')).toHaveTextContent('1 / 2');
    expect(screen.getByTestId('kpi-reports.avgCloses')).toHaveTextContent('4');
    expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
    expect(screen.getByText('reports.tierConfig')).toBeInTheDocument();
    expect(screen.getByText('Commercial performance')).toBeInTheDocument();
  });

  it('passes supervisor scope and inclusive date filters to the performance query', async () => {
    const supervisorId = '00000000-0000-4000-8000-000000000103';
    mocks.useAuth.mockReturnValue({ user: { id: supervisorId } });
    mocks.useTeamAdvisors.mockReturnValue({ isSupervisor: true });

    renderPage();

    expect(mocks.useAdvisorPerformance).toHaveBeenLastCalledWith({ supervisorId });
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-02-01' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-02-28' } });

    await waitFor(() =>
      expect(mocks.useAdvisorPerformance).toHaveBeenLastCalledWith({
        supervisorId,
        dateFrom: '2026-02-01',
        dateTo: '2026-02-28',
      }),
    );
  });

  it('hides target editing without permission and updates a target when authorized', async () => {
    mocks.canEdit = false;
    renderPage();
    expect(screen.queryByTestId('pencil-icon')).not.toBeInTheDocument();

    mocks.canEdit = true;
    renderPage();
    const editButton = screen.getByTestId('pencil-icon').closest('button');
    expect(editButton).not.toBeNull();
    fireEvent.click(editButton as HTMLButtonElement);

    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numberInputs[0], { target: { value: '1500' } });
    fireEvent.click(screen.getByTestId('check-icon').closest('button') as HTMLButtonElement);

    await waitFor(() =>
      expect(mocks.updateTarget).toHaveBeenCalledWith(reportTarget.id, {
        minBilling: 1500,
        maxBilling: null,
        minCloses: reportTarget.minCloses,
      }),
    );
  });

  it('shows the no-performance state when the filtered result is empty', () => {
    mocks.useAdvisorPerformance.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('reports.noPerformance')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-reports.totalAdvisors')).toHaveTextContent('0');
  });

  it('filters export history by title', () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('export-search'), { target: { value: 'missing' } });

    expect(screen.getByText('common.noResults')).toBeInTheDocument();
    expect(screen.queryByText('Commercial performance')).not.toBeInTheDocument();
  });
});
