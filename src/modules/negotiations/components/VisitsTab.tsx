import type { VisitListItemResponse } from '@bopacorp/shared/crm';
import { CheckCircle, Loader2 } from 'lucide-react';
import { EmptyState, EntityTable, ErrorState } from '@/shared/ui';
import { useVisits } from '../hooks/useVisits.js';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const columns = [
  {
    id: 'date',
    header: 'Fecha',
    accessor: (item: VisitListItemResponse) => formatDateTime(item.visitDate),
  },
  {
    id: 'type',
    header: 'Tipo',
    accessor: (item: VisitListItemResponse) => item.visitType.name,
  },
  {
    id: 'advisor',
    header: 'Asesor',
    accessor: (item: VisitListItemResponse) => item.advisor.username,
  },
  {
    id: 'verified',
    header: 'Verificada',
    accessor: (item: VisitListItemResponse) =>
      item.isVerified ? (
        <CheckCircle className="size-4 text-green-600" />
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
];

interface VisitsTabProps {
  clientId: string;
}

export function VisitsTab({ clientId }: VisitsTabProps) {
  const { visits, loading, error, refetch } = useVisits(1, { clientId });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (visits.length === 0) {
    return (
      <EmptyState title="No hay visitas registradas" description="Las visitas aparecerán aquí" />
    );
  }

  return <EntityTable data={visits} columns={columns} keyExtractor={(item) => item.id} />;
}
