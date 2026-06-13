import { FileQuestion } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function EmptyState({
  title = 'No hay datos',
  description = 'No se encontraron registros para mostrar',
  icon: Icon = FileQuestion,
}: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 py-12">
      <Icon className="size-12 text-muted-foreground" />
      <div className="flex flex-col gap-1 text-center">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
