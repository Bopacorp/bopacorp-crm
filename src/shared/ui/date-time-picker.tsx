import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const DATE_FORMAT = 'dd/MM/yyyy HH:mm';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatValue(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, DATE_FORMAT, { locale: es });
}

function parseIsoToDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function combineDateAndTime(date: Date, hour: number, minute: number): string {
  const combined = new Date(date);
  combined.setHours(hour, minute, 0, 0);
  return combined.toISOString();
}

function getCurrentTimeSnapshot(minuteStep: number): { hour: number; minute: number } {
  const now = new Date();
  return {
    hour: now.getHours(),
    minute: Math.floor(now.getMinutes() / minuteStep) * minuteStep,
  };
}

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  minuteStep?: number;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa hh:mm',
  disabled,
  className,
  id,
  name,
  required,
  minuteStep = 5,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = parseIsoToDate(value);
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [defaultTime, setDefaultTime] = React.useState(() => getCurrentTimeSnapshot(minuteStep));

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) => i * minuteStep);

  const currentHour = date ? date.getHours() : defaultTime.hour;
  const currentMinute = date ? date.getMinutes() : defaultTime.minute;

  const handleDateSelect = (next: Date | undefined) => {
    if (!next) {
      onChange('');
      return;
    }
    onChange(combineDateAndTime(next, currentHour, currentMinute));
  };

  const handleTimeChange = (type: 'hour' | 'minute', next: string) => {
    if (!date) return;
    const num = Number.parseInt(next, 10);
    if (Number.isNaN(num)) return;
    const newHour = type === 'hour' ? num : currentHour;
    const newMinute = type === 'minute' ? num : currentMinute;
    onChange(combineDateAndTime(date, newHour, newMinute));
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setDefaultTime(getCurrentTimeSnapshot(minuteStep));
      if (!date) {
        setMonth(new Date());
      }
    }
  };

  const handleClear = () => {
    onChange('');
    setDefaultTime(getCurrentTimeSnapshot(minuteStep));
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <Input
            id={id}
            name={name}
            required={required}
            disabled={disabled}
            readOnly
            value={formatValue(value)}
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
          selected={date}
          month={month}
          onMonthChange={setMonth}
          onSelect={handleDateSelect}
          captionLayout="dropdown"
          locale={es}
          autoFocus
        />
        <div className="mt-3 flex items-center justify-center gap-2 border-t pt-3">
          <span className="text-muted-foreground text-xs">Hora</span>
          <Select
            value={currentHour.toString()}
            onValueChange={(v) => handleTimeChange('hour', v)}
            disabled={!date}
          >
            <SelectTrigger size="sm" className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {hours.map((h) => (
                <SelectItem key={h} value={h.toString()}>
                  {pad(h)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-sm">:</span>
          <Select
            value={currentMinute.toString()}
            onValueChange={(v) => handleTimeChange('minute', v)}
            disabled={!date}
          >
            <SelectTrigger size="sm" className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {minutes.map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {pad(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {date && (
          <div className="mt-2 flex justify-end border-t pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
              Limpiar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
