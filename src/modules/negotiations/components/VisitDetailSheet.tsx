import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  Tag,
  Trash2,
  User,
  XIcon,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatDateTime, formatRelativeTime } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { ErrorState, SheetDetailSkeleton } from '@/shared/ui';
import { useVisit } from '../hooks/useVisit.js';
import { deleteVisit } from '../negotiations.service.js';

interface VisitDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: string;
}

const SKELETON_SECTIONS = [
  { rows: ['w-40', 'w-56', 'w-48'] },
  { rows: ['w-36', 'w-36'] },
  { rows: ['w-28', 'w-28'] },
];

function advisorName(advisor: {
  username: string;
  profile: { firstName: string; lastName: string } | null;
}): string {
  if (advisor.profile) return `${advisor.profile.firstName} ${advisor.profile.lastName}`;
  return advisor.username;
}

function verifierName(verifier: {
  username: string;
  profile: { firstName: string; lastName: string } | null;
}): string {
  if (verifier.profile) return `${verifier.profile.firstName} ${verifier.profile.lastName}`;
  return verifier.username;
}

export function VisitDetailSheet({ open, onOpenChange, visitId }: VisitDetailSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { visit, loading, error, refetch } = useVisit(visitId);
  const [showDelete, setShowDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteVisit(visitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
      toast.success(t('visits.deleted'));
      setShowDelete(false);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setShowDelete(false);
    },
  });

  const showHeader = !loading && !error && visit;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              {loading && <SheetTitle className="sr-only">{t('visits.title')}</SheetTitle>}
              {showHeader && <SheetTitle>{t('visits.detail')}</SheetTitle>}
            </div>
            <div className="flex items-center gap-1">
              {showHeader && (
                <Can permission="visits.delete">
                  <Button variant="ghost" size="icon-sm" onClick={() => setShowDelete(true)}>
                    <Trash2 />
                  </Button>
                </Can>
              )}
              <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
                <XIcon />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {loading ? (
          <SheetDetailSkeleton sections={SKELETON_SECTIONS} />
        ) : error || !visit ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <SectionLabel>{t('common.information')}</SectionLabel>
                <DetailField icon={Tag} label={t('common.type')}>
                  {visit.visitType.name}
                </DetailField>
                <DetailField icon={Calendar} label={t('common.date')}>
                  {formatDateTime(visit.visitDate)}
                </DetailField>
                <DetailField icon={User} label={t('common.advisor')}>
                  {advisorName(visit.advisor)}
                </DetailField>
                <DetailField icon={Building2} label={t('negotiations.client')}>
                  {visit.client.businessName}
                </DetailField>
                {visit.observations && (
                  <DetailField icon={MessageSquare} label={t('common.observations')}>
                    {visit.observations}
                  </DetailField>
                )}
              </div>

              {(visit.gpsLatitude != null || visit.gpsLongitude != null) && (
                <div className="flex flex-col gap-1">
                  <SectionLabel>{t('visits.gps')}</SectionLabel>
                  <DetailField icon={MapPin} label={t('visits.latitude')}>
                    {visit.gpsLatitude}
                  </DetailField>
                  <DetailField icon={MapPin} label={t('visits.longitude')}>
                    {visit.gpsLongitude}
                  </DetailField>
                  {visit.gpsAccuracy != null && (
                    <DetailField icon={MapPin} label={t('visits.precision')}>
                      {visit.gpsAccuracy} m
                    </DetailField>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <SectionLabel>{t('visits.verification')}</SectionLabel>
                <div className="px-2 py-1.5">
                  {visit.isVerified ? (
                    <Badge variant="outline" className="gap-1 border-emerald-200 text-emerald-600">
                      <CheckCircle className="size-3" />
                      {t('visits.verified')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{t('common.pending')}</Badge>
                  )}
                </div>
                {visit.isVerified && visit.verifiedBy && (
                  <>
                    <DetailField icon={User} label={t('visits.verifiedBy')}>
                      {verifierName(visit.verifiedBy)}
                    </DetailField>
                    {visit.supervisorComment && (
                      <DetailField icon={MessageSquare} label={t('visits.comment')}>
                        {visit.supervisorComment}
                      </DetailField>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <SectionLabel>{t('visits.audit')}</SectionLabel>
                <DetailField icon={Clock} label={t('common.created')}>
                  {formatRelativeTime(visit.createdAt)}
                </DetailField>
                <DetailField icon={Clock} label={t('common.updated')}>
                  {formatRelativeTime(visit.updatedAt)}
                </DetailField>
              </div>
            </div>
          </div>
        )}
      </SheetContent>

      <AlertDialog open={showDelete} onOpenChange={(v) => !v && setShowDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('visits.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('visits.deleteDesc')}</AlertDialogDescription>
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
                  {t('common.deleting')}
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
