import { Loader2 } from 'lucide-react';
import { useState } from 'react';
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
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { useNegotiationStates } from '../hooks/useNegotiationStates.js';
import { changeNegotiationState } from '../negotiations.service.js';

interface ChangeStateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiationId: string;
  currentStateId: string;
  onSuccess: () => void;
}

export function ChangeStateDialog({
  open,
  onOpenChange,
  negotiationId,
  currentStateId,
  onSuccess,
}: ChangeStateDialogProps) {
  const { states } = useNegotiationStates();
  const availableStates = states.filter((s) => s.id !== currentStateId);

  const [stateId, setStateId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setStateId('');
    setNotes('');
    setError('');
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stateId) return;

    setSubmitting(true);
    setError('');
    try {
      await changeNegotiationState(negotiationId, {
        stateId,
        notes: notes || undefined,
      });
      toast.success('Estado actualizado');
      handleOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar estado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <FormAlert message={error} />}

          <FieldGroup>
            <Field>
              <FieldLabel>Nuevo estado</FieldLabel>
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
            <Button type="submit" disabled={submitting || !stateId}>
              {submitting && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Cambiar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
