import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/lib/query-keys.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { createMatrix } from '../matrices.service.js';

interface CreateMatrixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiationId: string;
}

export function CreateMatrixDialog({ open, onOpenChange, negotiationId }: CreateMatrixDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [observations, setObservations] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createMatrix({
        negotiationId,
        totalAmount: 0,
        calculatedSubsidy: 0,
        subsidyStrategy: 'STANDARD',
        observations: observations || undefined,
      }),
    onSuccess: (matrix) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.all });
      toast.success('Matriz creada');
      onOpenChange(false);
      setObservations('');
      setError('');
      navigate(`/negociaciones/matrices/${matrix.id}`);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva matriz de oferta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <FormAlert message={error} />}

          <FieldGroup>
            <Field>
              <FieldLabel>Observaciones (opcional)</FieldLabel>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Notas sobre esta matriz..."
              />
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
