import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export interface VoiceDetailFormValues {
  gigasStructural: string;
  gigasLoyalty: string;
  minutesNational: string;
  minutesLdi: string;
  sms: string;
  hasUnlimitedMinutes: boolean;
  hasUnlimitedWhatsapp: boolean;
  hasSocialNetworks: boolean;
  includedRoamingGb: string;
}

export const VOICE_DEFAULTS: VoiceDetailFormValues = {
  gigasStructural: '0',
  gigasLoyalty: '0',
  minutesNational: '',
  minutesLdi: '0',
  sms: '0',
  hasUnlimitedMinutes: false,
  hasUnlimitedWhatsapp: false,
  hasSocialNetworks: false,
  includedRoamingGb: '0',
};

interface VoiceDetailFieldsProps {
  values: VoiceDetailFormValues;
  onChange: (values: VoiceDetailFormValues) => void;
}

export function VoiceDetailFields({ values, onChange }: VoiceDetailFieldsProps) {
  const set = <K extends keyof VoiceDetailFormValues>(key: K, val: VoiceDetailFormValues[K]) =>
    onChange({ ...values, [key]: val });

  return (
    <FieldGroup>
      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <FieldLabel>Gigas estructurales</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.gigasStructural}
            onChange={(e) => set('gigasStructural', e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Gigas fidelización</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.gigasLoyalty}
            onChange={(e) => set('gigasLoyalty', e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Minutos nacionales</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.minutesNational}
            onChange={(e) => set('minutesNational', e.target.value)}
            disabled={values.hasUnlimitedMinutes}
            placeholder={values.hasUnlimitedMinutes ? 'Ilimitados' : ''}
          />
        </Field>
        <Field>
          <FieldLabel>Minutos LDI</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.minutesLdi}
            onChange={(e) => set('minutesLdi', e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>SMS</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.sms}
            onChange={(e) => set('sms', e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Roaming incluido (GB)</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.includedRoamingGb}
            onChange={(e) => set('includedRoamingGb', e.target.value)}
          />
        </Field>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Field orientation="horizontal">
          <FieldLabel>Minutos ilimitados</FieldLabel>
          <Switch
            checked={values.hasUnlimitedMinutes}
            onCheckedChange={(v) => set('hasUnlimitedMinutes', v)}
          />
        </Field>
        <Field orientation="horizontal">
          <FieldLabel>WhatsApp ilimitado</FieldLabel>
          <Switch
            checked={values.hasUnlimitedWhatsapp}
            onCheckedChange={(v) => set('hasUnlimitedWhatsapp', v)}
          />
        </Field>
        <Field orientation="horizontal">
          <FieldLabel>Redes sociales</FieldLabel>
          <Switch
            checked={values.hasSocialNetworks}
            onCheckedChange={(v) => set('hasSocialNetworks', v)}
          />
        </Field>
      </div>
    </FieldGroup>
  );
}
