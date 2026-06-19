import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatRelativeTime } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { updateContactRequest } from '@/modules/catalog/catalog.service.js';
import { useContactRequest } from '@/modules/catalog/hooks/useContactRequest.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { ErrorState, SheetDetailSkeleton, StateBadge } from '@/shared/ui';

interface ContactRequestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | null;
}

const SKELETON_SECTIONS = [{ rows: ['w-28', 'w-40', 'w-24', 'w-56', 'w-16', 'w-28'] }];

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-2 py-1.5">
      <span className="w-28 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-sm text-foreground">{children}</span>
    </div>
  );
}

export function ContactRequestSheet({ open, onOpenChange, requestId }: ContactRequestSheetProps) {
  const queryClient = useQueryClient();
  const { contactRequest, loading, error, refetch } = useContactRequest(requestId ?? '');

  const attendMutation = useMutation({
    mutationFn: () => updateContactRequest(requestId as string, { isAttended: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.contactRequests.all });
      if (requestId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.catalog.contactRequests.detail(requestId),
        });
      }
      toast.success('Solicitud marcada como atendida');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>
              {loading ? 'Solicitud' : (contactRequest?.clientName ?? 'Solicitud')}
            </SheetTitle>
            <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
              <XIcon />
            </Button>
          </div>
        </SheetHeader>

        {loading ? (
          <SheetDetailSkeleton sections={SKELETON_SECTIONS} />
        ) : error || !contactRequest ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-4">
                <DetailRow label="Nombre">{contactRequest.clientName}</DetailRow>
                <DetailRow label="Email">
                  <a
                    href={`mailto:${contactRequest.clientEmail}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {contactRequest.clientEmail}
                  </a>
                </DetailRow>
                <DetailRow label="Teléfono">
                  {contactRequest.clientPhone ? (
                    <a
                      href={`tel:${contactRequest.clientPhone}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {contactRequest.clientPhone}
                    </a>
                  ) : (
                    '—'
                  )}
                </DetailRow>
                <DetailRow label="Mensaje">
                  {contactRequest.message ? (
                    <p className="whitespace-pre-wrap">{contactRequest.message}</p>
                  ) : (
                    '—'
                  )}
                </DetailRow>
                <DetailRow label="Estado">
                  <StateBadge
                    state={contactRequest.isAttended ? 'active' : 'pending'}
                    label={contactRequest.isAttended ? 'Atendido' : 'Pendiente'}
                  />
                </DetailRow>
                <DetailRow label="Recibido">
                  {formatRelativeTime(contactRequest.createdAt)}
                </DetailRow>
                {contactRequest.attendedAt && (
                  <DetailRow label="Atendido">
                    {formatRelativeTime(contactRequest.attendedAt)}
                  </DetailRow>
                )}
              </div>
            </div>

            {!contactRequest.isAttended && (
              <SheetFooter>
                <Can permission="contact_requests.update">
                  <Button
                    onClick={() => attendMutation.mutate()}
                    disabled={attendMutation.isPending}
                  >
                    {attendMutation.isPending ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <CheckCircle data-icon="inline-start" />
                    )}
                    Marcar como atendido
                  </Button>
                </Can>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
