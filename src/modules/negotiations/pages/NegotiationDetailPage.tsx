import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Can } from '@/modules/auth/components/Can.js';
import { useClientSheet } from '@/modules/clients/context/ClientSheetContext.js';
import { DetailSkeleton, EmptyState, ErrorState, StateBadge } from '@/shared/ui';
import { ChangeStateDialog } from '../components/ChangeStateDialog.js';
import { HistoryTab } from '../components/HistoryTab.js';
import { VisitsTab } from '../components/VisitsTab.js';
import { useNegotiation } from '../hooks/useNegotiation.js';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function advisorName(advisor: {
  username: string;
  profile: { firstName: string; lastName: string } | null;
}): string {
  if (advisor.profile) return `${advisor.profile.firstName} ${advisor.profile.lastName}`;
  return advisor.username;
}

export default function NegotiationDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { negotiation, loading, error, refetch } = useNegotiation(id);
  const { openClientSheet } = useClientSheet();
  const [changeStateOpen, setChangeStateOpen] = useState(false);

  if (loading) return <DetailSkeleton fields={4} tabs={4} />;
  if (error || !negotiation) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/negociaciones')}>
          <ArrowLeft data-icon="inline-start" />
          Volver
        </Button>
        <button type="button" onClick={() => openClientSheet(negotiation.client.id)}>
          <h1 className="text-xl font-semibold text-primary hover:underline">
            {negotiation.client.businessName}
          </h1>
        </button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <StateBadge state={negotiation.state.code} />
          <Can permission="negotiations.change_state">
            <Button variant="outline" size="sm" onClick={() => setChangeStateOpen(true)}>
              <RefreshCw data-icon="inline-start" />
              Cambiar estado
            </Button>
          </Can>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailField label="Contacto" value={negotiation.client.contactName} />
            <DetailField label="Asesor" value={advisorName(negotiation.advisor)} />
            <DetailField label="Fecha de inicio" value={formatDate(negotiation.startDate)} />
            <DetailField
              label="Cierre estimado"
              value={formatDate(negotiation.estimatedCloseDate)}
            />
            {negotiation.observations && (
              <div className="md:col-span-2">
                <DetailField label="Observaciones" value={negotiation.observations} />
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

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-base text-foreground">{value}</span>
    </div>
  );
}
