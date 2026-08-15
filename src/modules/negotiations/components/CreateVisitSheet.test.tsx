import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { advisorA, clientA, negotiationA, visitType } from '@/test/crm-fixtures.js';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useAdvisors: vi.fn(),
  useVisitTypes: vi.fn(),
  createVisit: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
vi.mock('@/modules/auth/context/AuthContext.js', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/modules/org/hooks/useAdvisors.js', () => ({ useAdvisors: mocks.useAdvisors }));
vi.mock('../hooks/useVisitTypes.js', () => ({ useVisitTypes: mocks.useVisitTypes }));
vi.mock('../negotiations.service.js', () => ({ createVisit: mocks.createVisit }));
vi.mock('@/components/ui/select.js', () => {
  function Select({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) {
    return (
      <select id="visit-type" value={value} onChange={(event) => onValueChange(event.target.value)}>
        {children}
      </select>
    );
  }

  function SelectContent({ children }: { children: ReactNode }) {
    return <>{children}</>;
  }

  function SelectItem({ value, children }: { value: string; children: ReactNode }) {
    return <option value={value}>{children}</option>;
  }

  return {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger: () => null,
    SelectValue: () => null,
  };
});

import { CreateVisitSheet } from './CreateVisitSheet.js';

function renderSheet() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <CreateVisitSheet
        open
        onOpenChange={onOpenChange}
        negotiationId={negotiationA.id}
        clientId={clientA.id}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>,
  );

  return { onOpenChange, onSuccess };
}

function selectVisitType() {
  fireEvent.change(document.getElementById('visit-type') as HTMLSelectElement, {
    target: { value: visitType.id },
  });
}

describe('CreateVisitSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({
      user: { id: advisorA.userId },
      hasRole: (role: string) => role === 'advisor',
    });
    mocks.useAdvisors.mockReturnValue({ advisors: [advisorA] });
    mocks.useVisitTypes.mockReturnValue({ visitTypes: [visitType] });
    mocks.createVisit.mockResolvedValue({ id: 'visit-created' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('submits GPS coordinates and accuracy when the browser grants location', async () => {
    const getCurrentPosition = vi.fn((onSuccess: PositionCallback) => {
      onSuccess({
        coords: {
          latitude: -2.1894,
          longitude: -79.8891,
          accuracy: 8,
        } as GeolocationCoordinates,
        timestamp: Date.now(),
      } as GeolocationPosition);
    });
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    const user = userEvent.setup();
    const { onSuccess } = renderSheet();

    selectVisitType();
    await user.type(
      document.getElementById('visit-observations') as HTMLTextAreaElement,
      'Customer requested a pricing follow-up.',
    );
    await user.click(screen.getByRole('button', { name: 'visits.register' }));

    await waitFor(() => expect(mocks.createVisit).toHaveBeenCalledTimes(1));
    expect(mocks.createVisit).toHaveBeenCalledWith(
      expect.objectContaining({
        negotiationId: negotiationA.id,
        clientId: clientA.id,
        advisorId: advisorA.userId,
        visitTypeId: visitType.id,
        observations: 'Customer requested a pricing follow-up.',
        gpsLatitude: -2.1894,
        gpsLongitude: -79.8891,
        gpsAccuracy: 8,
      }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('continues without GPS when permission is denied', async () => {
    const getCurrentPosition = vi.fn(
      (_onSuccess: PositionCallback, onError: PositionErrorCallback) => {
        onError({ code: 1, message: 'Permission denied' } as GeolocationPositionError);
      },
    );
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    const user = userEvent.setup();
    renderSheet();

    selectVisitType();
    await user.type(
      document.getElementById('visit-observations') as HTMLTextAreaElement,
      'GPS unavailable.',
    );
    await user.click(screen.getByRole('button', { name: 'visits.register' }));

    await waitFor(() => expect(mocks.createVisit).toHaveBeenCalledTimes(1));
    expect(mocks.createVisit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        observations: 'GPS unavailable.',
        gpsLatitude: undefined,
        gpsLongitude: undefined,
        gpsAccuracy: undefined,
        gpsTimestamp: undefined,
      }),
    );
  });

  it('requires observations before creating a visit', async () => {
    const getCurrentPosition = vi.fn();
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    const user = userEvent.setup();
    renderSheet();

    selectVisitType();
    await user.click(screen.getByRole('button', { name: 'visits.register' }));

    expect(mocks.createVisit).not.toHaveBeenCalled();
    expect(await screen.findByText('This field is required')).toBeInTheDocument();
  });
});
