import type { SalesObjectiveListItemResponse } from '@bopacorp/shared/reports';
import { CreateSalesObjectiveRequestSchema } from '@bopacorp/shared/reports';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { createObjective, updateObjective } from '../reports.service.js';

type FormValues = z.input<typeof CreateSalesObjectiveRequestSchema>;

interface ObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective?: SalesObjectiveListItemResponse | null;
}

export function ObjectiveDialog({ open, onOpenChange, objective }: ObjectiveDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isEdit = !!objective;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateSalesObjectiveRequestSchema),
    defaultValues: {
      createdBy: user?.id ?? '',
      targetSalesAmount: 0,
      targetClosedDeals: 0,
      periodStart: '',
      periodEnd: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      if (objective) {
        reset({
          createdBy: user?.id ?? '',
          targetSalesAmount: objective.targetSalesAmount,
          targetClosedDeals: objective.targetClosedDeals,
          periodStart: objective.periodStart,
          periodEnd: objective.periodEnd,
          advisorId: objective.advisor?.id,
        });
      } else {
        reset({
          createdBy: user?.id ?? '',
          targetSalesAmount: 0,
          targetClosedDeals: 0,
          periodStart: '',
          periodEnd: '',
        });
      }
    }
  }, [open, objective, user?.id, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (isEdit) {
        const { createdBy: _, ...rest } = data;
        return updateObjective(objective.id, rest);
      }
      return createObjective(data);
    },
    onSuccess: () => {
      toast.success(t(isEdit ? 'reports.objectiveUpdated' : 'reports.objectiveCreated'));
      queryClient.invalidateQueries({ queryKey: ['reports', 'objectives'] });
      onOpenChange(false);
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
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? 'reports.editObjective' : 'reports.newObjective')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-4 px-4">
            <FieldGroup>
              {errors.root && <FormAlert message={errors.root.message ?? ''} />}

              <input type="hidden" {...register('createdBy')} />

              <Field data-invalid={errors.targetSalesAmount ? true : undefined}>
                <FieldLabel>{t('reports.targetAmount')}</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register('targetSalesAmount', { valueAsNumber: true })}
                />
                <FieldError>{errors.targetSalesAmount?.message}</FieldError>
              </Field>

              <Field data-invalid={errors.targetClosedDeals ? true : undefined}>
                <FieldLabel>{t('reports.targetDeals')}</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  {...register('targetClosedDeals', { valueAsNumber: true })}
                />
                <FieldError>{errors.targetClosedDeals?.message}</FieldError>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={errors.periodStart ? true : undefined}>
                  <FieldLabel>{t('reports.periodStart')}</FieldLabel>
                  <Input type="date" {...register('periodStart')} />
                  <FieldError>{errors.periodStart?.message}</FieldError>
                </Field>

                <Field data-invalid={errors.periodEnd ? true : undefined}>
                  <FieldLabel>{t('reports.periodEnd')}</FieldLabel>
                  <Input type="date" {...register('periodEnd')} />
                  <FieldError>{errors.periodEnd?.message}</FieldError>
                </Field>
              </div>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {t(isEdit ? 'common.save' : 'common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
