import type { BusinessClientResponse, CreateBusinessClientRequest } from '@bopacorp/shared/crm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { queryKeys } from '@/lib/query-keys.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog } from '@/shared/ui';
import { createBusinessClient } from '../clients.service.js';
import type { BusinessClientFormValues } from './BusinessClientForm.js';
import { BusinessClientForm } from './BusinessClientForm.js';

interface CreateBusinessClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (client: BusinessClientResponse) => void;
}

const EMPTY_VALUES: BusinessClientFormValues = {
  ruc: '',
  businessName: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  advisorId: '',
  isActive: true,
};

export function CreateBusinessClientDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateBusinessClientSheetProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [key, setKey] = useState(0);

  const forceClose = useCallback(() => {
    setKey((k) => k + 1);
    setError('');
    onOpenChange(false);
  }, [onOpenChange]);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose: forceClose });

  const mutation = useMutation({
    mutationFn: (data: CreateBusinessClientRequest) => createBusinessClient(data),
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.businessClients.all });
      toast.success('Cliente creado');
      dirtyRef.current = false;
      forceClose();
      onSuccess(client);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      guardedAction('close');
    } else {
      onOpenChange(true);
    }
  };

  const handleSubmit = (values: BusinessClientFormValues) => {
    setError('');
    mutation.mutate({
      ruc: values.ruc,
      businessName: values.businessName,
      contactName: values.contactName,
      contactPhone: values.contactPhone || undefined,
      contactEmail: values.contactEmail || undefined,
      address: values.address || undefined,
      advisorId: values.advisorId || undefined,
      activeServicesCount: 0,
      currentMonthlyBilling: 0,
      isActive: true,
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nuevo cliente</SheetTitle>
        </SheetHeader>
        <BusinessClientForm
          key={key}
          defaultValues={EMPTY_VALUES}
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
          error={error}
          submitLabel="Crear"
          onDirtyChange={handleDirtyChange}
        />
      </SheetContent>

      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />
    </Sheet>
  );
}
