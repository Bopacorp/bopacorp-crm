import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  ButtonHTMLAttributes,
  ComponentProps,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import { forwardRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CatalogItemForm,
  type CatalogItemFormValues,
  EMPTY_FORM_VALUES,
} from './CatalogItemForm.js';

const mocks = vi.hoisted(() => ({
  useCategoryOptions: vi.fn(),
  useItemTypeOptions: vi.fn(),
  useContractTypeOptions: vi.fn(),
  useSegmentOptions: vi.fn(),
  useTierOptions: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../hooks/useCategoryOptions.js', () => ({
  useCategoryOptions: mocks.useCategoryOptions,
}));
vi.mock('../hooks/useItemTypeOptions.js', () => ({
  useItemTypeOptions: mocks.useItemTypeOptions,
}));
vi.mock('../hooks/useContractTypeOptions.js', () => ({
  useContractTypeOptions: mocks.useContractTypeOptions,
}));
vi.mock('../hooks/useSegmentOptions.js', () => ({
  useSegmentOptions: mocks.useSegmentOptions,
}));
vi.mock('../hooks/useTierOptions.js', () => ({
  useTierOptions: mocks.useTierOptions,
}));

vi.mock('@/components/ui/button.js', () => ({
  Button: ({
    children,
    type = 'button',
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) => (
    <button type={type} {...props}>
      {children}
    </button>
  ),
}));
vi.mock('@/components/ui/field.js', () => ({
  Field: ({ children, ...props }: { children: ReactNode }) => <div {...props}>{children}</div>,
  FieldError: ({ children }: { children?: ReactNode }) => <div role="alert">{children}</div>,
  FieldGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FieldLabel: ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));
vi.mock('@/components/ui/input.js', () => ({
  Input: forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
    <input ref={ref} {...props} />
  )),
}));
vi.mock('@/components/ui/textarea.js', () => ({
  Textarea: forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
    (props, ref) => <textarea ref={ref} {...props} />,
  ),
}));
vi.mock('@/components/ui/select.js', () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
    <button type="button" role="option" data-value={value}>
      {children}
    </button>
  ),
  SelectTrigger: ({ children, id }: { children: ReactNode; id?: string }) => (
    <button type="button" id={id}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));
vi.mock('@/components/ui/switch.js', () => ({
  Switch: ({
    id,
    checked,
    onCheckedChange,
  }: {
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-label={id}
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
    />
  ),
}));
vi.mock('@/components/ui/toggle-group.js', () => ({
  ToggleGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ToggleGroupItem: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));
vi.mock('@/shared/ui', () => ({
  FormAlert: ({ message }: { message: string }) => <div role="alert">{message}</div>,
}));
vi.mock('@/components/ui/loader.js', () => ({ Loader2: () => <span /> }));
vi.mock('lucide-react', () => ({ Loader2: () => <span /> }));
vi.mock('./detail-fields/BenefitsSection.js', () => ({
  BenefitsSection: () => <div data-testid="benefits-section" />,
}));
vi.mock('./detail-fields/ConditionsSection.js', () => ({
  ConditionsSection: () => <div data-testid="conditions-section" />,
}));
vi.mock('./detail-fields/TypeSpecificFields.js', () => ({
  TypeSpecificFields: ({ itemTypeCode }: { itemTypeCode: string }) => (
    <div data-testid="type-specific-fields">{itemTypeCode}</div>
  ),
}));

import { PHASE6_TEST_IDS } from '@/test/crm-phase6-fixtures.js';

const validValues: CatalogItemFormValues = {
  ...EMPTY_FORM_VALUES,
  name: 'Business voice',
  description: 'A business voice product.',
  price: '29.99',
  categoryId: PHASE6_TEST_IDS.category,
  itemTypeId: PHASE6_TEST_IDS.itemType,
  contractTypeId: PHASE6_TEST_IDS.contractType,
  segmentId: PHASE6_TEST_IDS.segment,
  tierId: PHASE6_TEST_IDS.tier,
  voiceDetails: {
    gigasStructural: '10',
    gigasLoyalty: '5',
    minutesNational: '',
    minutesLdi: '20',
    sms: '100',
    hasUnlimitedMinutes: true,
    hasUnlimitedWhatsapp: true,
    hasSocialNetworks: false,
    includedRoamingGb: '1.5',
  },
};

function renderForm(overrides: Partial<ComponentProps<typeof CatalogItemForm>> = {}) {
  const onSubmit = vi.fn();
  render(
    <CatalogItemForm
      defaultValues={validValues}
      onSubmit={onSubmit}
      isPending={false}
      submitLabel="common.save"
      mode="create"
      {...overrides}
    />,
  );
  return { onSubmit };
}

describe('CatalogItemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const option = (value: string, label: string, code?: string) => ({ value, label, code });
    mocks.useCategoryOptions.mockReturnValue({
      options: [option(PHASE6_TEST_IDS.category, 'Business')],
    });
    mocks.useItemTypeOptions.mockReturnValue({
      options: [option(PHASE6_TEST_IDS.itemType, 'Voice', 'voice')],
    });
    mocks.useContractTypeOptions.mockReturnValue({
      options: [option(PHASE6_TEST_IDS.contractType, 'Postpaid')],
    });
    mocks.useSegmentOptions.mockReturnValue({
      options: [option(PHASE6_TEST_IDS.segment, 'Business')],
    });
    mocks.useTierOptions.mockReturnValue({ options: [option(PHASE6_TEST_IDS.tier, 'Standard')] });
  });

  it('renders configured sections and submits valid values with the item type code', async () => {
    const user = userEvent.setup();
    const onDirtyChange = vi.fn();
    const { onSubmit } = renderForm({ onDirtyChange });

    expect(screen.getByText('catalog.generalInfo')).toBeInTheDocument();
    expect(screen.getByTestId('type-specific-fields')).toHaveTextContent('voice');
    expect(screen.getByTestId('benefits-section')).toBeInTheDocument();
    expect(screen.getByTestId('conditions-section')).toBeInTheDocument();
    expect(onDirtyChange).toHaveBeenCalledWith(false);

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validValues.name,
        price: 29.99,
        permanenceMonths: 0,
        voiceDetails: expect.objectContaining({
          gigasStructural: 10,
          minutesNational: undefined,
        }),
      }),
      'voice',
    );
  });

  it('blocks submission when general required fields are missing', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      defaultValues: { ...EMPTY_FORM_VALUES, itemTypeId: '', voiceDetails: null },
    });

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('renders edit controls, server errors, cancellation, and pending state', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const { onSubmit } = renderForm({
      mode: 'edit',
      error: 'Catalog item could not be saved',
      onCancel,
    });

    expect(screen.getByText('Catalog item could not be saved')).toBeInTheDocument();
    expect(screen.getAllByRole('switch')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables submission while a save is pending', () => {
    renderForm({ isPending: true });

    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
  });
});
