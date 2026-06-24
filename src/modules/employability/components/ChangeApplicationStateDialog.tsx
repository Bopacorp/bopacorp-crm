import type { ApplicationState } from '@bopacorp/shared/employability';
import { UpdateJobApplicationRequestSchema } from '@bopacorp/shared/employability';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { updateJobApplication } from '../employability.service.js';
import { applicationStateLabel } from '../lib/state.js';

type FormValues = z.input<typeof UpdateJobApplicationRequestSchema>;

interface ChangeApplicationStateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  currentState: ApplicationState;
  onSuccess: () => void;
}

const STATES: ApplicationState[] = ['DRAFT', 'PENDING', 'ACCEPTED', 'REJECTED'];

export function ChangeApplicationStateDialog({
  open,
  onOpenChange,
  applicationId,
  currentState,
  onSuccess,
}: ChangeApplicationStateDialogProps) {
  const queryClient = useQueryClient();
  const availableStates = STATES.filter((s) => s !== currentState);

  const form = useForm<FormValues>({
    resolver: zodResolver(UpdateJobApplicationRequestSchema),
    defaultValues: { state: availableStates[0], reviewNotes: '' },
    mode: 'onTouched',
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      const firstAvailable = STATES.filter((s) => s !== currentState)[0];
      reset({ state: firstAvailable, reviewNotes: '' });
    }
  }, [open, currentState, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => updateJobApplication(applicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employability.applications.all });
      toast.success('Estado actualizado');
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
    mutation.mutate({
      state: data.state,
      reviewNotes: data.reviewNotes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar estado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errors.root && <FormAlert message={errors.root.message ?? ''} />}

          <FieldGroup>
            <Field data-invalid={errors.state ? true : undefined}>
              <FieldLabel>Nuevo estado</FieldLabel>
              <Controller
                control={control}
                name="state"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStates.map((s) => (
                        <SelectItem key={s} value={s}>
                          {applicationStateLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.state?.message}</FieldError>
            </Field>

            <Field data-invalid={errors.reviewNotes ? true : undefined}>
              <FieldLabel>Notas de revisión (opcional)</FieldLabel>
              <Textarea {...register('reviewNotes')} placeholder="Motivo del cambio..." />
              <FieldError>{errors.reviewNotes?.message}</FieldError>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
