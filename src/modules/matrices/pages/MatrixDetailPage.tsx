import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  Loader2,
  Settings,
  Trash2,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { ErrorState, SectionHeader, StateBadge, TableSkeleton } from '@/shared/ui';
import { AttachmentsTab } from '../components/AttachmentsTab.js';
import { ChangeMatrixStateDialog } from '../components/ChangeMatrixStateDialog.js';
import { HistoryTab } from '../components/HistoryTab.js';
import { LineItemsTab } from '../components/LineItemsTab.js';
import { useMatrix } from '../hooks/useMatrix.js';
import { getValidTransitions, matrixStateLabel } from '../lib/state.js';
import { deleteMatrix } from '../matrices.service.js';

export default function MatrixDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { matrix, loading, error, refetch } = useMatrix(id ?? '');
  const [stateDialogOpen, setStateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteMatrix(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.all });
      navigate(-1);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (loading) return <TableSkeleton columns={4} />;
  if (error || !matrix) return <ErrorState error={error} onRetry={refetch} />;

  const canDelete = matrix.state === 'DRAFT' || matrix.state === 'REJECTED';
  const canChangeState = getValidTransitions(matrix.state).length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <SectionHeader
        title={`Matriz — ${matrix.negotiation.client.businessName}`}
        description={`Creada ${formatRelativeTime(matrix.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to={`/negociaciones/${matrix.negotiation.id}`}>
                <ArrowLeft data-icon="inline-start" />
                Volver
              </Link>
            </Button>

            {canChangeState && (
              <Can permission="offer_matrices.change_state">
                <Button variant="outline" onClick={() => setStateDialogOpen(true)}>
                  <Settings data-icon="inline-start" />
                  Cambiar estado
                </Button>
              </Can>
            )}

            {canDelete && (
              <Can permission="offer_matrices.delete">
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 data-icon="inline-start" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar matriz</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. La matriz y sus líneas serán eliminadas
                        permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleteMutation.isPending}>
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          deleteMutation.mutate();
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending && (
                          <Loader2 data-icon="inline-start" className="animate-spin" />
                        )}
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Can>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>Información</SectionLabel>
          <DetailField icon={Building2} label="Cliente">
            {matrix.negotiation.client.businessName}
          </DetailField>
          <DetailField icon={Settings} label="Estado">
            <StateBadge state={matrix.state} label={matrixStateLabel(matrix.state)} />
          </DetailField>
          {matrix.observations && (
            <DetailField icon={FileText} label="Observaciones">
              {matrix.observations}
            </DetailField>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel>Financiero</SectionLabel>
          <DetailField icon={DollarSign} label="Total">
            {formatCurrency(matrix.totalAmount)}
          </DetailField>
          <DetailField icon={DollarSign} label="Subsidio">
            {formatCurrency(matrix.calculatedSubsidy)}
          </DetailField>
          <DetailField icon={Settings} label="Estrategia">
            {matrix.subsidyStrategy}
          </DetailField>
        </div>

        {matrix.state === 'APPROVED' && matrix.approvedBy && (
          <div className="flex flex-col gap-1">
            <SectionLabel>Aprobación</SectionLabel>
            <DetailField icon={CheckCircle} label="Aprobado por">
              {matrix.approvedBy.username}
            </DetailField>
            {matrix.approvalDate && (
              <DetailField icon={Calendar} label="Fecha">
                {formatDateTime(matrix.approvalDate)}
              </DetailField>
            )}
            {matrix.supervisorMessage && (
              <DetailField icon={FileText} label="Mensaje">
                {matrix.supervisorMessage}
              </DetailField>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <SectionLabel>Auditoría</SectionLabel>
          <DetailField icon={User} label="Creador">
            {matrix.creator.profile
              ? `${matrix.creator.profile.firstName} ${matrix.creator.profile.lastName}`
              : matrix.creator.username}
          </DetailField>
          <DetailField icon={Calendar} label="Creado">
            {formatRelativeTime(matrix.createdAt)}
          </DetailField>
          <DetailField icon={Calendar} label="Actualizado">
            {formatRelativeTime(matrix.updatedAt)}
          </DetailField>
        </div>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Líneas de oferta</TabsTrigger>
          <TabsTrigger value="attachments">Adjuntos</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="mt-4">
          <LineItemsTab matrixId={matrix.id} matrixState={matrix.state} />
        </TabsContent>
        <TabsContent value="attachments" className="mt-4">
          <AttachmentsTab matrixId={matrix.id} matrixState={matrix.state} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryTab matrixId={matrix.id} />
        </TabsContent>
      </Tabs>

      <ChangeMatrixStateDialog
        open={stateDialogOpen}
        onOpenChange={setStateDialogOpen}
        matrixId={matrix.id}
        currentState={matrix.state}
        onSuccess={refetch}
      />
    </div>
  );
}

function DetailField({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md px-2 py-1.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="w-28 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-sm text-foreground">{children ?? '—'}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </span>
  );
}
