import type { CreateNegotiationRequest } from '@bopacorp/shared/crm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { queryKeys } from '@/lib/query-keys.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { CreateBusinessClientDialog } from '@/modules/clients/components/CreateBusinessClientDialog.js';
import { useBusinessClients } from '@/modules/clients/hooks/useBusinessClients.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog } from '@/shared/ui';
import { useNegotiationStates } from '../hooks/useNegotiationStates.js';
import { createNegotiation } from '../negotiations.service.js';
import type { NegotiationFormValues } from './NegotiationForm.js';
import { NegotiationForm } from './NegotiationForm.js';

interface CreateNegotiationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EMPTY_VALUES: NegotiationFormValues = {
  clientId: '',
  stateId: '',
  startDate: '',
  estimatedCloseDate: '',
  observations: '',
};

export function CreateNegotiationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateNegotiationDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { states } = useNegotiationStates();
  const { clients } = useBusinessClients(1, {});

  const [key, setKey] = useState(0);
  const [error, setError] = useState('');
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [preselectedClientId, setPreselectedClientId] = useState('');

  const forceClose = useCallback(() => {
    setKey((k) => k + 1);
    setError('');
    setPreselectedClientId('');
    onOpenChange(false);
  }, [onOpenChange]);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose: forceClose });

  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.businessName })),
    [clients],
  );

  const mutation = useMutation({
    mutationFn: (data: CreateNegotiationRequest) => createNegotiation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.negotiations.all });
      toast.success('Negociación creada');
      dirtyRef.current = false;
      forceClose();
      onSuccess();
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

  const handleSubmit = (values: NegotiationFormValues) => {
    if (!user) return;
    setError('');

    mutation.mutate({
      clientId: values.clientId,
      advisorId: user.id,
      stateId: values.stateId,
      startDate: values.startDate || undefined,
      estimatedCloseDate: values.estimatedCloseDate || undefined,
      observations: values.observations || undefined,
      isActive: true,
    });
  };

  const defaultValues = preselectedClientId
    ? { ...EMPTY_VALUES, clientId: preselectedClientId }
    : EMPTY_VALUES;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nueva negociación</SheetTitle>
        </SheetHeader>
        <NegotiationForm
          key={key}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
          error={error}
          submitLabel="Crear"
          onDirtyChange={handleDirtyChange}
          clientOptions={clientOptions}
          stateOptions={states}
          showCreateClient
          onCreateClient={() => setCreateClientOpen(true)}
        />
      </SheetContent>

      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />

      <CreateBusinessClientDialog
        open={createClientOpen}
        onOpenChange={setCreateClientOpen}
        onSuccess={(client) => {
          setPreselectedClientId(client.id);
        }}
      />
    </Sheet>
  );
}
