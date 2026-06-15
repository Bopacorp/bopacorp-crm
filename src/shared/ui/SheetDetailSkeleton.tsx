import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonSection {
  labelWidth?: string;
  rows: string[];
}

interface SheetDetailSkeletonProps {
  sections: SkeletonSection[];
}

export function SkeletonRow({ width = 'w-32' }: { width?: string }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5">
      <Skeleton className="size-4 rounded" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className={cn('h-4', width)} />
    </div>
  );
}

export function SheetDetailSkeleton({ sections }: SheetDetailSkeletonProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-5">
        {sections.map((section) => {
          const sectionKey = `${section.labelWidth ?? 'w-20'}-${section.rows.length}`;
          return (
            <div key={sectionKey} className="flex flex-col gap-1">
              <Skeleton className={cn('mx-2 h-3', section.labelWidth ?? 'w-20')} />
              {section.rows.map((width) => (
                <SkeletonRow key={width} width={width} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
