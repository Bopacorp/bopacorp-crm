import type { OfferMatrixListItemResponse } from '@bopacorp/shared/matrices';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatRelativeTime } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { Can } from '@/modules/auth/components/Can.js';
import { CreateMatrixDialog } from '@/modules/matrices/components/CreateMatrixDialog.js';
import { useMatrices } from '@/modules/matrices/hooks/useMatrices.js';
import { matrixStateLabel } from '@/modules/matrices/lib/state.js';
import { EmptyState, EntityTable, ErrorState, StateBadge, TableSkeleton } from '@/shared/ui';

interface MatricesTabProps {
  negotiationId: string;
}

export function MatricesTab({ negotiationId }: MatricesTabProps) {
  const navigate = useNavigate();
  const { matrices, loading, fetching, error, refetch } = useMatrices(negotiationId);
  const [createOpen, setCreateOpen] = useState(false);

  const columns = [
    {
      id: 'state',
      header: 'Estado',
      accessor: (item: OfferMatrixListItemResponse) => (
        <StateBadge state={item.state} label={matrixStateLabel(item.state)} />
      ),
    },
    {
      id: 'total',
      header: 'Total',
      accessor: (item: OfferMatrixListItemResponse) => formatCurrency(item.totalAmount),
    },
    {
      id: 'subsidy',
      header: 'Subsidio',
      accessor: (item: OfferMatrixListItemResponse) => formatCurrency(item.calculatedSubsidy),
    },
    {
      id: 'creator',
      header: 'Creador',
      accessor: (item: OfferMatrixListItemResponse) => item.creator.username,
    },
    {
      id: 'date',
      header: 'Fecha',
      accessor: (item: OfferMatrixListItemResponse) => formatRelativeTime(item.createdAt),
    },
  ];

  if (loading) return <TableSkeleton columns={5} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        fetching && 'pointer-events-none opacity-60 transition-opacity',
      )}
    >
      <div className="flex justify-end">
        <Can permission="offer_matrices.create">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            Nueva matriz
          </Button>
        </Can>
      </div>

      {matrices.length === 0 ? (
        <EmptyState
          title="Sin matrices"
          description="No hay matrices de oferta para esta negociación"
        />
      ) : (
        <EntityTable
          data={matrices}
          columns={columns}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => navigate(`/negociaciones/matrices/${item.id}`)}
        />
      )}

      <CreateMatrixDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        negotiationId={negotiationId}
      />
    </div>
  );
}
