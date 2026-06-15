import { Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
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
import { Can } from '@/modules/auth/components/Can.js';
import { FormAlert, SearchSelect } from '@/shared/ui';

export interface NegotiationFormValues {
  clientId: string;
  stateId: string;
  startDate: string;
  estimatedCloseDate: string;
  observations: string;
}

interface NegotiationFormProps {
  defaultValues: NegotiationFormValues;
  onSubmit: (values: NegotiationFormValues) => void;
  isPending: boolean;
  error?: string;
  submitLabel: string;
  onDirtyChange?: (dirty: boolean) => void;
  clientOptions: { value: string; label: string }[];
  stateOptions: { id: string; name: string }[];
  onCreateClient?: () => void;
  showCreateClient?: boolean;
}

export function NegotiationForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  submitLabel,
  onDirtyChange,
  clientOptions,
  stateOptions,
  onCreateClient,
  showCreateClient,
}: NegotiationFormProps) {
  const [clientId, setClientId] = useState(defaultValues.clientId);
  const [stateId, setStateId] = useState(defaultValues.stateId);
  const [startDate, setStartDate] = useState(defaultValues.startDate);
  const [estimatedCloseDate, setEstimatedCloseDate] = useState(defaultValues.estimatedCloseDate);
  const [observations, setObservations] = useState(defaultValues.observations);

  const isDirty =
    clientId !== defaultValues.clientId ||
    stateId !== defaultValues.stateId ||
    startDate !== defaultValues.startDate ||
    estimatedCloseDate !== defaultValues.estimatedCloseDate ||
    observations !== defaultValues.observations;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !stateId) return;
    onSubmit({ clientId, stateId, startDate, estimatedCloseDate, observations });
  };

  return (
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
          {showCreateClient && (
            <Can permission="business_clients.create">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={onCreateClient}
              >
                <Plus data-icon="inline-start" />
                Nuevo cliente
              </Button>
            </Can>
          )}
        </Field>

        <Field>
          <FieldLabel>Estado inicial</FieldLabel>
          <Select value={stateId} onValueChange={setStateId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              {stateOptions.map((state) => (
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
        <Button type="submit" disabled={isPending || !clientId || !stateId}>
          {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
