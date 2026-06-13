import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Ocurrió un error al cargar los datos',
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 py-12">
      <AlertTriangle className="size-12 text-destructive" />
      <div className="flex flex-col gap-2 text-center">
        <h3 className="text-sm font-medium text-foreground">Error</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Reintentar
        </Button>
      )}
    </Card>
  );
}
