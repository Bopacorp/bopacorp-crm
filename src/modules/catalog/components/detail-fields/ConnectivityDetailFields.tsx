import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export interface ConnectivityDetailFormValues {
  bandwidthMbps: string;
}

export const CONNECTIVITY_DEFAULTS: ConnectivityDetailFormValues = {
  bandwidthMbps: '',
};

interface ConnectivityDetailFieldsProps {
  values: ConnectivityDetailFormValues;
  onChange: (values: ConnectivityDetailFormValues) => void;
}

export function ConnectivityDetailFields({ values, onChange }: ConnectivityDetailFieldsProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Ancho de banda (Mbps)</FieldLabel>
        <Input
          type="number"
          min={0}
          value={values.bandwidthMbps}
          onChange={(e) => onChange({ bandwidthMbps: e.target.value })}
        />
      </Field>
    </FieldGroup>
  );
}
