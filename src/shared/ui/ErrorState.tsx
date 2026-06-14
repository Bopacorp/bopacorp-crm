import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { getErrorMessage } from '@/shared/errors/index.js';

interface ErrorStateProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, message, onRetry }: ErrorStateProps) {
  const displayMessage = error
    ? getErrorMessage(error)
    : (message ?? 'Ocurrió un error inesperado.');

  return (
    <div className="flex items-center justify-center py-20">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Error al cargar el contenido</EmptyTitle>
          <EmptyDescription>{displayMessage}</EmptyDescription>
        </EmptyHeader>
        {onRetry && <Button onClick={onRetry}>Reintentar</Button>}
      </Empty>
    </div>
  );
}
