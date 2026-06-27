import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/lib/query-keys.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { useAdvisors } from '@/modules/org/hooks/useAdvisors.js';
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DateTimePicker, DiscardChangesDialog, FormAlert, SearchSelect } from '@/shared/ui';
import { useVisitTypes } from '../hooks/useVisitTypes.js';
import { createVisit } from '../negotiations.service.js';

const CreateVisitSchema = z.object({
  visitTypeId: z.string().uuid('Selecciona un tipo de visita'),
  advisorId: z.string().uuid('Selecciona un asesor'),
  visitDate: z.string().min(1, 'Selecciona fecha y hora'),
  observations: z.string().min(1, 'Las observaciones son requeridas').max(1000),
  gpsLatitude: z.coerce.number().min(-90).max(90).optional().or(z.literal('')),
  gpsLongitude: z.coerce.number().min(-180).max(180).optional().or(z.literal('')),
});

type FormValues = z.input<typeof CreateVisitSchema>;

interface CreateVisitSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiationId: string;
  clientId: string;
  onSuccess: () => void;
}

export function CreateVisitSheet({
  open,
  onOpenChange,
  negotiationId,
  clientId,
  onSuccess,
}: CreateVisitSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [key, setKey] = useState(0);
  const [error, setError] = useState('');
  const gpsAccuracyRef = useRef<number | undefined>(undefined);

  const forceClose = useCallback(() => {
    setKey((k) => k + 1);
    setError('');
    onOpenChange(false);
  }, [onOpenChange]);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose: forceClose });

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      guardedAction('close');
    } else {
      onOpenChange(true);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const lat = typeof data.gpsLatitude === 'number' ? data.gpsLatitude : undefined;
      const lng = typeof data.gpsLongitude === 'number' ? data.gpsLongitude : undefined;
      await createVisit({
        negotiationId,
        clientId,
        advisorId: data.advisorId,
        visitTypeId: data.visitTypeId,
        visitDate: data.visitDate,
        observations: data.observations,
        gpsLatitude: lat,
        gpsLongitude: lng,
        gpsAccuracy: lat ? gpsAccuracyRef.current : undefined,
        gpsTimestamp: lat ? new Date().toISOString() : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
      toast.success(t('visits.registered'));
      dirtyRef.current = false;
      forceClose();
      onSuccess();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details?.length) {
        setError('');
        return;
      }
      setError(getErrorMessage(err));
    },
  });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('visits.register')}</SheetTitle>
        </SheetHeader>
        <CreateVisitForm
          key={key}
          onSubmit={(data) => mutation.mutate(data)}
          isPending={mutation.isPending}
          error={error}
          onDirtyChange={handleDirtyChange}
          gpsAccuracyRef={gpsAccuracyRef}
        />
      </SheetContent>

      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />
    </Sheet>
  );
}

function advisorLabel(adv: {
  user: { firstName: string | null; lastName: string | null; username: string };
}) {
  if (adv.user.firstName && adv.user.lastName) return `${adv.user.firstName} ${adv.user.lastName}`;
  return adv.user.username;
}

interface CreateVisitFormProps {
  onSubmit: (data: FormValues) => void;
  isPending: boolean;
  error: string;
  onDirtyChange: (dirty: boolean) => void;
  gpsAccuracyRef: React.RefObject<number | undefined>;
}

function CreateVisitForm({
  onSubmit,
  isPending,
  error,
  onDirtyChange,
  gpsAccuracyRef,
}: CreateVisitFormProps) {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const { visitTypes } = useVisitTypes();
  const { advisors } = useAdvisors();
  const isAdvisor = hasRole('advisor');

  const advisorOptions = advisors
    .map((adv) => ({
      value: adv.userId,
      label: advisorLabel(adv),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateVisitSchema),
    defaultValues: {
      visitTypeId: '',
      advisorId: user?.id ?? '',
      visitDate: new Date().toISOString(),
      observations: '',
      gpsLatitude: '',
      gpsLongitude: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('gpsLatitude', pos.coords.latitude, { shouldDirty: true });
        setValue('gpsLongitude', pos.coords.longitude, { shouldDirty: true });
        gpsAccuracyRef.current = pos.coords.accuracy;
      },
      () => {},
    );
  }, [setValue, gpsAccuracyRef]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {error && <FormAlert message={error} />}

        <FieldGroup>
          <Field data-invalid={errors.visitTypeId ? true : undefined}>
            <FieldLabel>{t('visits.visitType')}</FieldLabel>
            <Controller
              control={control}
              name="visitTypeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('visits.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {visitTypes.map((vt) => (
                      <SelectItem key={vt.id} value={vt.id}>
                        {vt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError>{errors.visitTypeId?.message}</FieldError>
          </Field>

          {!isAdvisor && (
            <Field data-invalid={errors.advisorId ? true : undefined}>
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
              <FieldError>{errors.advisorId?.message}</FieldError>
            </Field>
          )}

          <Field data-invalid={errors.visitDate ? true : undefined}>
            <FieldLabel>{t('visits.dateTime')}</FieldLabel>
            <Controller
              control={control}
              name="visitDate"
              render={({ field }) => (
                <DateTimePicker value={field.value} onChange={field.onChange} />
              )}
            />
            <FieldError>{errors.visitDate?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.observations ? true : undefined}>
            <FieldLabel>{t('common.observations')}</FieldLabel>
            <Textarea
              {...register('observations')}
              placeholder={t('visits.visitDescPlaceholder')}
              maxLength={500}
            />
            <FieldError>{errors.observations?.message}</FieldError>
          </Field>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            <span>{t('visits.location')}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={errors.gpsLatitude ? true : undefined}>
              <FieldLabel>{t('visits.latitude')}</FieldLabel>
              <Input type="number" step="any" {...register('gpsLatitude')} placeholder="-2.1894" />
              <FieldError>{errors.gpsLatitude?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.gpsLongitude ? true : undefined}>
              <FieldLabel>{t('visits.longitude')}</FieldLabel>
              <Input
                type="number"
                step="any"
                {...register('gpsLongitude')}
                placeholder="-79.8891"
              />
              <FieldError>{errors.gpsLongitude?.message}</FieldError>
            </Field>
          </div>
        </FieldGroup>
      </div>

      <SheetFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {t('visits.register')}
        </Button>
      </SheetFooter>
    </form>
  );
}
