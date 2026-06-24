import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export interface DeviceDetailFormValues {
  brand: string;
  model: string;
  storageGb: string;
  financingMonths: string;
  financingMonthly: string;
}

export const DEVICE_DEFAULTS: DeviceDetailFormValues = {
  brand: '',
  model: '',
  storageGb: '',
  financingMonths: '',
  financingMonthly: '',
};

interface DeviceDetailFieldsProps {
  values: DeviceDetailFormValues;
  onChange: (values: DeviceDetailFormValues) => void;
}

export function DeviceDetailFields({ values, onChange }: DeviceDetailFieldsProps) {
  const set = <K extends keyof DeviceDetailFormValues>(key: K, val: DeviceDetailFormValues[K]) =>
    onChange({ ...values, [key]: val });

  return (
    <FieldGroup>
      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <FieldLabel>Marca</FieldLabel>
          <Input
            value={values.brand}
            onChange={(e) => set('brand', e.target.value)}
            maxLength={30}
          />
        </Field>
        <Field>
          <FieldLabel>Modelo</FieldLabel>
          <Input
            value={values.model}
            onChange={(e) => set('model', e.target.value)}
            maxLength={30}
          />
        </Field>
        <Field>
          <FieldLabel>Almacenamiento (GB)</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.storageGb}
            onChange={(e) => set('storageGb', e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Financiamiento (meses)</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.financingMonths}
            onChange={(e) => set('financingMonths', e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Cuota mensual ($)</FieldLabel>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={values.financingMonthly}
            onChange={(e) => set('financingMonthly', e.target.value)}
          />
        </Field>
      </div>
    </FieldGroup>
  );
}
