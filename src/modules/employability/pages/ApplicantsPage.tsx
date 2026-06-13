import { Eye, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, EntityTable, FilterBar, SectionHeader, StateBadge } from '@/shared/ui';

interface Application {
  id: string;
  candidateName: string;
  vacancyTitle: string;
  appliedAt: string;
  status: string;
  hasResume: boolean;
}

export default function ApplicantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const applications: Application[] = [];

  const columns = [
    {
      id: 'candidate',
      header: 'Candidato',
      accessor: (item: Application) => <span className="font-medium">{item.candidateName}</span>,
    },
    {
      id: 'vacancy',
      header: 'Vacante',
      accessor: (item: Application) => item.vacancyTitle,
    },
    {
      id: 'applied',
      header: 'Fecha de aplicación',
      accessor: (item: Application) => item.appliedAt,
    },
    {
      id: 'status',
      header: 'Estado',
      accessor: (item: Application) => <StateBadge state={item.status} />,
    },
    {
      id: 'actions',
      header: 'Acciones',
      accessor: () => (
        <Button size="sm" variant="outline">
          <Eye data-icon="inline-start" />
          Ver detalle
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Aplicantes"
        description="Gestión de candidatos y aplicaciones a vacantes"
        actions={
          <Button>
            <Plus data-icon="inline-start" />
            Nueva vacante
          </Button>
        }
      />

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar candidatos..."
        filters={[
          {
            id: 'status',
            placeholder: 'Estado',
            options: [
              { value: 'all', label: 'Todos' },
              { value: 'pending', label: 'Pendiente' },
              { value: 'approved', label: 'Aprobado' },
              { value: 'rejected', label: 'Rechazado' },
            ],
          },
        ]}
      />

      {applications.length === 0 ? (
        <EmptyState
          title="No hay aplicaciones"
          description="Las aplicaciones de candidatos aparecerán aquí"
        />
      ) : (
        <EntityTable data={applications} columns={columns} keyExtractor={(item) => item.id} />
      )}
    </div>
  );
}
