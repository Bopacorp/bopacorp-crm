import type { ApplicationState, UpdateJobApplicationRequest } from '@bopacorp/shared/employability';
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
import { updateJobApplication } from '../employability.service.js';
import { applicationStateLabel } from '../lib/state.js';

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
  const [state, setState] = useState<ApplicationState>(currentState);
  const [reviewNotes, setReviewNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setState(currentState);
      setReviewNotes('');
      setError('');
    }
  }, [open, currentState]);

  const mutation = useMutation({
    mutationFn: (data: UpdateJobApplicationRequest) => updateJobApplication(applicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employability.applications.all });
      toast.success('Estado actualizado');
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state === currentState) return;
    setError('');
    mutation.mutate({
      state,
      reviewNotes: reviewNotes || undefined,
    });
  };

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
              <Select value={state} onValueChange={(value) => setState(value as ApplicationState)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {STATES.filter((s) => s !== currentState).map((s) => (
                    <SelectItem key={s} value={s}>
                      {applicationStateLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Notas de revisión (opcional)</FieldLabel>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Motivo del cambio..."
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || state === currentState}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
