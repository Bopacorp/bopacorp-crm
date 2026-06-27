import type { SalesObjectiveListItemResponse } from '@bopacorp/shared/reports';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format.js';
import { cn } from '@/lib/utils.js';
import { Can } from '@/modules/auth/components/Can.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { usePageReset } from '@/shared/hooks/usePageReset.js';
import {
  EmptyState,
  EntityTable,
  ErrorState,
  FilterBar,
  KpiCard,
  PaginationFooter,
  SectionHeader,
  TableSkeleton,
} from '@/shared/ui';
import { ExportButton } from '../components/ExportButton.js';
import { ObjectiveDialog } from '../components/ObjectiveDialog.js';
import { useReportExports } from '../hooks/useReportExports.js';
import { useSalesObjectives } from '../hooks/useSalesObjectives.js';
import { useTeamAdvisors } from '../hooks/useTeamAdvisors.js';
import { deleteObjective } from '../reports.service.js';

export default function ReportsPage() {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const { user } = useAuth();
  const { advisorOptions, isSupervisor } = useTeamAdvisors();

  const [objPage, setObjPage] = useState(1);
  const [objPageSize, setObjPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObj, setEditingObj] = useState<SalesObjectiveListItemResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [expPage, setExpPage] = useState(1);
  const [expPageSize, setExpPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: objResult,
    isLoading: objLoading,
    isFetching: objFetching,
    error: objError,
    refetch: refetchObj,
  } = useSalesObjectives({
    page: objPage,
    limit: objPageSize,
    sortOrder: 'desc',
    ...(isSupervisor && user?.id ? { supervisorId: user.id } : {}),
  });

  const {
    data: expResult,
    isLoading: expLoading,
    isFetching: expFetching,
    error: expError,
    refetch: refetchExp,
  } = useReportExports({
    page: expPage,
    limit: expPageSize,
    sortOrder: 'desc',
  });

  usePageReset([objPageSize], setObjPage);
  usePageReset([searchQuery, expPageSize], setExpPage);

  const objectives = objResult?.data ?? [];
  const objMeta =
    (objResult?.meta as { totalItems: number; totalPages: number } | undefined) ?? null;

  const exports = expResult?.data ?? [];
  const expMeta =
    (expResult?.meta as { totalItems: number; totalPages: number } | undefined) ?? null;

  const totalTarget = objectives.reduce((sum, o) => sum + o.targetSalesAmount, 0);
  const advisorsWithObj = objectives.filter((o) => o.advisor).length;
  const avgDeals =
    objectives.length > 0
      ? Math.round(objectives.reduce((sum, o) => sum + o.targetClosedDeals, 0) / objectives.length)
      : 0;

  const handleEdit = (obj: SalesObjectiveListItemResponse) => {
    setEditingObj(obj);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingObj(null);
    setDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteObjective(id),
    onSuccess: () => {
      toast.success(t('reports.objectiveDeleted'));
      refetchObj();
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setDeleteTarget(null);
    },
  });

  const objectiveColumns = [
    {
      id: 'advisor',
      header: t('reports.advisor'),
      accessor: (item: SalesObjectiveListItemResponse) => {
        const name = item.advisor?.profile
          ? `${item.advisor.profile.firstName} ${item.advisor.profile.lastName}`
          : item.advisor?.username;
        return <span className="font-medium">{name ?? '—'}</span>;
      },
    },
    {
      id: 'targetAmount',
      header: t('reports.targetAmount'),
      accessor: (item: SalesObjectiveListItemResponse) => formatCurrency(item.targetSalesAmount),
    },
    {
      id: 'targetDeals',
      header: t('reports.targetDeals'),
      accessor: (item: SalesObjectiveListItemResponse) => item.targetClosedDeals,
    },
    {
      id: 'period',
      header: t('reports.periodStart'),
      accessor: (item: SalesObjectiveListItemResponse) =>
        `${formatDate(item.periodStart)} – ${formatDate(item.periodEnd)}`,
    },
    {
      id: 'actions',
      header: t('common.actions'),
      accessor: (item: SalesObjectiveListItemResponse) => (
        <div className="flex gap-1">
          <Can permission="sales_objectives.update">
            <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
              <Pencil className="size-4" />
            </Button>
          </Can>
          <Can permission="sales_objectives.delete">
            <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(item.id)}>
              <Trash2 className="size-4" />
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  const filteredExports = searchQuery
    ? exports.filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : exports;

  const exportColumns = [
    {
      id: 'type',
      header: t('reports.reportType'),
      accessor: (item: (typeof exports)[number]) => (
        <span className="font-medium">{t(`reports.type.${item.reportType}`)}</span>
      ),
    },
    {
      id: 'title',
      header: t('reports.title'),
      accessor: (item: (typeof exports)[number]) => item.title,
    },
    {
      id: 'generated',
      header: t('reports.generatedDate'),
      accessor: (item: (typeof exports)[number]) => formatDateTime(item.generatedAt),
    },
    {
      id: 'size',
      header: t('reports.fileSize'),
      accessor: (item: (typeof exports)[number]) => `${item.fileSizeMb} MB`,
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <SectionHeader
        title={t('reports.title')}
        description={t('reports.description')}
        actions={<ExportButton />}
      />

      <Tabs defaultValue="objectives">
        <TabsList>
          <TabsTrigger value="objectives">{t('reports.objectives')}</TabsTrigger>
          <TabsTrigger value="exports">{t('reports.exports')}</TabsTrigger>
        </TabsList>

        <TabsContent value="objectives" className="mt-6">
          {objLoading ? (
            <TableSkeleton columns={5} />
          ) : objError ? (
            <ErrorState error={objError} onRetry={() => refetchObj()} />
          ) : (
            <div
              className={cn(
                'flex flex-col gap-6',
                objFetching && !objLoading && 'pointer-events-none opacity-60 transition-opacity',
              )}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <KpiCard
                  title={t('reports.monthlyTarget')}
                  value={formatCurrency(totalTarget)}
                  subtitle={t('reports.monthlyTargetSub')}
                />
                <KpiCard
                  title={t('reports.activeAdvisors')}
                  value={advisorsWithObj}
                  subtitle={t('reports.activeAdvisorsSub')}
                />
                <KpiCard
                  title={t('reports.avgCompletion')}
                  value={avgDeals}
                  subtitle={t('reports.avgCompletionSub')}
                />
              </div>

              {hasPermission('sales_objectives.create') && (
                <div className="flex justify-end">
                  <Button onClick={handleNew}>
                    <Plus data-icon="inline-start" />
                    {t('reports.newObjective')}
                  </Button>
                </div>
              )}

              {objectives.length === 0 ? (
                <EmptyState
                  title={t('reports.noObjectives')}
                  description={t('reports.noObjectivesDesc')}
                />
              ) : (
                <>
                  <EntityTable
                    data={objectives}
                    columns={objectiveColumns}
                    keyExtractor={(item) => item.id}
                  />
                  <PaginationFooter
                    page={objPage}
                    onPageChange={setObjPage}
                    pageSize={objPageSize}
                    onPageSizeChange={setObjPageSize}
                    meta={objMeta}
                  />
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exports" className="mt-6">
          {expLoading ? (
            <TableSkeleton columns={4} />
          ) : expError ? (
            <ErrorState error={expError} onRetry={() => refetchExp()} />
          ) : (
            <div
              className={cn(
                'flex flex-col gap-4',
                expFetching && !expLoading && 'pointer-events-none opacity-60 transition-opacity',
              )}
            >
              <FilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder={t('reports.searchExports')}
              />

              {filteredExports.length === 0 ? (
                <EmptyState
                  title={t('reports.noExports')}
                  description={t('reports.noExportsDesc')}
                />
              ) : (
                <>
                  <EntityTable
                    data={filteredExports}
                    columns={exportColumns}
                    keyExtractor={(item) => item.id}
                  />
                  <PaginationFooter
                    page={expPage}
                    onPageChange={setExpPage}
                    pageSize={expPageSize}
                    onPageSizeChange={setExpPageSize}
                    meta={expMeta}
                  />
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ObjectiveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        objective={editingObj}
        advisorOptions={advisorOptions}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('reports.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('reports.confirmDeleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t('common.deleting')}
                </>
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
