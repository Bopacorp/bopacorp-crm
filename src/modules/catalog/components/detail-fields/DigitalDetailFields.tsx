import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export interface DigitalDetailFormValues {
  provider: string;
}

export const DIGITAL_DEFAULTS: DigitalDetailFormValues = {
  provider: '',
};

interface DigitalDetailFieldsProps {
  values: DigitalDetailFormValues;
  onChange: (values: DigitalDetailFormValues) => void;
}

export function DigitalDetailFields({ values, onChange }: DigitalDetailFieldsProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Proveedor</FieldLabel>
        <Input
          value={values.provider}
          onChange={(e) => onChange({ provider: e.target.value })}
          maxLength={50}
        />
      </Field>
    </FieldGroup>
  );
}
