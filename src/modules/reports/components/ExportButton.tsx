import type { AdvisorMetricResponse } from '@bopacorp/shared/reports';
import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { createExport, listAdvisorMetrics } from '../reports.service.js';

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildMetricsCsv(data: AdvisorMetricResponse[]): string {
  const stateColumns = new Map<string, string>();
  for (const m of data) {
    for (const sc of m.stateCounts) {
      if (!stateColumns.has(sc.stateCode)) {
        stateColumns.set(sc.stateCode, sc.stateName);
      }
    }
  }

  const stateCodes = [...stateColumns.keys()];
  const headers = [
    'Asesor',
    ...stateCodes.map((c) => stateColumns.get(c) ?? c),
    'Visitados',
    'Facturado',
    'Promedio por servicio',
    'Días promedio cierre',
  ];

  const rows = data.map((m) => {
    const name = m.advisor.profile
      ? `${m.advisor.profile.firstName} ${m.advisor.profile.lastName}`
      : m.advisor.username;
    const counts = stateCodes.map(
      (code) => m.stateCounts.find((sc) => sc.stateCode === code)?.count ?? 0,
    );
    return [
      name,
      ...counts,
      m.clientsVisited,
      m.totalBilledAmount,
      m.averageBillingPerService,
      m.avgDaysToClose ?? '',
    ];
  });

  return [headers, ...rows].map((r) => r.join(',')).join('\n');
}

export function ExportButton() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const metricsMutation = useMutation({
    mutationFn: async () => {
      const data = await listAdvisorMetrics();
      const csv = buildMetricsCsv(data);
      const filename = `metricas-asesores-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCsv(filename, csv);

      const sizeBytes = new Blob([csv]).size;
      await createExport({
        generatedBy: user?.id ?? '',
        reportType: 'COMMERCIAL_PERFORMANCE',
        title: t('reports.exportMetrics'),
        filename,
        fileExtension: 'csv',
        fileSizeMb: Number.parseFloat((sizeBytes / (1024 * 1024)).toFixed(2)) || 0.01,
        storagePath: `exports/${filename}`,
        mimeType: 'text/csv',
      });
    },
    onSuccess: () => {
      toast.success(t('reports.exportSuccess'));
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={metricsMutation.isPending}>
          <Download data-icon="inline-start" />
          {t('reports.generateReport')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => metricsMutation.mutate()}>
          {t('reports.exportMetrics')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
