import type { NegotiationDocumentListItemResponse } from '@bopacorp/shared/documents';
import { FileUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { useAdvisors } from '@/modules/org/hooks/useAdvisors.js';
import { usePageReset } from '@/shared/hooks/usePageReset.js';
import {
  EmptyState,
  EntityTable,
  ErrorState,
  FilterBar,
  PaginationFooter,
  SectionHeader,
  StateBadge,
  TableSkeleton,
} from '@/shared/ui';
import { DocumentActions } from '../components/DocumentActions.js';
import { DocumentUploadDialog } from '../components/DocumentUploadDialog.js';
import { useDocuments } from '../hooks/useDocuments.js';
import { documentStateLabel } from '../lib/state.js';

interface DocumentFilters {
  search: string;
  state: string;
  advisorId?: string;
}

const STATE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'PENDING_APPROVAL', label: 'Pendientes' },
  { value: 'ACCEPTED', label: 'Aceptados' },
  { value: 'REJECTED', label: 'Rechazados' },
];

function employeeName(emp: {
  user: { firstName: string | null; lastName: string | null; username: string };
}) {
  return emp.user.firstName && emp.user.lastName
    ? `${emp.user.firstName} ${emp.user.lastName}`
    : emp.user.username;
}

export default function DocumentationPage() {
  const { user, hasRole } = useAuth();
  const isAdvisor = hasRole('advisor');
  const { advisors } = useAdvisors();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<DocumentFilters>({ search: '', state: 'all' });
  const [uploadOpen, setUploadOpen] = useState(false);

  const effectiveAdvisorId = isAdvisor ? user?.id : filters.advisorId;

  const { documents, meta, loading, fetching, error, refetch } = useDocuments(page, {
    ...filters,
    advisorId: effectiveAdvisorId,
  });

  usePageReset([filters.search, filters.state, filters.advisorId], setPage);

  const advisorOptions = useMemo(
    () => advisors.map((emp) => ({ value: emp.userId, label: employeeName(emp) })),
    [advisors],
  );

  const columns = [
    {
      id: 'company',
      header: 'Empresa',
      accessor: (item: NegotiationDocumentListItemResponse) => (
        <span className="font-medium">{item.negotiation.client.businessName}</span>
      ),
    },
    {
      id: 'type',
      header: 'Tipo de documento',
      accessor: (item: NegotiationDocumentListItemResponse) => item.documentType.name,
    },
    {
      id: 'state',
      header: 'Estado',
      accessor: (item: NegotiationDocumentListItemResponse) => (
        <StateBadge state={item.state} label={documentStateLabel(item.state)} />
      ),
    },
    {
      id: 'uploaded',
      header: 'Fecha de carga',
      accessor: (item: NegotiationDocumentListItemResponse) =>
        new Date(item.uploadedAt).toLocaleString('es-EC'),
    },
    {
      id: 'actions',
      header: 'Acciones',
      accessor: (item: NegotiationDocumentListItemResponse) => (
        <DocumentActions document={item} onSuccess={refetch} />
      ),
    },
  ];

  if (loading) return <TableSkeleton columns={columns.length} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        fetching && 'opacity-60 pointer-events-none transition-opacity',
      )}
    >
      <SectionHeader
        title="Documentación"
        description="Gestión de documentos comerciales y flujo de aprobación"
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <FileUp data-icon="inline-start" />
            Subir documento
          </Button>
        }
      />

      <FilterBar
        searchValue={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        searchPlaceholder="Buscar por empresa..."
        filters={[
          {
            id: 'state',
            placeholder: 'Estado',
            value: filters.state,
            onChange: (state) => setFilters((f) => ({ ...f, state })),
            options: STATE_OPTIONS,
          },
          ...(!isAdvisor
            ? [
                {
                  id: 'advisor',
                  placeholder: 'Asesor',
                  value: filters.advisorId ?? 'all',
                  onChange: (value: string) =>
                    setFilters((f) => ({ ...f, advisorId: value === 'all' ? undefined : value })),
                  options: [{ value: 'all', label: 'Todos' }, ...advisorOptions],
                  searchable: true,
                },
              ]
            : []),
        ]}
      />

      {documents.length === 0 ? (
        filters.search || filters.state !== 'all' || (!isAdvisor && filters.advisorId) ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron documentos con los filtros aplicados"
          />
        ) : (
          <EmptyState
            title="No hay documentos"
            description="Los documentos pendientes de aprobación aparecerán aquí"
          />
        )
      ) : (
        <>
          <EntityTable data={documents} columns={columns} keyExtractor={(item) => item.id} />
          <PaginationFooter
            page={page}
            onPageChange={setPage}
            pageSize={10}
            onPageSizeChange={() => {}}
            meta={meta ? { totalItems: meta.totalItems, totalPages: meta.totalPages } : null}
          />
        </>
      )}

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
