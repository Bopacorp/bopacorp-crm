import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { VacancyFormValues } from './VacancyForm.js';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('lucide-react', () => ({ Loader2: () => <span data-testid="loader" /> }));
vi.mock('@/components/ui/button.js', () => ({
  Button: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock('@/components/ui/field.js', () => ({
  Field: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FieldError: ({ children }: { children: ReactNode }) => <div role="alert">{children}</div>,
  FieldGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FieldLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock('@/components/ui/input.js', () => ({
  Input: (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
vi.mock('@/components/ui/sheet.js', () => ({
  SheetFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/switch.js', () => ({
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked: boolean;
    onCheckedChange: (value: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
    />
  ),
}));
vi.mock('@/components/ui/textarea.js', () => ({
  Textarea: (props: InputHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));
vi.mock('@/shared/ui', () => ({
  DateTimePicker: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <input
      data-testid="date-picker"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
  FormAlert: ({ message }: { message: string }) => <div role="alert">{message}</div>,
}));

import { VacancyForm } from './VacancyForm.js';

const defaultValues: VacancyFormValues = {
  title: 'Sales Advisor',
  description: 'Help customers.',
  requirements: 'Customer service experience.',
  isActive: true,
  isPublished: true,
  publicationDate: undefined,
  closingDate: undefined,
};

function renderForm(values: VacancyFormValues = defaultValues, onSubmit = vi.fn()) {
  render(
    <VacancyForm
      defaultValues={values}
      onSubmit={onSubmit}
      isPending={false}
      submitLabel="common.save"
    />,
  );
  return onSubmit;
}

describe('VacancyForm', () => {
  it('submits valid values and assigns a publication date when publishing without one', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sales Advisor',
        isPublished: true,
        publicationDate: expect.any(String),
        closingDate: undefined,
      }),
    );
  });

  it('rejects a closing date earlier than the publication date', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm({
      ...defaultValues,
      isPublished: false,
      publicationDate: '2026-03-10T00:00:00.000Z',
      closingDate: '2026-03-01T00:00:00.000Z',
    });
    const dates = screen.getAllByTestId('date-picker');
    expect(dates).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
  });

  it('updates date and boolean controls through their controlled fields', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm({ ...defaultValues, isPublished: false });
    const dates = screen.getAllByTestId('date-picker');

    fireEvent.change(dates[0], { target: { value: '2026-03-01T00:00:00.000Z' } });
    await user.click(screen.getAllByRole('switch')[1]);
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        isPublished: true,
        publicationDate: '2026-03-01T00:00:00.000Z',
      }),
    );
  });
});
