import type { BusinessClientResponse, UpdateBusinessClientRequest } from '@bopacorp/shared/crm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Building2,
  DollarSign,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Settings,
  Trash2,
  User,
  UserCheck,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';

import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog, ErrorState, SheetDetailSkeleton, StateBadge } from '@/shared/ui';
import { deleteBusinessClient, updateBusinessClient } from '../clients.service.js';
import { useBusinessClient } from '../hooks/useBusinessClient.js';
import type { BusinessClientFormValues } from './BusinessClientForm.js';
import { BusinessClientForm } from './BusinessClientForm.js';

interface BusinessClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

function advisorDisplayName(advisor: BusinessClientResponse['advisor']): string {
  if (!advisor) return '—';
  if (advisor.profile) return `${advisor.profile.firstName} ${advisor.profile.lastName}`;
  return advisor.username;
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

const CLIENT_SKELETON_SECTIONS = [
  { rows: ['w-28', 'w-40', 'w-16'] },
  { labelWidth: 'w-16', rows: ['w-36', 'w-24', 'w-44', 'w-48'] },
  { labelWidth: 'w-16', rows: ['w-12', 'w-20', 'w-36'] },
];

export function BusinessClientSheet({ open, onOpenChange, clientId }: BusinessClientSheetProps) {
  const queryClient = useQueryClient();
  const { client, loading, error, refetch } = useBusinessClient(clientId);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const onClose = useCallback(() => onOpenChange(false), [onOpenChange]);
  const onBack = useCallback(() => setEditing(false), []);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose, onBack });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBusinessClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.businessClients.all });
      toast.success('Cliente eliminado');
      setShowDelete(false);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setShowDelete(false);
    },
  });

  useEffect(() => {
    if (!open) {
      setEditing(false);
      dirtyRef.current = false;
    }
  }, [open, dirtyRef]);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      guardedAction('close');
    } else {
      onOpenChange(true);
    }
  };

  const showViewHeader = !loading && !error && client && !editing;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {editing && (
                <Button variant="ghost" size="icon-sm" onClick={() => guardedAction('back')}>
                  <ArrowLeft />
                </Button>
              )}
              {loading && <SheetTitle className="sr-only">Cliente</SheetTitle>}
              {!showViewHeader && !loading && (
                <SheetTitle>{editing ? 'Editar cliente' : 'Cliente'}</SheetTitle>
              )}
            </div>
            <div className="flex items-center gap-1">
              {showViewHeader && (
                <>
                  <Can permission="business_clients.update">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
                      <Pencil />
                    </Button>
                  </Can>
                  <Can permission="business_clients.delete">
                    <Button variant="ghost" size="icon-sm" onClick={() => setShowDelete(true)}>
                      <Trash2 />
                    </Button>
                  </Can>
                </>
              )}
              <Button variant="ghost" size="icon-sm" onClick={() => guardedAction('close')}>
                <XIcon />
              </Button>
            </div>
          </div>
          {loading && (
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          )}
          {showViewHeader && (
            <div className="flex items-center gap-3">
              <Avatar size="lg" className="after:content-none">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getInitials(client.businessName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <SheetTitle className="text-lg">{client.businessName}</SheetTitle>
                {client.createdAt && (
                  <span className="text-xs text-muted-foreground">
                    Creado {timeAgo(client.createdAt)}
                  </span>
                )}
              </div>
            </div>
          )}
        </SheetHeader>

        {loading ? (
          <SheetDetailSkeleton sections={CLIENT_SKELETON_SECTIONS} />
        ) : error || !client ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : editing ? (
          <EditForm
            client={client}
            onSaved={() => setEditing(false)}
            onDirtyChange={handleDirtyChange}
          />
        ) : (
          <ViewMode client={client} />
        )}
      </SheetContent>

      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />

      <AlertDialog open={showDelete} onOpenChange={(v) => !v && setShowDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará {client?.businessName ?? 'este cliente'}. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
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
                  Eliminando…
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

function ViewMode({ client }: { client: BusinessClientResponse }) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>Información</SectionLabel>
          <DetailField icon={FileText} label="RUC">
            {client.ruc}
          </DetailField>
          <DetailField icon={Building2} label="Empresa">
            {client.businessName}
          </DetailField>
          <DetailField icon={Settings} label="Estado">
            <StateBadge
              state={client.isActive ? 'active' : 'inactive'}
              label={client.isActive ? 'Activo' : 'Inactivo'}
            />
          </DetailField>
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel>Contacto</SectionLabel>
          <DetailField icon={User} label="Nombre">
            {client.contactName}
          </DetailField>
          <DetailField icon={Phone} label="Teléfono">
            {client.contactPhone ? (
              <a href={`tel:${client.contactPhone}`} className="text-primary hover:underline">
                {client.contactPhone}
              </a>
            ) : (
              '—'
            )}
          </DetailField>
          <DetailField icon={Mail} label="Email">
            {client.contactEmail ? (
              <a href={`mailto:${client.contactEmail}`} className="text-primary hover:underline">
                {client.contactEmail}
              </a>
            ) : (
              '—'
            )}
          </DetailField>
          <DetailField icon={MapPin} label="Dirección">
            {client.address || '—'}
          </DetailField>
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel>Métricas</SectionLabel>
          <DetailField icon={Settings} label="Servicios">
            {client.activeServicesCount}
          </DetailField>
          <DetailField icon={DollarSign} label="Facturación">
            {formatCurrency(client.currentMonthlyBilling)}
          </DetailField>
          <DetailField icon={UserCheck} label="Asesor">
            {advisorDisplayName(client.advisor)}
          </DetailField>
        </div>
      </div>
    </div>
  );
}

function EditForm({
  client,
  onSaved,
  onDirtyChange,
}: {
  client: BusinessClientResponse;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: UpdateBusinessClientRequest) => updateBusinessClient(client.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.businessClients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.negotiations.all });
      toast.success('Cliente actualizado');
      onSaved();
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const handleSubmit = (values: BusinessClientFormValues) => {
    setFormError('');
    mutation.mutate({
      ruc: values.ruc,
      advisorId: values.advisorId || undefined,
      businessName: values.businessName,
      contactName: values.contactName,
      contactPhone: values.contactPhone || undefined,
      contactEmail: values.contactEmail || undefined,
      address: values.address || undefined,
      isActive: values.isActive,
    });
  };

  return (
    <BusinessClientForm
      defaultValues={{
        ruc: client.ruc,
        businessName: client.businessName,
        contactName: client.contactName,
        contactPhone: client.contactPhone ?? '',
        contactEmail: client.contactEmail ?? '',
        address: client.address ?? '',
        advisorId: client.advisor?.id ?? '',
        isActive: client.isActive,
      }}
      onSubmit={handleSubmit}
      isPending={mutation.isPending}
      error={formError}
      submitLabel="Guardar"
      showIsActive
      onDirtyChange={onDirtyChange}
    />
  );
}
