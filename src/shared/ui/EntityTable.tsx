import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Column<T> {
  id: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface EntityTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

function SortIcon({
  columnId,
  sortBy,
  sortOrder,
}: {
  columnId: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  if (sortBy !== columnId) return <ArrowUpDown className="size-4" />;
  return sortOrder === 'asc' ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />;
}

export function EntityTable<T>({
  data,
  columns,
  onRowClick,
  keyExtractor,
  sortBy,
  sortOrder,
  onSortChange,
}: EntityTableProps<T>) {
  function handleSort(columnId: string) {
    if (!onSortChange) return;
    const nextOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(columnId, nextOrder);
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.className}>
                {column.sortable && onSortChange ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort(column.id)}
                  >
                    {column.header}
                    <SortIcon columnId={column.id} sortBy={sortBy} sortOrder={sortOrder} />
                  </Button>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={keyExtractor(item)}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={onRowClick ? 'cursor-pointer' : undefined}
            >
              {columns.map((column) => (
                <TableCell key={column.id} className={column.className}>
                  {column.accessor(item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
