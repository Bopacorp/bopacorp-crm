import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const FIELD_KEYS = ['f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'];
const TAB_KEYS = ['t0', 't1', 't2', 't3', 't4', 't5'];

interface DetailSkeletonProps {
  fields?: number;
  tabs?: number;
}

export function DetailSkeleton({ fields = 4, tabs = 3 }: DetailSkeletonProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-6 w-48" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {FIELD_KEYS.slice(0, fields).map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {TAB_KEYS.slice(0, tabs).map((key) => (
            <Skeleton key={key} className="h-9 w-24 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
