import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface TimelineEntry {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  user?: string;
  state?: string;
}

interface TimelinePanelProps {
  entries: TimelineEntry[];
  emptyMessage?: string;
}

export function TimelinePanel({
  entries,
  emptyMessage = 'No hay historial disponible',
}: TimelinePanelProps) {
  if (entries.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        {entries.map((entry, index) => (
          <div key={entry.id}>
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">{entry.title}</span>
                  {entry.description && (
                    <span className="text-sm text-muted-foreground">{entry.description}</span>
                  )}
                </div>
                {entry.state && (
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                    {entry.state}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{entry.timestamp}</span>
                {entry.user && (
                  <>
                    <span>•</span>
                    <span>{entry.user}</span>
                  </>
                )}
              </div>
            </div>
            {index < entries.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </div>
    </Card>
  );
}
