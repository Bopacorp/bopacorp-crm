import { OctagonX } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <OctagonX className="size-12 text-destructive" />
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Algo salió mal</h2>
          <p className="text-sm text-muted-foreground">
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
        </div>
        <Button onClick={onRetry}>Reintentar</Button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // biome-ignore lint/suspicious/noConsole: error boundary logging is intentional
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  resetError = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.resetError} />;
    }
    return this.props.children;
  }
}
