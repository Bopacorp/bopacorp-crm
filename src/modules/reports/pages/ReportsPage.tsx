import { Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, EntityTable, FilterBar, KpiCard, SectionHeader } from '@/shared/ui';

interface ReportExport {
  id: string;
  type: string;
  period: string;
  generatedAt: string;
  status: string;
}

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const exports: ReportExport[] = [];

  const columns = [
    {
      id: 'type',
      header: 'Tipo de reporte',
      accessor: (item: ReportExport) => <span className="font-medium">{item.type}</span>,
    },
    {
      id: 'period',
      header: 'Período',
      accessor: (item: ReportExport) => item.period,
    },
    {
      id: 'generated',
      header: 'Fecha de generación',
      accessor: (item: ReportExport) => item.generatedAt,
    },
    {
      id: 'status',
      header: 'Estado',
      accessor: (item: ReportExport) => item.status,
    },
    {
      id: 'actions',
      header: 'Acciones',
      accessor: () => (
        <Button size="sm" variant="outline">
          <Download data-icon="inline-start" />
          Descargar
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Reportes"
        description="Métricas de desempeño y reportes históricos exportables"
        actions={
          <Button>
            <Download data-icon="inline-start" />
            Generar reporte
          </Button>
        }
      />

      <Tabs defaultValue="objectives">
        <TabsList>
          <TabsTrigger value="objectives">Objetivos</TabsTrigger>
          <TabsTrigger value="exports">Exportaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="objectives" className="mt-6">
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-3">
              <KpiCard title="Objetivo mensual" value="0%" subtitle="Meta de ventas" />
              <KpiCard title="Supervisores activos" value={0} subtitle="Con objetivos asignados" />
              <KpiCard title="Cumplimiento promedio" value="0%" subtitle="Últimos 30 días" />
            </div>

            <Card className="p-6">
              <p className="text-sm text-muted-foreground">
                No hay objetivos configurados para este período
              </p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exports" className="mt-6">
          <div className="flex flex-col gap-4">
            <FilterBar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Buscar reportes..."
            />

            {exports.length === 0 ? (
              <EmptyState
                title="No hay reportes exportados"
                description="Los reportes generados aparecerán aquí"
              />
            ) : (
              <EntityTable data={exports} columns={columns} keyExtractor={(item) => item.id} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
