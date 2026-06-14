import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchSelect } from './SearchSelect.js';

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    id: string;
    label?: string;
    placeholder: string;
    options: Array<{ value: string; label: string }>;
    value?: string;
    onChange?: (value: string) => void;
    searchable?: boolean;
  }>;
  actions?: React.ReactNode;
}

export function FilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters = [],
  actions,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
        {onSearchChange && (
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
        )}
        {filters.length > 0 && (
          <div className="flex gap-2">
            {filters.map((filter) => (
              <div key={filter.id} className="flex flex-col gap-1">
                {filter.label && (
                  <span className="text-xs font-medium text-muted-foreground">{filter.label}</span>
                )}
                {filter.searchable ? (
                  <SearchSelect
                    options={filter.options}
                    value={filter.value ?? ''}
                    onValueChange={(v) => filter.onChange?.(v)}
                    placeholder={filter.placeholder}
                    searchPlaceholder={`Buscar ${filter.label?.toLowerCase() ?? ''}...`}
                    emptyMessage="Sin resultados"
                  />
                ) : (
                  <Select value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={filter.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
