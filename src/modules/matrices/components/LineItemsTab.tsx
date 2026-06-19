import type { MatrixLineItemListItemResponse, MatrixState } from '@bopacorp/shared/matrices';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { EmptyState, EntityTable, ErrorState, TableSkeleton } from '@/shared/ui';
import { useMatrixLineItems } from '../hooks/useMatrixLineItems.js';
import { deleteLineItem } from '../matrices.service.js';
import { AddLineItemDialog } from './AddLineItemDialog.js';

interface LineItemsTabProps {
  matrixId: string;
  matrixState: MatrixState;
}

export function LineItemsTab({ matrixId, matrixState }: LineItemsTabProps) {
  const queryClient = useQueryClient();
  const { lineItems, loading, error, refetch } = useMatrixLineItems(matrixId);
  const isDraft = matrixState === 'DRAFT';
  const [addOpen, setAddOpen] = useState(false);

  const removeMutation = useMutation({
    mutationFn: (lineItemId: string) => deleteLineItem(matrixId, lineItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.lineItems(matrixId) });
      toast.success('Línea eliminada');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns = [
    {
      id: 'product',
      header: 'Producto',
      accessor: (item: MatrixLineItemListItemResponse) => (
        <span className="font-medium">{item.item.name}</span>
      ),
    },
    {
      id: 'quantity',
      header: 'Cantidad',
      accessor: (item: MatrixLineItemListItemResponse) => item.quantity,
    },
    {
      id: 'unitPrice',
      header: 'Precio unitario',
      accessor: (item: MatrixLineItemListItemResponse) => formatCurrency(item.unitPrice),
    },
    {
      id: 'total',
      header: 'Total',
      accessor: (item: MatrixLineItemListItemResponse) => formatCurrency(item.total),
    },
    ...(isDraft
      ? [
          {
            id: 'actions',
            header: '',
            accessor: (item: MatrixLineItemListItemResponse) => (
              <Can permission="matrix_line_items.delete">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    removeMutation.mutate(item.id);
                  }}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </Can>
            ),
          },
        ]
      : []),
  ];

  if (loading) return <TableSkeleton columns={4} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-4">
      {isDraft && (
        <Can permission="matrix_line_items.create">
          <div className="flex justify-end">
            <Button onClick={() => setAddOpen(true)}>
              <Plus data-icon="inline-start" />
              Agregar línea
            </Button>
          </div>
        </Can>
      )}

      {lineItems.length === 0 ? (
        <EmptyState
          title="Sin líneas de oferta"
          description="No hay productos agregados a esta matriz"
        />
      ) : (
        <EntityTable data={lineItems} columns={columns} keyExtractor={(item) => item.id} />
      )}

      <AddLineItemDialog open={addOpen} onOpenChange={setAddOpen} matrixId={matrixId} />
    </div>
  );
}
