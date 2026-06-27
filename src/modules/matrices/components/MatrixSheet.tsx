import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Calendar, FileText, Loader2, Trash2, User, XIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatRelativeTime } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { ErrorState, SheetDetailSkeleton } from '@/shared/ui';
import { useMatrix } from '../hooks/useMatrix.js';
import { deleteMatrix } from '../matrices.service.js';
import { AttachmentsTab } from './AttachmentsTab.js';

interface MatrixSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matrixId: string;
}

const SKELETON_SECTIONS = [{ rows: ['w-40', 'w-56'] }, { rows: ['w-36', 'w-28', 'w-28'] }];

export function MatrixSheet({ open, onOpenChange, matrixId }: MatrixSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { matrix, loading, error, refetch } = useMatrix(matrixId);
  const [showDelete, setShowDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteMatrix(matrixId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.all });
      toast.success(t('matrices.deleted'));
      setShowDelete(false);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setShowDelete(false);
    },
  });

  const showHeader = !loading && !error && matrix;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              {loading && <SheetTitle className="sr-only">{t('matrices.matrix')}</SheetTitle>}
              {showHeader && <SheetTitle>{t('matrices.matrix')}</SheetTitle>}
            </div>
            <div className="flex items-center gap-1">
              {showHeader && (
                <Can permission="offer_matrices.delete">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowDelete(true)}
                    aria-label={t('matrices.deleteMatrix')}
                  >
                    <Trash2 />
                  </Button>
                </Can>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onOpenChange(false)}
                aria-label={t('common.close')}
              >
                <XIcon />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {loading ? (
          <SheetDetailSkeleton sections={SKELETON_SECTIONS} />
        ) : error || !matrix ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <SectionLabel>{t('common.information')}</SectionLabel>
                <DetailField icon={Building2} label={t('matrices.client')}>
                  {matrix.negotiation.client.businessName}
                </DetailField>
                {matrix.observations && (
                  <DetailField icon={FileText} label={t('common.observations')}>
                    {matrix.observations}
                  </DetailField>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <SectionLabel>{t('matrices.audit')}</SectionLabel>
                <DetailField icon={User} label={t('matrices.creator')}>
                  {matrix.creator.profile
                    ? `${matrix.creator.profile.firstName} ${matrix.creator.profile.lastName}`
                    : matrix.creator.username}
                </DetailField>
                <DetailField icon={Calendar} label={t('common.created')}>
                  {formatRelativeTime(matrix.createdAt)}
                </DetailField>
                <DetailField icon={Calendar} label={t('common.updated')}>
                  {formatRelativeTime(matrix.updatedAt)}
                </DetailField>
              </div>

              <AttachmentsTab matrixId={matrix.id} />
            </div>
          </div>
        )}
      </SheetContent>

      <AlertDialog open={showDelete} onOpenChange={(v) => !v && setShowDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('matrices.deleteMatrix')}</AlertDialogTitle>
            <AlertDialogDescription>{t('matrices.deleteMatrixDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t('matrices.deletingMatrix')}
                </>
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

function DetailField({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md px-2 py-1.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="w-24 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-sm text-foreground">{children ?? '—'}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </span>
  );
}
