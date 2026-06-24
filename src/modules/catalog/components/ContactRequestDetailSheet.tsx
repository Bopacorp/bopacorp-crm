import { Calendar, Mail, MessageSquare, Phone, User, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/format.js';
import { ErrorState, SheetDetailSkeleton, StateBadge } from '@/shared/ui';
import { useContactRequest } from '../hooks/useContactRequest.js';

interface ContactRequestDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactRequestId: string | null;
}

const SKELETON_SECTIONS = [
  { rows: ['w-28', 'w-40', 'w-24'] },
  { rows: ['w-full'] },
  { rows: ['w-20', 'w-32'] },
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
      <span className="w-28 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-sm text-foreground">{children ?? '—'}</span>
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

export function ContactRequestDetailSheet({
  open,
  onOpenChange,
  contactRequestId,
}: ContactRequestDetailSheetProps) {
  const { contactRequest, loading, error, refetch } = useContactRequest(contactRequestId ?? '');

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
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <SectionLabel>Cliente</SectionLabel>
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
                  {contactRequest.clientPhone}
                </DetailField>
              </div>

              <div className="flex flex-col gap-1">
                <SectionLabel>Solicitud</SectionLabel>
                {contactRequest.message ? (
                  <div className="flex flex-col gap-1 px-2 py-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="size-4 shrink-0" />
                      <span>Mensaje</span>
                    </div>
                    <span className="whitespace-pre-wrap break-words pl-6 text-sm text-foreground">
                      {contactRequest.message}
                    </span>
                  </div>
                ) : (
                  <DetailField icon={MessageSquare} label="Mensaje">
                    Sin mensaje
                  </DetailField>
                )}
                <DetailField icon={Calendar} label="Recibida">
                  {formatDateTime(contactRequest.createdAt)}
                </DetailField>
              </div>

              <div className="flex flex-col gap-1">
                <SectionLabel>Estado</SectionLabel>
                <div className="flex items-start gap-3 rounded-md px-2 py-1.5">
                  <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="w-28 shrink-0 text-sm text-muted-foreground">Estado</span>
                  <StateBadge
                    state={contactRequest.isAttended ? 'ATTENDED' : 'PENDING'}
                    label={contactRequest.isAttended ? 'Atendido' : 'Pendiente'}
                    variant={contactRequest.isAttended ? 'default' : 'secondary'}
                  />
                </div>
                {contactRequest.attendedAt && (
                  <DetailField icon={Calendar} label="Atendida el">
                    {formatDateTime(contactRequest.attendedAt)}
                  </DetailField>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
