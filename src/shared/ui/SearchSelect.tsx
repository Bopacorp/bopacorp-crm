import { ChevronsUpDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface SearchSelectOption {
  value: string;
  label: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onSearchChange?: (search: string) => void;
  searchValue?: string;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadMoreLabel?: string;
}

export function SearchSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Sin resultados',
  onSearchChange,
  searchValue,
  loading = false,
  hasMore = false,
  onLoadMore,
  loadMoreLabel = 'Cargar más',
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const isRemote = typeof onSearchChange === 'function';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
        >
          {selected?.label ?? placeholder}
          <ChevronsUpDown className="ml-auto size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={!isRemote}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={isRemote ? searchValue : undefined}
            onValueChange={isRemote ? onSearchChange : undefined}
          />
          <CommandList>
            {loading && options.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
                Buscando...
              </div>
            ) : (
              <>
                <CommandEmpty>{loading ? 'Buscando...' : emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      data-checked={option.value === value}
                      onSelect={() => {
                        onValueChange(option.value === value ? '' : option.value);
                        setOpen(false);
                      }}
                    >
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
          {hasMore && onLoadMore && (
            <div className="border-t border-border p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={onLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
                ) : null}
                {loadMoreLabel}
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
