import { Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SheetFooter } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Can } from '@/modules/auth/components/Can.js';
import { DatePicker, FormAlert, SearchSelect } from '@/shared/ui';

export interface NegotiationFormValues {
  clientId: string;
  stateId: string;
  advisorId: string;
  startDate: string;
  estimatedCloseDate: string;
  observations: string;
  isActive: boolean;
}

interface NegotiationFormProps {
  defaultValues: NegotiationFormValues;
  onSubmit: (values: NegotiationFormValues) => void;
  isPending: boolean;
  error?: string;
  submitLabel: string;
  onDirtyChange?: (dirty: boolean) => void;
  clientOptions?: { value: string; label: string }[];
  clientSearchValue?: string;
  onClientSearchChange?: (search: string) => void;
  clientLoading?: boolean;
  clientHasMore?: boolean;
  onClientLoadMore?: () => void;
  stateOptions: { id: string; name: string; position: number }[];
  onCreateClient?: () => void;
  showCreateClient?: boolean;
  clientReadOnly?: boolean;
  clientName?: string;
  advisorOptions?: { value: string; label: string }[];
  showAdvisorField?: boolean;
  showIsActive?: boolean;
  stateLabel?: string;
}

export function NegotiationForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  submitLabel,
  onDirtyChange,
  clientOptions,
  clientSearchValue,
  onClientSearchChange,
  clientLoading,
  clientHasMore,
  onClientLoadMore,
  stateOptions,
  onCreateClient,
  showCreateClient,
  clientReadOnly,
  clientName,
  advisorOptions,
  showAdvisorField,
  showIsActive,
  stateLabel,
}: NegotiationFormProps) {
  const [clientId, setClientId] = useState(defaultValues.clientId);
  const [stateId, setStateId] = useState(defaultValues.stateId);
  const [advisorId, setAdvisorId] = useState(defaultValues.advisorId);
  const [startDate, setStartDate] = useState(defaultValues.startDate);
  const [estimatedCloseDate, setEstimatedCloseDate] = useState(defaultValues.estimatedCloseDate);
  const [observations, setObservations] = useState(defaultValues.observations);
  const [isActive, setIsActive] = useState(defaultValues.isActive);

  const isDirty =
    clientId !== defaultValues.clientId ||
    stateId !== defaultValues.stateId ||
    advisorId !== defaultValues.advisorId ||
    startDate !== defaultValues.startDate ||
    estimatedCloseDate !== defaultValues.estimatedCloseDate ||
    observations !== defaultValues.observations ||
    isActive !== defaultValues.isActive;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !stateId) return;
    onSubmit({
      clientId,
      stateId,
      advisorId,
      startDate,
      estimatedCloseDate,
      observations,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {error && <FormAlert message={error} />}

        <FieldGroup>
          <Field>
            <FieldLabel>Cliente</FieldLabel>
            {clientReadOnly ? (
              <Input value={clientName} readOnly className="bg-muted" />
            ) : (
              <>
                <SearchSelect
                  options={clientOptions ?? []}
                  value={clientId}
                  onValueChange={setClientId}
                  placeholder="Seleccionar cliente"
                  searchPlaceholder="Buscar cliente..."
                  emptyMessage="Sin clientes"
                  onSearchChange={onClientSearchChange}
                  searchValue={clientSearchValue}
                  loading={clientLoading}
                  hasMore={clientHasMore}
                  onLoadMore={onClientLoadMore}
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
              </>
            )}
          </Field>

          <Field>
            <FieldLabel>{stateLabel ?? 'Estado inicial'}</FieldLabel>
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
            <DatePicker value={startDate} onChange={setStartDate} />
          </Field>

          <Field>
            <FieldLabel>Cierre estimado</FieldLabel>
            <DatePicker value={estimatedCloseDate} onChange={setEstimatedCloseDate} />
          </Field>

          <Field>
            <FieldLabel>Observaciones</FieldLabel>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Notas adicionales..."
            />
          </Field>

          {showAdvisorField && advisorOptions && (
            <Field>
              <FieldLabel>Asesor</FieldLabel>
              <SearchSelect
                options={advisorOptions}
                value={advisorId}
                onValueChange={setAdvisorId}
                placeholder="Seleccionar asesor"
                searchPlaceholder="Buscar asesor..."
                emptyMessage="Sin asesores"
              />
            </Field>
          )}

          {showIsActive && (
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Activa</FieldLabel>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </Field>
          )}
        </FieldGroup>
      </div>

      <SheetFooter>
        <Button type="submit" disabled={isPending || !clientId || !stateId}>
          {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  );
}
