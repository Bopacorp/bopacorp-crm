import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

interface ErrorStateProps {
  message?: string;
  code?: string;
  onRetry?: () => void;
}

const errorMessages: Record<string, string> = {
  UNAUTHORIZED: 'Sesion expirada. Por favor inicia sesion nuevamente.',
  VALIDATION_ERROR: 'Algunos campos tienen errores. Revisalos e intenta de nuevo.',
  FORBIDDEN: 'No tienes permisos para realizar esta accion.',
  NOT_FOUND: 'El recurso solicitado no existe.',
  CONFLICT: 'Ya existe un registro con esos datos.',
};

function getErrorMessage(code: string | undefined, fallback?: string): string {
  if (code && errorMessages[code]) return errorMessages[code];
  if (fallback) return fallback;
  return 'Ocurrio un error inesperado. Intenta de nuevo mas tarde.';
}

export function ErrorState({ message, code, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Error al cargar el contenido</EmptyTitle>
          <EmptyDescription>{getErrorMessage(code, message)}</EmptyDescription>
        </EmptyHeader>
        {onRetry && <Button onClick={onRetry}>Reintentar</Button>}
      </Empty>
    </div>
  );
}
