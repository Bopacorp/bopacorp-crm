import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader, StateBadge, TimelinePanel } from '@/shared/ui';

export default function MatrixDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title={`Matriz #${id?.slice(0, 8)}`}
        description="Detalle completo de la matriz de oferta"
      />

      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Nombre</span>
              <span className="text-base text-foreground">—</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Carrier</span>
              <span className="text-base text-foreground">—</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Estado</span>
              <StateBadge state="draft" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Fecha de creación</span>
              <span className="text-base text-foreground">—</span>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Líneas de oferta</TabsTrigger>
          <TabsTrigger value="attachments">Adjuntos</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="mt-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">No hay líneas de oferta configuradas</p>
          </Card>
        </TabsContent>
        <TabsContent value="attachments" className="mt-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">No hay archivos adjuntos</p>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <TimelinePanel entries={[]} emptyMessage="No hay historial de cambios" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
