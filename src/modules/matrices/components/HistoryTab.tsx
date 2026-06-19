import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/format.js';
import { ErrorState, TimelinePanel } from '@/shared/ui';
import { useMatrixHistory } from '../hooks/useMatrixHistory.js';
import { matrixStateLabel } from '../lib/state.js';

const SKELETON_KEYS = ['s0', 's1', 's2'];

function TimelineSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        {SKELETON_KEYS.map((key, i) => (
          <div key={key}>
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            {i < SKELETON_KEYS.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </div>
    </Card>
  );
}

interface HistoryTabProps {
  matrixId: string;
}

export function HistoryTab({ matrixId }: HistoryTabProps) {
  const { history, loading, error, refetch } = useMatrixHistory(matrixId);

  if (loading) return <TimelineSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const entries = history.map((h) => ({
    id: h.id,
    title: h.previousState
      ? `${matrixStateLabel(h.previousState)} → ${matrixStateLabel(h.newState)}`
      : `Estado inicial: ${matrixStateLabel(h.newState)}`,
    description: h.notes ?? undefined,
    timestamp: formatDateTime(h.createdAt),
    user: h.changedBy.username,
    state: matrixStateLabel(h.newState),
  }));

  return <TimelinePanel entries={entries} emptyMessage="No hay historial de cambios" />;
}
