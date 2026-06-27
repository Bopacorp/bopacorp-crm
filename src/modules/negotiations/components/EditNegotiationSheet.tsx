import type { NegotiationResponse, UpdateNegotiationRequest } from '@bopacorp/shared/crm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { queryKeys } from '@/lib/query-keys.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { useAdvisors } from '@/modules/org/hooks/useAdvisors.js';
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog } from '@/shared/ui';
import { useNegotiationStates } from '../hooks/useNegotiationStates.js';
import { updateNegotiation } from '../negotiations.service.js';
import type { NegotiationFormValues } from './NegotiationForm.js';
import { NegotiationForm } from './NegotiationForm.js';

interface EditNegotiationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiation: NegotiationResponse;
  onSuccess: () => void;
}

type ServerFieldError = { field: string; message: string };

function employeeName(emp: {
  user: { firstName: string | null; lastName: string | null; username: string };
}) {
  return emp.user.firstName && emp.user.lastName
    ? `${emp.user.firstName} ${emp.user.lastName}`
    : emp.user.username;
}

export function EditNegotiationSheet({
  open,
  onOpenChange,
  negotiation,
  onSuccess,
}: EditNegotiationSheetProps) {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const { states } = useNegotiationStates();
  const { advisors } = useAdvisors();
  const canAssignAdvisor = hasRole('admin') || hasRole('supervisor');

  const [key, setKey] = useState(0);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ServerFieldError[]>([]);

  const forceClose = useCallback(() => {
    setKey((k) => k + 1);
    setError('');
    setFieldErrors([]);
    onOpenChange(false);
  }, [onOpenChange]);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose: forceClose });

  const advisorOptions = useMemo(
    () =>
      advisors
        .map((emp) => ({ value: emp.userId, label: employeeName(emp) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [advisors],
  );

  const defaultValues: NegotiationFormValues = {
    clientId: negotiation.client.id,
    stateId: negotiation.state.id,
    advisorId: negotiation.advisor.id,
    startDate: negotiation.startDate ?? undefined,
    estimatedCloseDate: negotiation.estimatedCloseDate ?? undefined,
    observations: negotiation.observations ?? undefined,
    isActive: negotiation.isActive,
  };

  const mutation = useMutation({
    mutationFn: (data: UpdateNegotiationRequest) => updateNegotiation(negotiation.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.negotiations.all });
      toast.success(t('common.entityUpdated', { entity: t('negotiations.title') }));
      dirtyRef.current = false;
      setFieldErrors([]);
      forceClose();
      onSuccess();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details?.length) {
        setError('');
        setFieldErrors(err.details.map((d) => ({ field: d.field, message: d.message })));
        return;
      }

      setFieldErrors([]);
      setError(getErrorMessage(err));
    },
  });

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      guardedAction('close');
    } else {
      onOpenChange(true);
    }
  };

  const handleSubmit = (values: NegotiationFormValues) => {
    setError('');
    setFieldErrors([]);
    mutation.mutate({
      stateId: values.stateId,
      advisorId: values.advisorId || undefined,
      startDate: values.startDate || undefined,
      estimatedCloseDate: values.estimatedCloseDate || undefined,
      observations: values.observations || undefined,
      isActive: values.isActive,
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('negotiations.editNegotiation')}</SheetTitle>
        </SheetHeader>
        <NegotiationForm
          key={key}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
          error={error}
          fieldErrors={fieldErrors}
          submitLabel={t('common.save')}
          onDirtyChange={handleDirtyChange}
          stateOptions={states}
          stateLabel={t('common.status')}
          clientReadOnly
          clientName={negotiation.client.businessName}
          showAdvisorField={canAssignAdvisor}
          advisorOptions={advisorOptions}
          showIsActive
        />
      </SheetContent>

      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />
    </Sheet>
  );
}
