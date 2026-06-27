import { CreateBusinessClientRequestSchema } from '@bopacorp/shared/crm';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SheetFooter } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { useAdvisors } from '@/modules/org/hooks/useAdvisors.js';
import type { ApiErrorDetail } from '@/services/api.js';
import { FormAlert, SearchSelect } from '@/shared/ui';

type FormValues = z.input<typeof CreateBusinessClientRequestSchema>;

export type BusinessClientFormValues = FormValues;

interface BusinessClientFormProps {
  defaultValues: BusinessClientFormValues;
  onSubmit: (values: BusinessClientFormValues) => Promise<void> | void;
  isPending: boolean;
  error?: string;
  serverFieldErrors?: ApiErrorDetail[];
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

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      *
    </span>
  );
}

export function BusinessClientForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  serverFieldErrors,
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
    setValue,
    setError,
    clearErrors,
    formState: { errors, isDirty, isSubmitted, isValid, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateBusinessClientRequestSchema),
    defaultValues,
    mode: 'onTouched',
  });
  const isBusy = isPending || isSubmitting;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    clearErrors();

    if (serverFieldErrors?.length) {
      for (const detail of serverFieldErrors) {
        setError(detail.field as keyof FormValues, {
          type: 'server',
          message: detail.message,
        });
      }
    } else if (error) {
      setError('root', { type: 'server', message: error });
    }
  }, [clearErrors, error, serverFieldErrors, setError]);

  const advisorOptions = useMemo(
    () =>
      advisors
        .map((emp) => ({ value: emp.userId, label: employeeName(emp) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [advisors],
  );

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 overflow-y-auto p-4">
        {errors.root?.message && <FormAlert message={errors.root.message} />}
        <FieldGroup>
          <Field data-invalid={errors.ruc ? true : undefined}>
            <FieldLabel htmlFor="ruc">
              {t('clients.ruc')} <RequiredMark />
            </FieldLabel>
            {rucReadOnly ? (
              <Input id="ruc" {...register('ruc')} readOnly className="bg-muted" />
            ) : (
              <Input
                id="ruc"
                {...register('ruc')}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0991234567001"
                maxLength={13}
                disabled={isBusy}
                onChange={(event) => {
                  const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 13);
                  setValue('ruc', digitsOnly, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
              />
            )}
            <FieldError>{errors.ruc?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.businessName ? true : undefined}>
            <FieldLabel htmlFor="businessName">
              {t('clients.commercialName')} <RequiredMark />
            </FieldLabel>
            <Input
              id="businessName"
              {...register('businessName')}
              maxLength={200}
              disabled={isBusy}
            />
            <FieldError>{errors.businessName?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.contactName ? true : undefined}>
            <FieldLabel htmlFor="contactName">
              {t('common.contact')} <RequiredMark />
            </FieldLabel>
            <Input
              id="contactName"
              {...register('contactName')}
              maxLength={200}
              disabled={isBusy}
            />
            <FieldError>{errors.contactName?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.contactPhone ? true : undefined}>
            <FieldLabel htmlFor="contactPhone">
              {t('common.phone')}{' '}
              <span className="text-muted-foreground">({t('common.optional')})</span>
            </FieldLabel>
            <Input
              id="contactPhone"
              type="tel"
              autoComplete="tel"
              {...register('contactPhone', {
                setValueAs: (value) => (value === '' ? undefined : value),
              })}
              maxLength={10}
              disabled={isBusy}
            />
            <FieldError>{errors.contactPhone?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.contactEmail ? true : undefined}>
            <FieldLabel htmlFor="contactEmail">
              {t('common.email')}{' '}
              <span className="text-muted-foreground">({t('common.optional')})</span>
            </FieldLabel>
            <Input
              id="contactEmail"
              type="email"
              autoComplete="email"
              {...register('contactEmail', {
                setValueAs: (value) => (value === '' ? undefined : value),
              })}
              maxLength={150}
              disabled={isBusy}
            />
            <FieldError>{errors.contactEmail?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.address ? true : undefined}>
            <FieldLabel htmlFor="address">
              {t('common.address')}{' '}
              <span className="text-muted-foreground">({t('common.optional')})</span>
            </FieldLabel>
            <Textarea
              id="address"
              {...register('address', {
                setValueAs: (value) => (value === '' ? undefined : value),
              })}
              maxLength={255}
              disabled={isBusy}
            />
            <FieldError>{errors.address?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.activeServicesCount ? true : undefined}>
            <FieldLabel htmlFor="activeServicesCount">
              {t('clients.lines')} <RequiredMark />
            </FieldLabel>
            <Input
              id="activeServicesCount"
              type="number"
              min={0}
              step={1}
              {...register('activeServicesCount', {
                setValueAs: (value) => {
                  if (value === '') return undefined;
                  const parsed = Number(value);
                  return Number.isFinite(parsed) ? parsed : undefined;
                },
              })}
              disabled={isBusy}
            />
            <FieldError>{errors.activeServicesCount?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.currentMonthlyBilling ? true : undefined}>
            <FieldLabel htmlFor="currentMonthlyBilling">
              {t('clients.monthlyBilling')} <RequiredMark />
            </FieldLabel>
            <Input
              id="currentMonthlyBilling"
              type="number"
              min={0}
              step={0.01}
              {...register('currentMonthlyBilling', {
                setValueAs: (value) => {
                  if (value === '') return undefined;
                  const parsed = Number(value);
                  return Number.isFinite(parsed) ? parsed : undefined;
                },
              })}
              disabled={isBusy}
            />
            <FieldError>{errors.currentMonthlyBilling?.message}</FieldError>
          </Field>

          {canAssignAdvisor && (
            <Field>
              <FieldLabel htmlFor="advisorId">
                {t('common.advisor')}{' '}
                <span className="text-muted-foreground">({t('common.optional')})</span>
              </FieldLabel>
              <Controller
                control={control}
                name="advisorId"
                render={({ field }) => (
                  <SearchSelect
                    id="advisorId"
                    options={advisorOptions}
                    value={field.value ?? ''}
                    onValueChange={(value) => field.onChange(value === '' ? undefined : value)}
                    disabled={isBusy}
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
                <FieldLabel htmlFor="isActive">{t('common.active')}</FieldLabel>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isBusy}
                    />
                  )}
                />
              </div>
            </Field>
          )}
        </FieldGroup>
      </div>

      <SheetFooter>
        <Button type="submit" disabled={isBusy || (isSubmitted && !isValid)}>
          {isBusy && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  );
}
