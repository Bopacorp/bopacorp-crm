import type { OfferMatrixListItemResponse } from '@bopacorp/shared/matrices';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { Can } from '@/modules/auth/components/Can.js';
import { CreateMatrixSheet } from '@/modules/matrices/components/CreateMatrixSheet.js';
import { MatrixSheet } from '@/modules/matrices/components/MatrixSheet.js';
import { useMatrices } from '@/modules/matrices/hooks/useMatrices.js';
import { EmptyState, EntityTable, ErrorState, TableSkeleton } from '@/shared/ui';

interface MatricesTabProps {
  negotiationId: string;
}

export function MatricesTab({ negotiationId }: MatricesTabProps) {
  const { matrices, loading, fetching, error, refetch } = useMatrices(negotiationId);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMatrixId, setSelectedMatrixId] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);

  const columns = [
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

  if (loading) return <TableSkeleton columns={2} />;
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
          onRowClick={(item) => {
            setSelectedMatrixId(item.id);
            setDetailOpen(true);
          }}
        />
      )}

      <CreateMatrixSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        negotiationId={negotiationId}
        onSuccess={refetch}
      />

      {selectedMatrixId && (
        <MatrixSheet open={detailOpen} onOpenChange={setDetailOpen} matrixId={selectedMatrixId} />
      )}
    </div>
  );
}
