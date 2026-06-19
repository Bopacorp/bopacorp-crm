import type { DocumentState } from '@bopacorp/shared/documents';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field.js';
import { Textarea } from '@/components/ui/textarea.js';
import { queryKeys } from '@/lib/query-keys.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { changeDocumentState } from '../documentation.service.js';

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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setMessage('');
      setError('');
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (notes: string) =>
      changeDocumentState(documentId, { state: 'REJECTED', coordinatorMessage: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      toast.success('Documento rechazado');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate(message);
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <FormAlert message={error} />}

          <FieldGroup>
            <Field>
              <FieldLabel>Notas del coordinador</FieldLabel>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isRejected ? 'Motivo del cambio de estado...' : 'Indica el motivo del rechazo...'
                }
                required={!isRejected}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || (!isRejected && !message)}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {isRejected ? 'Guardar' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
