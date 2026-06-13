import { Briefcase, CalendarCheck, Users } from 'lucide-react';
import { KpiCard, SectionHeader } from '@/shared/ui';

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Overview"
        description="Resumen operativo del día y métricas clave de negocio"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Cuentas activas"
          value={0}
          subtitle="Total de cuentas en operación"
          icon={Briefcase}
        />
        <KpiCard
          title="Visitas hoy"
          value={0}
          subtitle="Programadas y completadas"
          icon={CalendarCheck}
        />
        <KpiCard title="Top performers" value={0} subtitle="Asesores destacados" icon={Users} />
      </div>
    </div>
  );
}
