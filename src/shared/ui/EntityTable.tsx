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
}

interface EntityTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
}

export function EntityTable<T>({ data, columns, onRowClick, keyExtractor }: EntityTableProps<T>) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.className}>
                {column.header}
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
