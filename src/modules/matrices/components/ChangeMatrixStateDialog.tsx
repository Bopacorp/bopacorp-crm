import type { MatrixState } from '@bopacorp/shared/matrices';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/lib/query-keys.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { getValidTransitions, matrixStateLabel } from '../lib/state.js';
import { changeMatrixState } from '../matrices.service.js';

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
  const [targetState, setTargetState] = useState<MatrixState>(validTransitions[0]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const transitions = getValidTransitions(currentState);
      setTargetState(transitions[0]);
      setMessage('');
      setError('');
    }
  }, [open, currentState]);

  const mutation = useMutation({
    mutationFn: () =>
      changeMatrixState(matrixId, {
        state: targetState,
        supervisorMessage: message || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.detail(matrixId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.history(matrixId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.all });
      toast.success('Estado actualizado');
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetState) return;
    setError('');
    mutation.mutate();
  };

  if (validTransitions.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar estado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <FormAlert message={error} />}

          <FieldGroup>
            <Field>
              <FieldLabel>Nuevo estado</FieldLabel>
              <Select value={targetState} onValueChange={(v) => setTargetState(v as MatrixState)}>
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
            </Field>

            <Field>
              <FieldLabel>Mensaje (opcional)</FieldLabel>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Motivo del cambio..."
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || !targetState}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
