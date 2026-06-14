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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { useBusinessClients } from '../hooks/useBusinessClients.js';
import { useNegotiationStates } from '../hooks/useNegotiationStates.js';
import { createNegotiation } from '../negotiations.service.js';

interface CreateNegotiationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateNegotiationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateNegotiationDialogProps) {
  const { user } = useAuth();
  const { states } = useNegotiationStates();
  const { clients } = useBusinessClients(1, {});

  const [clientId, setClientId] = useState('');
  const [stateId, setStateId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimatedCloseDate, setEstimatedCloseDate] = useState('');
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setClientId('');
    setStateId('');
    setStartDate('');
    setEstimatedCloseDate('');
    setObservations('');
    setError('');
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !stateId || !user) return;

    setSubmitting(true);
    setError('');
    try {
      await createNegotiation({
        clientId,
        advisorId: user.id,
        stateId,
        startDate: startDate || undefined,
        estimatedCloseDate: estimatedCloseDate || undefined,
        observations: observations || undefined,
        isActive: true,
      });
      toast.success('Negociación creada');
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
          <DialogTitle>Nueva negociación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <FormAlert message={error} />}

          <FieldGroup>
            <Field>
              <FieldLabel>Cliente</FieldLabel>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Estado inicial</FieldLabel>
              <Select value={stateId} onValueChange={setStateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Fecha de inicio</FieldLabel>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>

            <Field>
              <FieldLabel>Cierre estimado</FieldLabel>
              <Input
                type="date"
                value={estimatedCloseDate}
                onChange={(e) => setEstimatedCloseDate(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Observaciones</FieldLabel>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Notas adicionales..."
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !clientId || !stateId}>
              {submitting && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
