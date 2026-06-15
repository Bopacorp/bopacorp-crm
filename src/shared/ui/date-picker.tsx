import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const DISPLAY_FORMAT = 'dd/MM/yyyy';
const ISO_DATE_FORMAT = 'yyyy-MM-dd';

function formatDateValue(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, DISPLAY_FORMAT, { locale: es });
}

function parseValueToDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function dateToIsoDateString(date: Date): string {
  return format(date, ISO_DATE_FORMAT);
}

function dateToIsoString(date: Date): string {
  return date.toISOString();
}

interface BasePickerProps {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

interface DatePickerProps extends BasePickerProps {
  value: string;
  onChange: (value: string) => void;
  outputFormat?: 'date' | 'iso';
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  disabled,
  className,
  id,
  name,
  required,
  outputFormat = 'date',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(parseValueToDate(value));
  const selected = parseValueToDate(value);

  const toOutput = outputFormat === 'iso' ? dateToIsoString : dateToIsoDateString;

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange('');
      return;
    }
    onChange(toOutput(date));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <Input
            id={id}
            name={name}
            required={required}
            disabled={disabled}
            readOnly
            value={formatDateValue(value)}
            placeholder={placeholder}
            className="pr-9"
            onClick={() => !disabled && setOpen(true)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            data-icon="inline-end"
            className="absolute top-0 right-0 h-full rounded-l-none text-muted-foreground hover:bg-transparent"
            onClick={() => !disabled && setOpen((o) => !o)}
            tabIndex={-1}
            aria-label="Abrir calendario"
          >
            <CalendarIcon className="size-4" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-auto p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Calendar
          mode="single"
          selected={selected}
          month={month}
          onMonthChange={setMonth}
          onSelect={handleSelect}
          captionLayout="dropdown"
          locale={es}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

interface DateRangePickerProps extends BasePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa — dd/mm/aaaa',
  disabled,
  className,
  id,
  name,
  required,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(value?.from);

  const displayValue = (() => {
    if (!value?.from) return '';
    const fromStr = format(value.from, DISPLAY_FORMAT, { locale: es });
    if (!value.to) return fromStr;
    return `${fromStr} — ${format(value.to, DISPLAY_FORMAT, { locale: es })}`;
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <Input
            id={id}
            name={name}
            required={required}
            disabled={disabled}
            readOnly
            value={displayValue}
            placeholder={placeholder}
            className="pr-9"
            onClick={() => !disabled && setOpen(true)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            data-icon="inline-end"
            className="absolute top-0 right-0 h-full rounded-l-none text-muted-foreground hover:bg-transparent"
            onClick={() => !disabled && setOpen((o) => !o)}
            tabIndex={-1}
            aria-label="Abrir calendario"
          >
            <CalendarIcon className="size-4" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-auto p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          month={month}
          onMonthChange={setMonth}
          numberOfMonths={2}
          captionLayout="dropdown"
          locale={es}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
