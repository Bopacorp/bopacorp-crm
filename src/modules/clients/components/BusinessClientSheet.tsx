import type { BusinessClientResponse, UpdateBusinessClientRequest } from '@bopacorp/shared/crm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { ErrorState, FormAlert } from '@/shared/ui';
import { updateBusinessClient } from '../clients.service.js';
import { useBusinessClient } from '../hooks/useBusinessClient.js';

interface BusinessClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value || '—'}</span>
    </div>
  );
}

export function BusinessClientSheet({ open, onOpenChange, clientId }: BusinessClientSheetProps) {
  const { client, loading, error, refetch } = useBusinessClient(clientId);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!open) setEditing(false);
  }, [open]);

  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Cliente</SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (error || !client) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Cliente</SheetTitle>
          </SheetHeader>
          <ErrorState error={error} onRetry={refetch} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader className="flex flex-row items-center justify-between pr-10">
          <SheetTitle>{client.businessName}</SheetTitle>
          {!editing && (
            <Can permission="business_clients.update">
              <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
                <Pencil className="size-4" />
              </Button>
            </Can>
          )}
        </SheetHeader>
        {editing ? (
          <EditForm
            client={client}
            onCancel={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
            }}
          />
        ) : (
          <ViewMode client={client} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ViewMode({ client }: { client: BusinessClientResponse }) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-4">
        <DetailField label="RUC" value={client.ruc} />
        <DetailField label="Nombre comercial" value={client.businessName} />
        <DetailField label="Contacto" value={client.contactName} />
        <DetailField label="Teléfono" value={client.contactPhone ?? ''} />
        <DetailField label="Email" value={client.contactEmail ?? ''} />
        <DetailField label="Dirección" value={client.address ?? ''} />
        <DetailField label="Servicios activos" value={String(client.activeServicesCount)} />
        <DetailField
          label="Facturación mensual"
          value={formatCurrency(client.currentMonthlyBilling)}
        />
        <DetailField label="Estado" value={client.isActive ? 'Activo' : 'Inactivo'} />
      </div>
    </div>
  );
}

function EditForm({
  client,
  onCancel,
  onSaved,
}: {
  client: BusinessClientResponse;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [businessName, setBusinessName] = useState(client.businessName);
  const [contactName, setContactName] = useState(client.contactName);
  const [contactPhone, setContactPhone] = useState(client.contactPhone ?? '');
  const [contactEmail, setContactEmail] = useState(client.contactEmail ?? '');
  const [address, setAddress] = useState(client.address ?? '');
  const [activeServicesCount, setActiveServicesCount] = useState(client.activeServicesCount);
  const [currentMonthlyBilling, setCurrentMonthlyBilling] = useState(client.currentMonthlyBilling);
  const [isActive, setIsActive] = useState(client.isActive);
  const [formError, setFormError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: UpdateBusinessClientRequest) => updateBusinessClient(client.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.businessClients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.negotiations.all });
      toast.success('Cliente actualizado');
      onSaved();
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !contactName) return;
    setFormError('');

    mutation.mutate({
      businessName,
      contactName,
      contactPhone: contactPhone || undefined,
      contactEmail: contactEmail || undefined,
      address: address || undefined,
      activeServicesCount,
      currentMonthlyBilling,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {formError && <FormAlert message={formError} />}

        <FieldGroup>
          <Field>
            <FieldLabel>RUC</FieldLabel>
            <Input value={client.ruc} readOnly className="bg-muted" />
          </Field>

          <Field>
            <FieldLabel>Nombre comercial</FieldLabel>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </Field>

          <Field>
            <FieldLabel>Contacto</FieldLabel>
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} required />
          </Field>

          <Field>
            <FieldLabel>Teléfono</FieldLabel>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </Field>

          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel>Dirección</FieldLabel>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>

          <Field>
            <FieldLabel>Servicios activos</FieldLabel>
            <Input
              type="number"
              min={0}
              value={activeServicesCount}
              onChange={(e) => setActiveServicesCount(Number(e.target.value))}
            />
          </Field>

          <Field>
            <FieldLabel>Facturación mensual</FieldLabel>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={currentMonthlyBilling}
              onChange={(e) => setCurrentMonthlyBilling(Number(e.target.value))}
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Activo</FieldLabel>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </Field>
        </FieldGroup>
      </div>

      <SheetFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X data-icon="inline-start" />
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending || !businessName || !contactName}>
          {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          Guardar
        </Button>
      </SheetFooter>
    </form>
  );
}
