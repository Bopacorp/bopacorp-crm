import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

const DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTIONS,
  hour: '2-digit',
  minute: '2-digit',
};

export function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-EC', DATE_OPTIONS);
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleDateString('es-EC', DATETIME_OPTIONS);
}

export function formatRelativeTime(value: string): string {
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: es });
}
