import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/lib/query-keys.js';
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { createMatrix } from '../matrices.service.js';

const FormSchema = z.object({
  observations: z.string().max(1000).optional(),
});

type FormValues = z.input<typeof FormSchema>;

interface CreateMatrixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiationId: string;
}

export function CreateMatrixDialog({ open, onOpenChange, negotiationId }: CreateMatrixDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { observations: '' },
    mode: 'onTouched',
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      reset({ observations: '' });
    }
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: () =>
      createMatrix({
        negotiationId,
        totalAmount: 0,
        calculatedSubsidy: 0,
        subsidyStrategy: 'STANDARD',
        observations: form.getValues('observations') || undefined,
      }),
    onSuccess: (matrix) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.all });
      toast.success('Matriz creada');
      onOpenChange(false);
      navigate(`/negociaciones/matrices/${matrix.id}`);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva matriz de oferta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errors.root && <FormAlert message={errors.root.message ?? ''} />}

          <FieldGroup>
            <Field data-invalid={errors.observations ? true : undefined}>
              <FieldLabel>Observaciones (opcional)</FieldLabel>
              <Textarea {...register('observations')} placeholder="Notas sobre esta matriz..." />
              <FieldError>{errors.observations?.message}</FieldError>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
