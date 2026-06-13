import { CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, EntityTable, FilterBar, SectionHeader, StateBadge } from '@/shared/ui';

interface Document {
  id: string;
  negotiationId: string;
  companyName: string;
  documentType: string;
  state: string;
  uploadedAt: string;
}

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const documents: Document[] = [];

  const columns = [
    {
      id: 'company',
      header: 'Empresa',
      accessor: (item: Document) => <span className="font-medium">{item.companyName}</span>,
    },
    {
      id: 'type',
      header: 'Tipo de documento',
      accessor: (item: Document) => item.documentType,
    },
    {
      id: 'state',
      header: 'Estado',
      accessor: (item: Document) => <StateBadge state={item.state} />,
    },
    {
      id: 'uploaded',
      header: 'Fecha de carga',
      accessor: (item: Document) => item.uploadedAt,
    },
    {
      id: 'actions',
      header: 'Acciones',
      accessor: (item: Document) =>
        item.state === 'pending' ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <CheckCircle data-icon="inline-start" />
              Aprobar
            </Button>
            <Button size="sm" variant="outline">
              <XCircle data-icon="inline-start" />
              Rechazar
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Documentación"
        description="Gestión de documentos comerciales y flujo de aprobación"
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
              { value: 'pending', label: 'Pendientes' },
              { value: 'approved', label: 'Aprobados' },
              { value: 'rejected', label: 'Rechazados' },
            ],
          },
        ]}
      />

      {documents.length === 0 ? (
        <EmptyState
          title="No hay documentos"
          description="Los documentos pendientes de aprobación aparecerán aquí"
        />
      ) : (
        <EntityTable data={documents} columns={columns} keyExtractor={(item) => item.id} />
      )}
    </div>
  );
}
