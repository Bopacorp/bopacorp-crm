import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const HEADER_KEYS = ['h0', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7'];
const ROW_KEYS = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9'];

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableSkeleton({ columns = 5, rows = 6 }: TableSkeletonProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {HEADER_KEYS.slice(0, columns).map((key) => (
              <TableHead key={key}>
                <Skeleton className="h-4 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROW_KEYS.slice(0, rows).map((rk) => (
            <TableRow key={rk}>
              {HEADER_KEYS.slice(0, columns).map((ck, c) => (
                <TableCell key={`${rk}-${ck}`}>
                  <Skeleton className={c === 0 ? 'h-4 w-40' : 'h-4 w-24'} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
