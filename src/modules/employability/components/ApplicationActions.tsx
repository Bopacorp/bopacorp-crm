import type { JobApplicationListItemResponse } from '@bopacorp/shared/employability';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2, MoreHorizontal, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.js';
import { queryKeys } from '@/lib/query-keys.js';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { updateJobApplication } from '../employability.service.js';
import { RejectApplicationDialog } from './RejectApplicationDialog.js';

interface ApplicationActionsProps {
  application: JobApplicationListItemResponse;
  onSuccess?: () => void;
}

type AcceptState = 'idle' | 'loading' | 'success';

export function ApplicationActions({ application, onSuccess }: ApplicationActionsProps) {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const [acceptState, setAcceptState] = useState<AcceptState>('idle');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => updateJobApplication(application.id, { state: 'ACCEPTED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employability.applications.all });
      setAcceptState('success');
      setTimeout(() => setAcceptState('idle'), 1500);
      onSuccess?.();
    },
    onError: (err) => {
      setAcceptState('idle');
      toast.error(getErrorMessage(err));
    },
  });

  const handleAccept = () => {
    setAcceptState('loading');
    setMenuOpen(false);
    mutation.mutate();
  };

  const handleRejectClick = () => {
    setMenuOpen(false);
    setRejectOpen(true);
  };

  const canManageState = hasPermission('job_applications.update');
  const canAcceptOrReject = canManageState && application.state === 'PENDING';
  const isAcceptDisabled = acceptState !== 'idle' || mutation.isPending;

  if (!canAcceptOrReject && acceptState === 'idle') return null;

  return (
    <div role="none" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {acceptState === 'loading' || acceptState === 'success' ? (
        <Button size="sm" variant="outline" disabled>
          {acceptState === 'loading' && (
            <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
          )}
          {acceptState === 'success' && (
            <CheckCircle data-icon="inline-start" className="size-4 text-green-600" />
          )}
          {acceptState === 'success' ? 'Aceptado' : 'Aceptando'}
        </Button>
      ) : (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <MoreHorizontal data-icon="inline-start" className="size-4" />
              Acciones
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleAccept} disabled={isAcceptDisabled}>
              <CheckCircle className="size-4" />
              Aceptar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleRejectClick}
              disabled={mutation.isPending}
              variant="destructive"
            >
              <XCircle className="size-4" />
              Rechazar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <RejectApplicationDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        applicationId={application.id}
        onSuccess={onSuccess}
      />
    </div>
  );
}
