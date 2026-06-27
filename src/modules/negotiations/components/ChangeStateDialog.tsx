import { ChangeNegotiationStateRequestSchema } from '@bopacorp/shared/crm';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/lib/query-keys.js';
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { useNegotiationStates } from '../hooks/useNegotiationStates.js';
import { changeNegotiationState } from '../negotiations.service.js';

type FormValues = z.input<typeof ChangeNegotiationStateRequestSchema>;

interface ChangeStateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiationId: string;
  currentStateId: string;
  targetStateId?: string;
  onSuccess: () => void;
}

export function ChangeStateDialog({
  open,
  onOpenChange,
  negotiationId,
  currentStateId,
  targetStateId,
  onSuccess,
}: ChangeStateDialogProps) {
  const { t } = useTranslation();
  const { states } = useNegotiationStates();
  const queryClient = useQueryClient();
  const availableStates = states.filter((s) => s.id !== currentStateId);

  const suggestedId = useMemo(() => {
    const current = states.find((s) => s.id === currentStateId);
    return states.find((s) => s.position === (current?.position ?? 0) + 1)?.id ?? '';
  }, [states, currentStateId]);

  const effectiveStateId = targetStateId ?? suggestedId;
  const isLocked = !!targetStateId;
  const targetStateName = states.find((s) => s.id === targetStateId)?.name;

  const form = useForm<FormValues>({
    resolver: zodResolver(ChangeNegotiationStateRequestSchema),
    defaultValues: { stateId: effectiveStateId, notes: '' },
    mode: 'onTouched',
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitted, isValid },
  } = form;

  useEffect(() => {
    if (open) {
      reset({ stateId: effectiveStateId, notes: '' });
    }
  }, [open, effectiveStateId, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => changeNegotiationState(negotiationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.negotiations.all });
      toast.success(t('negotiations.stateUpdated'));
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details?.length) {
        for (const d of err.details) {
          setError(d.field as keyof FormValues, { type: 'server', message: d.message });
        }
        return;
      }
      setError('root', { type: 'server', message: getErrorMessage(err) });
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate({ stateId: data.stateId, notes: data.notes || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isLocked ? t('negotiations.confirmStateChange') : t('negotiations.changeState')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errors.root && <FormAlert message={errors.root.message ?? ''} />}

          <FieldGroup>
            <Field data-invalid={errors.stateId ? true : undefined}>
              <FieldLabel htmlFor="change-state-id">{t('negotiations.newState')}</FieldLabel>
              {isLocked ? (
                <Input
                  id="change-state-id"
                  value={targetStateName ?? ''}
                  readOnly
                  className="bg-muted"
                />
              ) : (
                <Controller
                  control={control}
                  name="stateId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="change-state-id">
                        <SelectValue placeholder={t('negotiations.selectState')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStates.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              <FieldError>{errors.stateId?.message}</FieldError>
            </Field>

            <Field data-invalid={errors.notes ? true : undefined}>
              <FieldLabel htmlFor="change-state-notes">{t('negotiations.changeNotes')}</FieldLabel>
              <Textarea
                id="change-state-notes"
                {...register('notes', {
                  setValueAs: (value) => (value === '' || value == null ? undefined : value),
                })}
                placeholder={t('negotiations.changeNotesPlaceholder')}
              />
              <FieldError>{errors.notes?.message}</FieldError>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending || (isSubmitted && !isValid)}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {isLocked ? t('common.confirm') : t('negotiations.change')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
