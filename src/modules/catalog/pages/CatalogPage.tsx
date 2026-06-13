import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, EntityTable, FilterBar, SectionHeader, StateBadge } from '@/shared/ui';

interface Matrix {
  id: string;
  name: string;
  carrier: string;
  state: string;
  createdAt: string;
  lineItemsCount: number;
}

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const matrices: Matrix[] = [];

  const columns = [
    {
      id: 'name',
      header: 'Nombre',
      accessor: (item: Matrix) => <span className="font-medium">{item.name}</span>,
    },
    {
      id: 'carrier',
      header: 'Carrier',
      accessor: (item: Matrix) => item.carrier,
    },
    {
      id: 'state',
      header: 'Estado',
      accessor: (item: Matrix) => <StateBadge state={item.state} />,
    },
    {
      id: 'items',
      header: 'Líneas',
      accessor: (item: Matrix) => item.lineItemsCount,
    },
    {
      id: 'created',
      header: 'Fecha de creación',
      accessor: (item: Matrix) => item.createdAt,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Catálogo"
        description="Matrices de oferta y construcción de paquetes comerciales"
        actions={
          <Button>
            <Plus data-icon="inline-start" />
            Nueva matriz
          </Button>
        }
      />

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar matrices..."
        filters={[
          {
            id: 'state',
            placeholder: 'Estado',
            options: [
              { value: 'all', label: 'Todos' },
              { value: 'draft', label: 'Borrador' },
              { value: 'pending', label: 'Pendiente' },
              { value: 'approved', label: 'Aprobado' },
            ],
          },
        ]}
      />

      {matrices.length === 0 ? (
        <EmptyState
          title="No hay matrices"
          description="Crea tu primera matriz de oferta para comenzar"
        />
      ) : (
        <EntityTable data={matrices} columns={columns} keyExtractor={(item) => item.id} />
      )}
    </div>
  );
}
