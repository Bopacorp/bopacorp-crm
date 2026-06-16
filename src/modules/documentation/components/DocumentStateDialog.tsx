import type { DocumentState } from '@bopacorp/shared/documents';
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
import { changeDocumentState } from '../documentation.service.js';
import { documentStateLabel } from '../lib/state.js';

interface DocumentStateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  currentState: DocumentState;
  onSuccess: () => void;
}

function getAllowedTransitions(currentState: DocumentState): DocumentState[] {
  const transitions: Record<DocumentState, DocumentState[]> = {
    PENDING_APPROVAL: ['ACCEPTED', 'REJECTED'],
    REJECTED: ['PENDING_APPROVAL'],
    ACCEPTED: [],
  };
  return transitions[currentState] ?? [];
}

export function DocumentStateDialog({
  open,
  onOpenChange,
  documentId,
  currentState,
  onSuccess,
}: DocumentStateDialogProps) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<DocumentState | ''>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setState('');
      setMessage('');
      setError('');
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: ({ newState, notes }: { newState: DocumentState; notes?: string }) =>
      changeDocumentState(documentId, { state: newState, coordinatorMessage: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      toast.success('Estado actualizado');
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const allowedStates = getAllowedTransitions(currentState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state) return;
    setError('');
    mutation.mutate({ newState: state, notes: message || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar estado del documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <FormAlert message={error} />}

          <FieldGroup>
            <Field>
              <FieldLabel>Estado actual</FieldLabel>
              <div className="text-sm text-muted-foreground">
                {documentStateLabel(currentState)}
              </div>
            </Field>

            <Field>
              <FieldLabel>Nuevo estado</FieldLabel>
              <Select value={state} onValueChange={(value) => setState(value as DocumentState)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {allowedStates.map((s) => (
                    <SelectItem key={s} value={s}>
                      {documentStateLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Mensaje del coordinador (opcional)</FieldLabel>
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
            <Button type="submit" disabled={mutation.isPending || !state}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
