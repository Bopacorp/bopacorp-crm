import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGeoZoneOptions } from '../../hooks/useGeoZoneOptions.js';

export interface RoamingDetailFormValues {
  geoZoneId: string;
  dataMb: string;
  durationDays: string;
  hasThrottle: boolean;
}

export const ROAMING_DEFAULTS: RoamingDetailFormValues = {
  geoZoneId: '',
  dataMb: '',
  durationDays: '',
  hasThrottle: false,
};

interface RoamingDetailFieldsProps {
  values: RoamingDetailFormValues;
  onChange: (values: RoamingDetailFormValues) => void;
}

export function RoamingDetailFields({ values, onChange }: RoamingDetailFieldsProps) {
  const { options: geoZoneOptions } = useGeoZoneOptions();

  const set = <K extends keyof RoamingDetailFormValues>(key: K, val: RoamingDetailFormValues[K]) =>
    onChange({ ...values, [key]: val });

  return (
    <FieldGroup>
      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <FieldLabel>Zona geográfica</FieldLabel>
          <Select value={values.geoZoneId} onValueChange={(v) => set('geoZoneId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar zona" />
            </SelectTrigger>
            <SelectContent>
              {geoZoneOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Datos (MB)</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.dataMb}
            onChange={(e) => set('dataMb', e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Duración (días)</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.durationDays}
            onChange={(e) => set('durationDays', e.target.value)}
          />
        </Field>
        <Field orientation="horizontal">
          <FieldLabel>Throttle</FieldLabel>
          <Switch checked={values.hasThrottle} onCheckedChange={(v) => set('hasThrottle', v)} />
        </Field>
      </div>
    </FieldGroup>
  );
}
