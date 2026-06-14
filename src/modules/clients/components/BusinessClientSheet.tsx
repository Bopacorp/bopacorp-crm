import type { BusinessClientResponse, UpdateBusinessClientRequest } from '@bopacorp/shared/crm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { ErrorState } from '@/shared/ui';
import { updateBusinessClient } from '../clients.service.js';
import { useBusinessClient } from '../hooks/useBusinessClient.js';
import type { BusinessClientFormValues } from './BusinessClientForm.js';
import { BusinessClientForm } from './BusinessClientForm.js';

interface BusinessClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
}

function advisorDisplayName(advisor: BusinessClientResponse['advisor']): string {
  if (!advisor) return '—';
  if (advisor.profile) return `${advisor.profile.firstName} ${advisor.profile.lastName}`;
  return advisor.username;
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
        <SheetContent showCloseButton={false}>
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle>Cliente</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm">
                <XIcon />
              </Button>
            </SheetClose>
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
        <SheetContent showCloseButton={false}>
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle>Cliente</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm">
                <XIcon />
              </Button>
            </SheetClose>
          </SheetHeader>
          <ErrorState error={error} onRetry={refetch} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle className="truncate">{client.businessName}</SheetTitle>
          <div className="flex items-center gap-1">
            {!editing && (
              <Can permission="business_clients.update">
                <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
                  <Pencil />
                </Button>
              </Can>
            )}
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm">
                <XIcon />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        {editing ? (
          <EditForm client={client} onSaved={() => setEditing(false)} />
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
        <DetailField label="Asesor" value={advisorDisplayName(client.advisor)} />
        <DetailField label="Estado" value={client.isActive ? 'Activo' : 'Inactivo'} />
      </div>
    </div>
  );
}

function EditForm({ client, onSaved }: { client: BusinessClientResponse; onSaved: () => void }) {
  const queryClient = useQueryClient();
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

  const handleSubmit = (values: BusinessClientFormValues) => {
    setFormError('');
    mutation.mutate({
      advisorId: values.advisorId || undefined,
      businessName: values.businessName,
      contactName: values.contactName,
      contactPhone: values.contactPhone || undefined,
      contactEmail: values.contactEmail || undefined,
      address: values.address || undefined,
      activeServicesCount: values.activeServicesCount,
      currentMonthlyBilling: values.currentMonthlyBilling,
      isActive: values.isActive,
    });
  };

  return (
    <BusinessClientForm
      defaultValues={{
        ruc: client.ruc,
        businessName: client.businessName,
        contactName: client.contactName,
        contactPhone: client.contactPhone ?? '',
        contactEmail: client.contactEmail ?? '',
        address: client.address ?? '',
        advisorId: client.advisor?.id ?? '',
        activeServicesCount: client.activeServicesCount,
        currentMonthlyBilling: client.currentMonthlyBilling,
        isActive: client.isActive,
      }}
      onSubmit={handleSubmit}
      isPending={mutation.isPending}
      error={formError}
      submitLabel="Guardar"
      rucReadOnly
      showIsActive
    />
  );
}
