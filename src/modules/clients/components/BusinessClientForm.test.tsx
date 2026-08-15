import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusinessClientFormValues } from './BusinessClientForm.js';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useAdvisors: vi.fn(),
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

import { BusinessClientForm } from './BusinessClientForm.js';

const defaultValues: BusinessClientFormValues = {
  ruc: '0991234567001',
  businessName: 'Acme North',
  contactName: 'Casey Contact',
  contactPhone: '0991234567',
  contactEmail: 'casey@acme.test',
  address: 'North Avenue',
  activeServicesCount: 3,
  currentMonthlyBilling: 1250,
  advisorId: '00000000-0000-4000-8000-000000000101',
  isActive: true,
};

function renderForm(
  values: BusinessClientFormValues = defaultValues,
  overrides: Partial<ComponentProps<typeof BusinessClientForm>> = {},
) {
  const onSubmit = vi.fn();
  render(
    <BusinessClientForm
      defaultValues={values}
      onSubmit={onSubmit}
      isPending={false}
      submitLabel="common.create"
      {...overrides}
    />,
  );
  return { onSubmit };
}

describe('BusinessClientForm', () => {
  beforeEach(() => {
    mocks.useAuth.mockReturnValue({ hasRole: () => false });
    mocks.useAdvisors.mockReturnValue({
      advisors: [
        {
          userId: defaultValues.advisorId ?? '',
          user: {
            firstName: 'Alex',
            lastName: 'Advisor',
            username: 'advisor.a',
          },
        },
      ],
    });
  });

  it('submits the valid client values with numeric fields preserved', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole('button', { name: 'common.create' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(defaultValues);
  });

  it('blocks submission when required fields are empty', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      ...defaultValues,
      ruc: '',
      businessName: '',
      contactName: '',
    });

    await user.click(screen.getByRole('button', { name: 'common.create' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findAllByText('This field is required')).toHaveLength(2);
  });

  it.each(['123', '099123456700'])('blocks an invalid RUC value: %s', async (ruc) => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ ...defaultValues, ruc });

    await user.click(screen.getByRole('button', { name: 'common.create' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('RUC must be 13 digits')).toBeInTheDocument();
  });

  it.each([
    ['activeServicesCount', -1],
    ['currentMonthlyBilling', -0.01],
  ] as const)('blocks negative %s values', async (field, value) => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ ...defaultValues, [field]: value });

    await user.click(screen.getByRole('button', { name: 'common.create' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hides advisor assignment for advisor users', () => {
    mocks.useAuth.mockReturnValue({ hasRole: (role: string) => role === 'advisor' });

    renderForm();

    expect(document.getElementById('advisorId')).not.toBeInTheDocument();
  });

  it('shows server field errors without replacing client validation', async () => {
    renderForm(defaultValues, {
      serverFieldErrors: [{ field: 'ruc', message: 'RUC already exists' }],
    });

    expect(await screen.findByText('RUC already exists')).toBeInTheDocument();
  });

  it('keeps numeric input values numeric after user edits', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();
    const servicesInput = document.getElementById('activeServicesCount');
    expect(servicesInput).toBeInTheDocument();

    await user.clear(servicesInput as HTMLInputElement);
    await user.type(servicesInput as HTMLInputElement, '8');
    await user.click(screen.getByRole('button', { name: 'common.create' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ activeServicesCount: 8 });
    expect(typeof onSubmit.mock.calls[0][0].activeServicesCount).toBe('number');
  });
});
