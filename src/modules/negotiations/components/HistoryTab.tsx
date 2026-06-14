import { Loader2 } from 'lucide-react';
import { ErrorState, TimelinePanel } from '@/shared/ui';
import { useNegotiationHistory } from '../hooks/useNegotiationHistory.js';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface HistoryTabProps {
  negotiationId: string;
}

export function HistoryTab({ negotiationId }: HistoryTabProps) {
  const { history, loading, error, refetch } = useNegotiationHistory(negotiationId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const entries = history.map((h) => ({
    id: h.id,
    title: h.previousState
      ? `${h.previousState.name} → ${h.newState.name}`
      : `Estado inicial: ${h.newState.name}`,
    description: h.notes ?? undefined,
    timestamp: formatDateTime(h.createdAt),
    user: h.changedBy.username,
    state: h.newState.name,
  }));

  return <TimelinePanel entries={entries} />;
}
