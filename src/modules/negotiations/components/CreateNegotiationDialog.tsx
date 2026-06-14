import type { CreateNegotiationRequest } from '@bopacorp/shared/crm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { Can } from '@/modules/auth/components/Can.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { CreateBusinessClientDialog } from '@/modules/clients/components/CreateBusinessClientDialog.js';
import { useBusinessClients } from '@/modules/clients/hooks/useBusinessClients.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert, SearchSelect } from '@/shared/ui';
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
  const queryClient = useQueryClient();
  const { states } = useNegotiationStates();
  const { clients } = useBusinessClients(1, {});

  const [clientId, setClientId] = useState('');
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [stateId, setStateId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimatedCloseDate, setEstimatedCloseDate] = useState('');
  const [observations, setObservations] = useState('');
  const [error, setError] = useState('');

  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.businessName })),
    [clients],
  );

  const mutation = useMutation({
    mutationFn: (data: CreateNegotiationRequest) => createNegotiation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.negotiations.all });
      toast.success('Negociación creada');
      handleOpenChange(false);
      onSuccess();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !stateId || !user) return;
    setError('');

    mutation.mutate({
      clientId,
      advisorId: user.id,
      stateId,
      startDate: startDate || undefined,
      estimatedCloseDate: estimatedCloseDate || undefined,
      observations: observations || undefined,
      isActive: true,
    });
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
              <SearchSelect
                options={clientOptions}
                value={clientId}
                onValueChange={setClientId}
                placeholder="Seleccionar cliente"
                searchPlaceholder="Buscar cliente..."
                emptyMessage="Sin clientes"
              />
              <Can permission="business_clients.create">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1"
                  onClick={() => setCreateClientOpen(true)}
                >
                  <Plus data-icon="inline-start" />
                  Nuevo cliente
                </Button>
              </Can>
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
            <Button type="submit" disabled={mutation.isPending || !clientId || !stateId}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <CreateBusinessClientDialog
        open={createClientOpen}
        onOpenChange={setCreateClientOpen}
        onSuccess={(client) => {
          setClientId(client.id);
        }}
      />
    </Dialog>
  );
}
