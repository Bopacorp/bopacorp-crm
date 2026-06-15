import type { VisitListItemResponse } from '@bopacorp/shared/crm';
import { CheckCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/format.js';
import { EmptyState, EntityTable, ErrorState, TableSkeleton } from '@/shared/ui';
import { useVisits } from '../hooks/useVisits.js';

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
        <CheckCircle className="size-4 text-primary" />
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

  if (loading) return <TableSkeleton columns={4} rows={3} />;

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (visits.length === 0) {
    return (
      <EmptyState title="No hay visitas registradas" description="Las visitas aparecerán aquí" />
    );
  }

  return <EntityTable data={visits} columns={columns} keyExtractor={(item) => item.id} />;
}
