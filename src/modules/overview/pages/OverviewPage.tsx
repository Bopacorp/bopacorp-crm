import type { AdvisorMetricResponse } from '@bopacorp/shared/reports';
import { format } from 'date-fns';
import { Briefcase, CalendarCheck, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet.js';
import { useAdvisorMetrics } from '@/modules/reports/hooks/useAdvisorMetrics.js';
import {
  EmptyState,
  EntityTable,
  ErrorState,
  KpiCard,
  SectionHeader,
  TableSkeleton,
} from '@/shared/ui';

function advisorName(item: AdvisorMetricResponse) {
  const profile = item.advisor.profile;
  return profile ? `${profile.firstName} ${profile.lastName}` : item.advisor.username;
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
}

export default function OverviewPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorMetricResponse | null>(null);

  const {
    data: metrics,
    isLoading: loading,
    error,
    refetch,
  } = useAdvisorMetrics({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const totals = metrics?.reduce(
    (acc, item) => ({
      activeAccounts: acc.activeAccounts + item.clientsContacted,
      visitsToday: acc.visitsToday + item.clientsVisited,
      closedDeals: acc.closedDeals + item.clientsClosed,
    }),
    { activeAccounts: 0, visitsToday: 0, closedDeals: 0 },
  ) ?? { activeAccounts: 0, visitsToday: 0, closedDeals: 0 };

  const columns = [
    {
      id: 'advisor',
      header: 'Asesor',
      accessor: (item: AdvisorMetricResponse) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{advisorName(item)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-0 text-foreground hover:underline"
            onClick={() => setSelectedAdvisor(item)}
          >
            Ver detalles
          </Button>
        </div>
      ),
    },
    {
      id: 'contacted',
      header: 'Contactados',
      accessor: (item: AdvisorMetricResponse) => item.clientsContacted,
    },
    {
      id: 'visited',
      header: 'Visitados',
      accessor: (item: AdvisorMetricResponse) => item.clientsVisited,
    },
    {
      id: 'inNegotiation',
      header: 'En negociación',
      accessor: (item: AdvisorMetricResponse) => item.clientsInNegotiation,
    },
    {
      id: 'closed',
      header: 'Cerrados',
      accessor: (item: AdvisorMetricResponse) => item.clientsClosed,
    },
    {
      id: 'postSale',
      header: 'Post-venta',
      accessor: (item: AdvisorMetricResponse) => item.clientsPostSale,
    },
    {
      id: 'billed',
      header: 'Facturado',
      accessor: (item: AdvisorMetricResponse) => formatCurrency(item.totalBilledAmount),
    },
    {
      id: 'avgPerService',
      header: 'Prom. por servicio',
      accessor: (item: AdvisorMetricResponse) => formatCurrency(item.averageBillingPerService),
    },
  ];

  if (loading) return <TableSkeleton columns={columns.length} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Overview"
        description="Resumen operativo del día y métricas clave de negocio"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Cuentas activas"
          value={totals.activeAccounts}
          subtitle="Total de cuentas contactadas"
          icon={Briefcase}
        />
        <KpiCard
          title="Visitas"
          value={totals.visitsToday}
          subtitle="Clientes visitados en el período"
          icon={CalendarCheck}
        />
        <KpiCard
          title="Negocios cerrados"
          value={totals.closedDeals}
          subtitle="Cierres exitosos"
          icon={Users}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date-from" className="text-sm font-medium">
              Desde
            </label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={today}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date-to" className="text-sm font-medium">
              Hasta
            </label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              max={today}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
            }}
          >
            Limpiar
          </Button>
        </div>

        {metrics && metrics.length === 0 ? (
          <EmptyState
            title="Sin métricas"
            description="No se encontraron asesores con actividad en el período seleccionado"
          />
        ) : (
          <EntityTable
            data={metrics ?? []}
            columns={columns}
            keyExtractor={(item) => item.advisor.id}
          />
        )}
      </div>

      <Sheet open={!!selectedAdvisor} onOpenChange={() => setSelectedAdvisor(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedAdvisor ? advisorName(selectedAdvisor) : 'Detalle'}</SheetTitle>
          </SheetHeader>

          {selectedAdvisor && (
            <div className="flex flex-col gap-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard
                  title="Contactados"
                  value={selectedAdvisor.clientsContacted}
                  subtitle="Cuentas en contacto inicial"
                  icon={Briefcase}
                />
                <KpiCard
                  title="Visitados"
                  value={selectedAdvisor.clientsVisited}
                  subtitle="Clientes visitados"
                  icon={CalendarCheck}
                />
                <KpiCard
                  title="En negociación"
                  value={selectedAdvisor.clientsInNegotiation}
                  subtitle="Negociaciones activas"
                  icon={Users}
                />
                <KpiCard
                  title="Cerrados"
                  value={selectedAdvisor.clientsClosed}
                  subtitle="Negocios cerrados"
                  icon={Briefcase}
                />
                <KpiCard
                  title="Post-venta"
                  value={selectedAdvisor.clientsPostSale}
                  subtitle="Clientes en post-venta"
                  icon={CalendarCheck}
                />
              </div>

              <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Facturado</span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(selectedAdvisor.totalBilledAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Promedio por servicio</span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(selectedAdvisor.averageBillingPerService)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
