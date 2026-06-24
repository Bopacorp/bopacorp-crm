import type { DocumentState } from '@bopacorp/shared/documents';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field.js';
import { Textarea } from '@/components/ui/textarea.js';
import { queryKeys } from '@/lib/query-keys.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { changeDocumentState } from '../documentation.service.js';

const RejectFormSchema = z.object({
  coordinatorMessage: z
    .string()
    .min(1, 'Las notas son obligatorias')
    .max(1000, 'Máximo 1000 caracteres'),
});

type RejectFormValues = z.input<typeof RejectFormSchema>;

interface RejectDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  currentState: DocumentState;
  onSuccess?: () => void;
}

export function RejectDocumentDialog({
  open,
  onOpenChange,
  documentId,
  currentState,
  onSuccess,
}: RejectDocumentDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const form = useForm<RejectFormValues>({
    resolver: zodResolver(RejectFormSchema),
    defaultValues: { coordinatorMessage: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      form.reset({ coordinatorMessage: '' });
      setError('');
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (data: RejectFormValues) =>
      changeDocumentState(documentId, {
        state: 'REJECTED',
        coordinatorMessage: data.coordinatorMessage || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      toast.success('Documento rechazado');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const onSubmit = (values: RejectFormValues) => {
    setError('');
    mutation.mutate(values);
  };

  const isRejected = currentState === 'REJECTED';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isRejected ? 'Cambiar estado del documento' : 'Rechazar documento'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {error && <FormAlert message={error} />}

          <FieldGroup>
            <Field data-invalid={form.formState.errors.coordinatorMessage ? true : undefined}>
              <FieldLabel>Notas del coordinador</FieldLabel>
              <Textarea
                placeholder={
                  isRejected ? 'Motivo del cambio de estado...' : 'Indica el motivo del rechazo...'
                }
                disabled={mutation.isPending}
                {...form.register('coordinatorMessage')}
              />
              {form.formState.errors.coordinatorMessage && (
                <FieldError>{form.formState.errors.coordinatorMessage.message}</FieldError>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {isRejected ? 'Guardar' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
