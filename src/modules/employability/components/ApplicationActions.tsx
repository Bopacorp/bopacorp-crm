import type { JobApplicationListItemResponse } from '@bopacorp/shared/employability';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Download, Loader2, MoreHorizontal, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.js';
import { queryKeys } from '@/lib/query-keys.js';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import {
  downloadCandidateResume,
  getJobApplication,
  updateJobApplication,
} from '../employability.service.js';
import { RejectApplicationDialog } from './RejectApplicationDialog.js';

interface ApplicationActionsProps {
  application: JobApplicationListItemResponse;
  onSuccess?: () => void;
}

type ReviewState = 'idle' | 'loading' | 'success';

export function ApplicationActions({ application, onSuccess }: ApplicationActionsProps) {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const [reviewState, setReviewState] = useState<ReviewState>('idle');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => updateJobApplication(application.id, { state: 'ACCEPTED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employability.applications.all });
      setReviewState('success');
      setTimeout(() => setReviewState('idle'), 1500);
      onSuccess?.();
    },
    onError: (err) => {
      setReviewState('idle');
      toast.error(getErrorMessage(err));
    },
  });

  const handleReview = () => {
    setReviewState('loading');
    setMenuOpen(false);
    mutation.mutate();
  };

  const handleRejectClick = () => {
    setMenuOpen(false);
    setRejectOpen(true);
  };

  const canManageState = hasPermission('job_applications.update');
  const canReviewOrReject = canManageState && application.state === 'PENDING';
  const isReviewDisabled = reviewState !== 'idle' || mutation.isPending;
  const hasResume = application.hasResume;

  const handleDownloadResume = async () => {
    setMenuOpen(false);
    try {
      const app = await getJobApplication(application.id);
      if (!app.resume) {
        toast.error('No se encontró hoja de vida');
        return;
      }
      await downloadCandidateResume(app.resume.id, app.resume.filename);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!canReviewOrReject && !hasResume && reviewState === 'idle') return null;

  return (
    <div role="none" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {reviewState === 'loading' || reviewState === 'success' ? (
        <Button size="sm" variant="outline" disabled>
          {reviewState === 'loading' && (
            <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
          )}
          {reviewState === 'success' && (
            <CheckCircle data-icon="inline-start" className="size-4 text-green-600" />
          )}
          {reviewState === 'success' ? 'Revisado' : 'Revisando'}
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
            {hasResume && (
              <DropdownMenuItem onClick={handleDownloadResume}>
                <Download className="size-4" />
                Descargar CV
              </DropdownMenuItem>
            )}
            {canReviewOrReject && hasResume && <DropdownMenuSeparator />}
            {canReviewOrReject && (
              <>
                <DropdownMenuItem onClick={handleReview} disabled={isReviewDisabled}>
                  <CheckCircle className="size-4" />
                  Marcar revisado
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleRejectClick}
                  disabled={mutation.isPending}
                  variant="destructive"
                >
                  <XCircle className="size-4" />
                  Rechazar
                </DropdownMenuItem>
              </>
            )}
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
