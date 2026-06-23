import type { MatrixState } from '@bopacorp/shared/matrices';
import { ChangeMatrixStateRequestSchema } from '@bopacorp/shared/matrices';
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
import { getValidTransitions, matrixStateLabel } from '../lib/state.js';
import { changeMatrixState } from '../matrices.service.js';

type FormValues = z.input<typeof ChangeMatrixStateRequestSchema>;

interface ChangeMatrixStateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matrixId: string;
  currentState: MatrixState;
  onSuccess: () => void;
}

export function ChangeMatrixStateDialog({
  open,
  onOpenChange,
  matrixId,
  currentState,
  onSuccess,
}: ChangeMatrixStateDialogProps) {
  const queryClient = useQueryClient();
  const validTransitions = getValidTransitions(currentState);

  const form = useForm<FormValues>({
    resolver: zodResolver(ChangeMatrixStateRequestSchema),
    defaultValues: { state: validTransitions[0], supervisorMessage: '' },
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
      const transitions = getValidTransitions(currentState);
      reset({ state: transitions[0], supervisorMessage: '' });
    }
  }, [open, currentState, reset]);

  const mutation = useMutation({
    mutationFn: () =>
      changeMatrixState(matrixId, {
        state: form.getValues('state'),
        supervisorMessage: form.getValues('supervisorMessage') || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.detail(matrixId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.history(matrixId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.all });
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

  const onSubmit = () => {
    mutation.mutate();
  };

  if (validTransitions.length === 0) return null;

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
                      {validTransitions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {matrixStateLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.state?.message}</FieldError>
            </Field>

            <Field data-invalid={errors.supervisorMessage ? true : undefined}>
              <FieldLabel>Mensaje (opcional)</FieldLabel>
              <Textarea {...register('supervisorMessage')} placeholder="Motivo del cambio..." />
              <FieldError>{errors.supervisorMessage?.message}</FieldError>
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
