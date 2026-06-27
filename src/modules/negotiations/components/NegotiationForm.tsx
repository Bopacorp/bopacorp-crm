import { CreateNegotiationRequestSchema } from '@bopacorp/shared/crm';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SheetFooter } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Can } from '@/modules/auth/components/Can.js';
import { DatePicker, FormAlert, SearchSelect } from '@/shared/ui';

type FormValues = z.input<typeof CreateNegotiationRequestSchema>;

export type NegotiationFormValues = FormValues;

type ServerFieldError = { field: string; message: string };

interface NegotiationFormProps {
  defaultValues: NegotiationFormValues;
  onSubmit: (values: NegotiationFormValues) => void;
  isPending: boolean;
  error?: string;
  fieldErrors?: ServerFieldError[];
  submitLabel: string;
  onDirtyChange?: (dirty: boolean) => void;
  clientOptions?: { value: string; label: string }[];
  clientSearchValue?: string;
  onClientSearchChange?: (search: string) => void;
  clientLoading?: boolean;
  clientHasMore?: boolean;
  onClientLoadMore?: () => void;
  stateOptions: { id: string; name: string; position: number }[];
  onCreateClient?: () => void;
  showCreateClient?: boolean;
  clientReadOnly?: boolean;
  clientName?: string;
  advisorOptions?: { value: string; label: string }[];
  showAdvisorField?: boolean;
  showIsActive?: boolean;
  stateLabel?: string;
  hideState?: boolean;
}

export function NegotiationForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  fieldErrors,
  submitLabel,
  onDirtyChange,
  clientOptions,
  clientSearchValue,
  onClientSearchChange,
  clientLoading,
  clientHasMore,
  onClientLoadMore,
  stateOptions,
  onCreateClient,
  showCreateClient,
  clientReadOnly,
  clientName,
  advisorOptions,
  showAdvisorField,
  showIsActive,
  stateLabel,
  hideState,
}: NegotiationFormProps) {
  const { t } = useTranslation();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitted, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateNegotiationRequestSchema),
    defaultValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!fieldErrors?.length) return;
    for (const detail of fieldErrors) {
      setError(detail.field as keyof FormValues, { type: 'server', message: detail.message });
    }
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {error && <FormAlert message={error} />}

        <FieldGroup>
          <Field data-invalid={errors.clientId ? true : undefined}>
            <FieldLabel htmlFor="negotiation-client">{t('negotiations.client')}</FieldLabel>
            {clientReadOnly ? (
              <>
                <Input id="negotiation-client" value={clientName} readOnly className="bg-muted" />
                <input type="hidden" {...register('clientId')} />
              </>
            ) : (
              <>
                <Controller
                  control={control}
                  name="clientId"
                  render={({ field }) => (
                    <SearchSelect
                      id="negotiation-client"
                      options={clientOptions ?? []}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={t('negotiations.selectClient')}
                      searchPlaceholder={t('negotiations.searchClient')}
                      emptyMessage={t('negotiations.noClients')}
                      searchValue={clientSearchValue}
                      onSearchChange={onClientSearchChange}
                      loading={clientLoading}
                      hasMore={clientHasMore}
                      onLoadMore={onClientLoadMore}
                    />
                  )}
                />
                {showCreateClient && (
                  <Can permission="business_clients.create">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={onCreateClient}
                    >
                      <Plus data-icon="inline-start" />
                      {t('negotiations.newClientInline')}
                    </Button>
                  </Can>
                )}
              </>
            )}
            <FieldError>{errors.clientId?.message}</FieldError>
          </Field>

          {!hideState && (
            <Field data-invalid={errors.stateId ? true : undefined}>
              <FieldLabel htmlFor="negotiation-state">
                {stateLabel ?? t('negotiations.initialState')}
              </FieldLabel>
              <Controller
                control={control}
                name="stateId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="negotiation-state">
                      <SelectValue placeholder={t('negotiations.selectState')} />
                    </SelectTrigger>
                    <SelectContent>
                      {stateOptions.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.stateId?.message}</FieldError>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="negotiation-start-date">{t('common.startDate')}</FieldLabel>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <DatePicker
                  id="negotiation-start-date"
                  value={field.value ?? ''}
                  onChange={(value) => field.onChange(value || undefined)}
                />
              )}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="negotiation-estimated-close">
              {t('common.estimatedClose')}
            </FieldLabel>
            <Controller
              control={control}
              name="estimatedCloseDate"
              render={({ field }) => (
                <DatePicker
                  id="negotiation-estimated-close"
                  value={field.value ?? ''}
                  onChange={(value) => field.onChange(value || undefined)}
                />
              )}
            />
          </Field>

          <Field data-invalid={errors.observations ? true : undefined}>
            <FieldLabel htmlFor="negotiation-observations">{t('common.observations')}</FieldLabel>
            <Textarea
              id="negotiation-observations"
              {...register('observations', {
                setValueAs: (value) => (value === '' ? undefined : value),
              })}
              placeholder={t('common.additionalNotes')}
              maxLength={500}
            />
            <FieldError>{errors.observations?.message}</FieldError>
          </Field>

          {showAdvisorField && advisorOptions && (
            <Field data-invalid={errors.advisorId ? true : undefined}>
              <FieldLabel htmlFor="negotiation-advisor">{t('common.advisor')}</FieldLabel>
              <Controller
                control={control}
                name="advisorId"
                render={({ field }) => (
                  <SearchSelect
                    id="negotiation-advisor"
                    options={advisorOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={t('common.selectAdvisor')}
                    searchPlaceholder={t('common.searchAdvisor')}
                    emptyMessage={t('common.noAdvisors')}
                  />
                )}
              />
              <FieldError>{errors.advisorId?.message}</FieldError>
            </Field>
          )}

          {!showAdvisorField && <input type="hidden" {...register('advisorId')} />}

          {showIsActive && (
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="negotiation-active">{t('negotiations.activeNeg')}</FieldLabel>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      id="negotiation-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </Field>
          )}
        </FieldGroup>
      </div>

      <SheetFooter>
        <Button type="submit" disabled={isPending || (isSubmitted && !isValid)}>
          {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  );
}
