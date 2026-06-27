import { useTranslation } from 'react-i18next';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export interface AgeConditionFormValues {
  minAge: string;
  maxAge: string;
}

export interface LegalConditionFormValues {
  legalRequirement: string;
  description: string;
}

export interface TemporalConditionFormValues {
  effectiveDate: string;
  expirationDate: string;
}

export const AGE_DEFAULTS: AgeConditionFormValues = { minAge: '18', maxAge: '' };
export const LEGAL_DEFAULTS: LegalConditionFormValues = { legalRequirement: '', description: '' };
export const TEMPORAL_DEFAULTS: TemporalConditionFormValues = {
  effectiveDate: '',
  expirationDate: '',
};

interface ConditionsSectionProps {
  ageConditions: AgeConditionFormValues | null;
  legalConditions: LegalConditionFormValues | null;
  temporalConditions: TemporalConditionFormValues | null;
  onAgeChange: (v: AgeConditionFormValues | null) => void;
  onLegalChange: (v: LegalConditionFormValues | null) => void;
  onTemporalChange: (v: TemporalConditionFormValues | null) => void;
}

export function ConditionsSection({
  ageConditions,
  legalConditions,
  temporalConditions,
  onAgeChange,
  onLegalChange,
  onTemporalChange,
}: ConditionsSectionProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      {/* Age */}
      <div className="flex flex-col gap-3">
        <Field orientation="horizontal">
          <FieldLabel>{t('catalog.applyAgeCondition')}</FieldLabel>
          <Switch
            checked={ageConditions !== null}
            onCheckedChange={(v) => onAgeChange(v ? { ...AGE_DEFAULTS } : null)}
          />
        </Field>
        {ageConditions && (
          <FieldGroup>
            <div className="grid gap-5 md:grid-cols-2">
              <Field>
                <FieldLabel>{t('catalog.minAge')}</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={ageConditions.minAge}
                  onChange={(e) => onAgeChange({ ...ageConditions, minAge: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>{t('catalog.maxAge')}</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={ageConditions.maxAge}
                  onChange={(e) => onAgeChange({ ...ageConditions, maxAge: e.target.value })}
                  placeholder={t('catalog.noLimit')}
                />
              </Field>
            </div>
          </FieldGroup>
        )}
      </div>

      {/* Legal */}
      <div className="flex flex-col gap-3">
        <Field orientation="horizontal">
          <FieldLabel>{t('catalog.applyLegalCondition')}</FieldLabel>
          <Switch
            checked={legalConditions !== null}
            onCheckedChange={(v) => onLegalChange(v ? { ...LEGAL_DEFAULTS } : null)}
          />
        </Field>
        {legalConditions && (
          <FieldGroup>
            <Field>
              <FieldLabel>{t('catalog.legalRequirement')}</FieldLabel>
              <Textarea
                value={legalConditions.legalRequirement}
                onChange={(e) =>
                  onLegalChange({ ...legalConditions, legalRequirement: e.target.value })
                }
                rows={3}
              />
            </Field>
            <Field>
              <FieldLabel>{t('common.description')}</FieldLabel>
              <Input
                value={legalConditions.description}
                onChange={(e) => onLegalChange({ ...legalConditions, description: e.target.value })}
              />
            </Field>
          </FieldGroup>
        )}
      </div>

      {/* Temporal */}
      <div className="flex flex-col gap-3">
        <Field orientation="horizontal">
          <FieldLabel>{t('catalog.applyTemporalCondition')}</FieldLabel>
          <Switch
            checked={temporalConditions !== null}
            onCheckedChange={(v) => onTemporalChange(v ? { ...TEMPORAL_DEFAULTS } : null)}
          />
        </Field>
        {temporalConditions && (
          <FieldGroup>
            <div className="grid gap-5 md:grid-cols-2">
              <Field>
                <FieldLabel>{t('catalog.effectiveFrom')}</FieldLabel>
                <Input
                  type="date"
                  value={temporalConditions.effectiveDate}
                  onChange={(e) =>
                    onTemporalChange({ ...temporalConditions, effectiveDate: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>{t('catalog.expiration')}</FieldLabel>
                <Input
                  type="date"
                  value={temporalConditions.expirationDate}
                  onChange={(e) =>
                    onTemporalChange({ ...temporalConditions, expirationDate: e.target.value })
                  }
                />
              </Field>
            </div>
          </FieldGroup>
        )}
      </div>
    </div>
  );
}
