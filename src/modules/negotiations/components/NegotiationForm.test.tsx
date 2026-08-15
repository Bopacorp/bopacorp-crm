import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NegotiationFormValues } from './NegotiationForm.js';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

import { NegotiationForm } from './NegotiationForm.js';

const defaultValues: NegotiationFormValues = {
  clientId: '00000000-0000-4000-8000-000000000201',
  advisorId: '00000000-0000-4000-8000-000000000101',
  startDate: '2026-01-03',
  estimatedCloseDate: '2026-01-31',
  observations: 'Initial discovery completed.',
  isActive: true,
};

function renderForm(
  values: NegotiationFormValues = defaultValues,
  overrides: Partial<ComponentProps<typeof NegotiationForm>> = {},
) {
  const onSubmit = vi.fn();
  render(
    <NegotiationForm
      defaultValues={values}
      onSubmit={onSubmit}
      isPending={false}
      submitLabel="common.create"
      stateOptions={[]}
      clientReadOnly
      clientName="Acme North"
      {...overrides}
    />,
  );
  return { onSubmit };
}

describe('NegotiationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits a valid negotiation with dates and observations', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole('button', { name: 'common.create' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual(expect.objectContaining(defaultValues));
  });

  it('rejects missing client and advisor identifiers', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ ...defaultValues, clientId: '', advisorId: '' });

    await user.click(screen.getByRole('button', { name: 'common.create' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('This field is required')).toBeInTheDocument();
  });

  it('exposes advisor assignment only when the parent enables it', () => {
    renderForm(defaultValues, {
      clientReadOnly: false,
      clientOptions: [{ value: defaultValues.clientId, label: 'Acme North' }],
      showAdvisorField: true,
      advisorOptions: [
        { value: defaultValues.advisorId, label: 'Alex Advisor' },
        { value: '00000000-0000-4000-8000-000000000102', label: 'Blair Advisor' },
      ],
    });

    expect(document.getElementById('negotiation-advisor')).toBeInTheDocument();
    expect(screen.getByText('Acme North')).toBeInTheDocument();
  });

  it('renders server-side field errors', async () => {
    renderForm(defaultValues, {
      fieldErrors: [{ field: 'observations', message: 'Observation is not allowed.' }],
    });

    expect(await screen.findByText('Observation is not allowed.')).toBeInTheDocument();
  });
});
