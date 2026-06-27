import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SheetFooter } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { useAdvisors } from '@/modules/org/hooks/useAdvisors.js';
import { FormAlert, SearchSelect } from '@/shared/ui';

const BusinessClientFormSchema = z.object({
  ruc: z.string().min(1, 'Requerido'),
  businessName: z.string().min(1, 'Requerido'),
  contactName: z.string().min(1, 'Requerido'),
  contactPhone: z.string(),
  contactEmail: z.string().email('Email inválido').or(z.literal('')),
  address: z.string(),
  advisorId: z.string(),
  isActive: z.boolean(),
});

type FormValues = z.input<typeof BusinessClientFormSchema>;

export type BusinessClientFormValues = FormValues;

interface BusinessClientFormProps {
  defaultValues: BusinessClientFormValues;
  onSubmit: (values: BusinessClientFormValues) => void;
  isPending: boolean;
  error?: string;
  submitLabel: string;
  rucReadOnly?: boolean;
  showIsActive?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}

function employeeName(emp: {
  user: { firstName: string | null; lastName: string | null; username: string };
}) {
  return emp.user.firstName && emp.user.lastName
    ? `${emp.user.firstName} ${emp.user.lastName}`
    : emp.user.username;
}

export function BusinessClientForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  submitLabel,
  rucReadOnly,
  showIsActive,
  onDirtyChange,
}: BusinessClientFormProps) {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canAssignAdvisor = !hasRole('advisor');
  const { advisors } = useAdvisors();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(BusinessClientFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const advisorOptions = useMemo(
    () =>
      advisors
        .map((emp) => ({ value: emp.userId, label: employeeName(emp) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [advisors],
  );

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values))}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 overflow-y-auto p-4">
        {error && <FormAlert message={error} />}

        <FieldGroup>
          <Field data-invalid={errors.ruc ? true : undefined}>
            <FieldLabel>{t('clients.ruc')}</FieldLabel>
            {rucReadOnly ? (
              <Input value={watch('ruc')} readOnly className="bg-muted" />
            ) : (
              <Input {...register('ruc')} placeholder="0991234567001" maxLength={13} />
            )}
            <FieldError>{errors.ruc?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.businessName ? true : undefined}>
            <FieldLabel>{t('clients.commercialName')}</FieldLabel>
            <Input {...register('businessName')} maxLength={50} />
            <FieldError>{errors.businessName?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.contactName ? true : undefined}>
            <FieldLabel>{t('common.contact')}</FieldLabel>
            <Input {...register('contactName')} maxLength={50} />
            <FieldError>{errors.contactName?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel>{t('common.phone')}</FieldLabel>
            <Input {...register('contactPhone')} maxLength={10} />
          </Field>

          <Field data-invalid={errors.contactEmail ? true : undefined}>
            <FieldLabel>{t('common.email')}</FieldLabel>
            <Input type="email" {...register('contactEmail')} maxLength={80} />
            <FieldError>{errors.contactEmail?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel>{t('common.address')}</FieldLabel>
            <Textarea {...register('address')} maxLength={150} />
          </Field>

          {canAssignAdvisor && (
            <Field>
              <FieldLabel>{t('common.advisor')}</FieldLabel>
              <Controller
                control={control}
                name="advisorId"
                render={({ field }) => (
                  <SearchSelect
                    options={advisorOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={t('common.selectAdvisor')}
                    searchPlaceholder={t('common.searchAdvisor')}
                    emptyMessage={t('common.noAdvisors')}
                  />
                )}
              />
            </Field>
          )}

          {showIsActive && (
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>{t('common.active')}</FieldLabel>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </Field>
          )}
        </FieldGroup>
      </div>

      <SheetFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  );
}
