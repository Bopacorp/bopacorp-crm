import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { useNegotiationStates } from '../hooks/useNegotiationStates.js';
import { changeNegotiationState } from '../negotiations.service.js';

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

  const [stateId, setStateId] = useState(effectiveStateId);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && effectiveStateId) {
      setStateId(effectiveStateId);
    }
  }, [open, effectiveStateId]);

  const mutation = useMutation({
    mutationFn: (data: { stateId: string; notes?: string }) =>
      changeNegotiationState(negotiationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.negotiations.all });
      toast.success('Estado actualizado');
      handleOpenChange(false);
      onSuccess();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const resetForm = () => {
    setStateId(effectiveStateId);
    setNotes('');
    setError('');
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stateId) return;
    setError('');

    mutation.mutate({ stateId, notes: notes || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isLocked ? 'Confirmar cambio de estado' : 'Cambiar estado'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <FormAlert message={error} />}

          <FieldGroup>
            <Field>
              <FieldLabel>Nuevo estado</FieldLabel>
              {isLocked ? (
                <Input value={targetStateName ?? ''} readOnly className="bg-muted" />
              ) : (
                <Select value={stateId} onValueChange={setStateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
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
            </Field>

            <Field>
              <FieldLabel>Notas (opcional)</FieldLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Motivo del cambio..."
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || !stateId}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {isLocked ? 'Confirmar' : 'Cambiar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
