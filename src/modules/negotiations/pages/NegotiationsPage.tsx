import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, EntityTable, FilterBar, SectionHeader, StateBadge } from '@/shared/ui';

interface Negotiation {
  id: string;
  company: string;
  state: string;
  assignedTo: string;
  lastVisit: string;
}

export default function NegotiationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const negotiations: Negotiation[] = [];

  const columns = [
    {
      id: 'company',
      header: 'Empresa',
      accessor: (item: Negotiation) => <span className="font-medium">{item.company}</span>,
    },
    {
      id: 'state',
      header: 'Estado',
      accessor: (item: Negotiation) => <StateBadge state={item.state} />,
    },
    {
      id: 'assignedTo',
      header: 'Asignado a',
      accessor: (item: Negotiation) => item.assignedTo,
    },
    {
      id: 'lastVisit',
      header: 'Última visita',
      accessor: (item: Negotiation) => item.lastVisit,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Negociaciones"
        description="Gestión de cuentas, contratos y visitas comerciales"
        actions={
          <Button>
            <Plus data-icon="inline-start" />
            Nueva negociación
          </Button>
        }
      />

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por empresa..."
        filters={[
          {
            id: 'state',
            placeholder: 'Estado',
            options: [
              { value: 'all', label: 'Todos' },
              { value: 'active', label: 'Activas' },
              { value: 'pending', label: 'Pendientes' },
              { value: 'closed', label: 'Cerradas' },
            ],
          },
        ]}
      />

      {negotiations.length === 0 ? (
        <EmptyState
          title="No hay negociaciones"
          description="Crea tu primera negociación para comenzar"
        />
      ) : (
        <EntityTable data={negotiations} columns={columns} keyExtractor={(item) => item.id} />
      )}
    </div>
  );
}
