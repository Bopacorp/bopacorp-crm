import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  CalendarClock,
  MessageSquare,
  Pencil,
  RefreshCw,
  User,
  UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBreadcrumbTitle } from '@/app/BreadcrumbTitleContext.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/format.js';
import { Can } from '@/modules/auth/components/Can.js';
import { useClientSheet } from '@/modules/clients/context/ClientSheetContext.js';
import { DetailSkeleton, EmptyState, ErrorState, StateBadge } from '@/shared/ui';
import { ChangeStateDialog } from '../components/ChangeStateDialog.js';
import { EditNegotiationSheet } from '../components/EditNegotiationSheet.js';
import { HistoryTab } from '../components/HistoryTab.js';
import { VisitsTab } from '../components/VisitsTab.js';
import { useNegotiation } from '../hooks/useNegotiation.js';
import { useNegotiationStates } from '../hooks/useNegotiationStates.js';

function advisorName(advisor: {
  username: string;
  profile: { firstName: string; lastName: string } | null;
}): string {
  if (advisor.profile) return `${advisor.profile.firstName} ${advisor.profile.lastName}`;
  return advisor.username;
}

export default function NegotiationDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { negotiation, loading, error, refetch } = useNegotiation(id);
  const { states } = useNegotiationStates();
  const { openClientSheet } = useClientSheet();
  const [changeStateOpen, setChangeStateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useBreadcrumbTitle(negotiation?.client.businessName ?? null);

  if (loading) return <DetailSkeleton fields={4} tabs={4} />;
  if (error || !negotiation) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => openClientSheet(negotiation.client.id)}>
          <h1 className="text-lg font-semibold text-primary hover:underline">
            {negotiation.client.businessName}
          </h1>
        </button>
        <StateBadge state={negotiation.state.code} label={negotiation.state.name} />
        {states.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Etapa {states.find((s) => s.id === negotiation.state.id)?.position ?? '?'} de{' '}
            {states.length}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Can permission="negotiations.update">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil data-icon="inline-start" />
              Editar
            </Button>
          </Can>
          <Can permission="negotiations.change_state">
            <Button variant="outline" size="sm" onClick={() => setChangeStateOpen(true)}>
              <RefreshCw data-icon="inline-start" />
              Cambiar estado
            </Button>
          </Can>
        </div>
      </div>

      <Card>
        <CardHeader>
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Detalles
          </span>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1 md:grid-cols-2">
            <DetailField icon={User} label="Contacto">
              {negotiation.client.contactName}
            </DetailField>
            <DetailField icon={UserCheck} label="Asesor">
              {advisorName(negotiation.advisor)}
            </DetailField>
            <DetailField icon={Calendar} label="Fecha inicio">
              {formatDate(negotiation.startDate)}
            </DetailField>
            <DetailField icon={CalendarClock} label="Cierre est.">
              {formatDate(negotiation.estimatedCloseDate)}
            </DetailField>
            {negotiation.observations && (
              <div className="md:col-span-2">
                <DetailField icon={MessageSquare} label="Observaciones">
                  {negotiation.observations}
                </DetailField>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="visits">Visitas</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="matrices">Matrices</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="mt-4">
          <HistoryTab negotiationId={id} />
        </TabsContent>
        <TabsContent value="visits" className="mt-4">
          <VisitsTab clientId={negotiation.client.id} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <EmptyState title="Sin documentos" description="Documentos disponibles próximamente" />
        </TabsContent>
        <TabsContent value="matrices" className="mt-4">
          <EmptyState title="Sin matrices" description="Matrices disponibles próximamente" />
        </TabsContent>
      </Tabs>

      <EditNegotiationSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        negotiation={negotiation}
        onSuccess={refetch}
      />

      <ChangeStateDialog
        open={changeStateOpen}
        onOpenChange={setChangeStateOpen}
        negotiationId={id}
        currentStateId={negotiation.state.id}
        onSuccess={refetch}
      />
    </div>
  );
}

function DetailField({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
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
