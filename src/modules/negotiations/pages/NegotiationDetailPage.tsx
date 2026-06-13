import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader, StateBadge, TimelinePanel } from '@/shared/ui';

export default function NegotiationDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title={`Negociación #${id?.slice(0, 8)}`}
        description="Detalle completo de la negociación y su historial"
      />

      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Empresa</span>
              <span className="text-base text-foreground">—</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Estado</span>
              <StateBadge state="pending" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Asignado a</span>
              <span className="text-base text-foreground">—</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Fecha de inicio</span>
              <span className="text-base text-foreground">—</span>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Historial</TabsTrigger>
          <TabsTrigger value="visits">Visitas</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-4">
          <TimelinePanel entries={[]} emptyMessage="No hay historial disponible" />
        </TabsContent>
        <TabsContent value="visits" className="mt-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">No hay visitas registradas</p>
          </Card>
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">No hay documentos adjuntos</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
