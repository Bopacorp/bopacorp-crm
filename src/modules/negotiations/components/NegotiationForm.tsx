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

const NegotiationFormSchema = z.object({
  clientId: z.string().min(1, 'Requerido'),
  stateId: z.string().min(1, 'Requerido'),
  advisorId: z.string(),
  startDate: z.string(),
  estimatedCloseDate: z.string(),
  observations: z.string(),
  isActive: z.boolean(),
});

type FormValues = z.input<typeof NegotiationFormSchema>;

export type NegotiationFormValues = FormValues;

interface NegotiationFormProps {
  defaultValues: NegotiationFormValues;
  onSubmit: (values: NegotiationFormValues) => void;
  isPending: boolean;
  error?: string;
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
}

export function NegotiationForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
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
}: NegotiationFormProps) {
  const { t } = useTranslation();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(NegotiationFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {error && <FormAlert message={error} />}

        <FieldGroup>
          <Field data-invalid={errors.clientId ? true : undefined}>
            <FieldLabel>{t('negotiations.client')}</FieldLabel>
            {clientReadOnly ? (
              <Input value={clientName} readOnly className="bg-muted" />
            ) : (
              <>
                <Controller
                  control={control}
                  name="clientId"
                  render={({ field }) => (
                    <SearchSelect
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

          <Field data-invalid={errors.stateId ? true : undefined}>
            <FieldLabel>{stateLabel ?? t('negotiations.initialState')}</FieldLabel>
            <Controller
              control={control}
              name="stateId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
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

          <Field>
            <FieldLabel>{t('common.startDate')}</FieldLabel>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
            />
          </Field>

          <Field>
            <FieldLabel>{t('common.estimatedClose')}</FieldLabel>
            <Controller
              control={control}
              name="estimatedCloseDate"
              render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
            />
          </Field>

          <Field>
            <FieldLabel>{t('common.observations')}</FieldLabel>
            <Textarea
              {...register('observations')}
              placeholder={t('common.additionalNotes')}
              maxLength={500}
            />
          </Field>

          {showAdvisorField && advisorOptions && (
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
                <FieldLabel>{t('negotiations.activeNeg')}</FieldLabel>
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
