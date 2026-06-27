import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZES = [10, 25, 50];

interface PageSizeSelectProps {
  value: number;
  onChange: (size: number) => void;
}

export function PageSizeSelect({ value, onChange }: PageSizeSelectProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{t('common.show')}</span>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-8 w-[70px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZES.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
