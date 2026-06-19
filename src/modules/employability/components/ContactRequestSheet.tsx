import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Settings,
  User,
  XIcon,
} from 'lucide-react';
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

const SKELETON_SECTIONS = [
  { rows: ['w-28', 'w-40', 'w-24', 'w-56'] },
  { rows: ['w-16', 'w-28', 'w-24'] },
];

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
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <SectionLabel>Contacto</SectionLabel>
                  <DetailField icon={User} label="Nombre">
                    {contactRequest.clientName}
                  </DetailField>
                  <DetailField icon={Mail} label="Email">
                    <a
                      href={`mailto:${contactRequest.clientEmail}`}
                      className="text-primary hover:underline"
                    >
                      {contactRequest.clientEmail}
                    </a>
                  </DetailField>
                  <DetailField icon={Phone} label="Teléfono">
                    {contactRequest.clientPhone ? (
                      <a
                        href={`tel:${contactRequest.clientPhone}`}
                        className="text-primary hover:underline"
                      >
                        {contactRequest.clientPhone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </DetailField>
                  <DetailField icon={MessageSquare} label="Mensaje">
                    {contactRequest.message ? (
                      <p className="whitespace-pre-wrap">{contactRequest.message}</p>
                    ) : (
                      '—'
                    )}
                  </DetailField>
                </div>

                <div className="flex flex-col gap-1">
                  <SectionLabel>Estado</SectionLabel>
                  <DetailField icon={Settings} label="Estado">
                    <StateBadge
                      state={contactRequest.isAttended ? 'active' : 'pending'}
                      label={contactRequest.isAttended ? 'Atendido' : 'Pendiente'}
                    />
                  </DetailField>
                  <DetailField icon={Calendar} label="Recibido">
                    {formatRelativeTime(contactRequest.createdAt)}
                  </DetailField>
                  {contactRequest.attendedAt && (
                    <DetailField icon={Calendar} label="Atendido">
                      {formatRelativeTime(contactRequest.attendedAt)}
                    </DetailField>
                  )}
                </div>
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
