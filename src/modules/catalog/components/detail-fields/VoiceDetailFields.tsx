import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const set = <K extends keyof VoiceDetailFormValues>(key: K, val: VoiceDetailFormValues[K]) =>
    onChange({ ...values, [key]: val });

  return (
    <FieldGroup>
      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <FieldLabel>{t('catalog.gigasStructural')}</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.gigasStructural}
            onChange={(e) => set('gigasStructural', e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>{t('catalog.gigasLoyalty')}</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.gigasLoyalty}
            onChange={(e) => set('gigasLoyalty', e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>{t('catalog.minutesNational')}</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.minutesNational}
            onChange={(e) => set('minutesNational', e.target.value)}
            disabled={values.hasUnlimitedMinutes}
            placeholder={values.hasUnlimitedMinutes ? t('catalog.unlimited') : ''}
          />
        </Field>
        <Field>
          <FieldLabel>{t('catalog.minutesLdi')}</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.minutesLdi}
            onChange={(e) => set('minutesLdi', e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>{t('catalog.sms')}</FieldLabel>
          <Input
            type="number"
            min={0}
            value={values.sms}
            onChange={(e) => set('sms', e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>{t('catalog.includedRoamingGb')}</FieldLabel>
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
          <FieldLabel>{t('catalog.unlimitedMinutes')}</FieldLabel>
          <Switch
            checked={values.hasUnlimitedMinutes}
            onCheckedChange={(v) => set('hasUnlimitedMinutes', v)}
          />
        </Field>
        <Field orientation="horizontal">
          <FieldLabel>{t('catalog.unlimitedWhatsapp')}</FieldLabel>
          <Switch
            checked={values.hasUnlimitedWhatsapp}
            onCheckedChange={(v) => set('hasUnlimitedWhatsapp', v)}
          />
        </Field>
        <Field orientation="horizontal">
          <FieldLabel>{t('catalog.socialNetworks')}</FieldLabel>
          <Switch
            checked={values.hasSocialNetworks}
            onCheckedChange={(v) => set('hasSocialNetworks', v)}
          />
        </Field>
      </div>
    </FieldGroup>
  );
}
