import { Plus, X } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBenefitTypeOptions } from '../../hooks/useBenefitTypeOptions.js';

export interface BenefitFormRow {
  _key: number;
  benefitTypeId: string;
  name: string;
  description: string;
  durationDays: string;
}

interface BenefitsSectionProps {
  benefits: BenefitFormRow[];
  onChange: (benefits: BenefitFormRow[]) => void;
}

export function BenefitsSection({ benefits, onChange }: BenefitsSectionProps) {
  const { t } = useTranslation();
  const { options: benefitTypeOptions } = useBenefitTypeOptions();
  const keyCounter = useRef(benefits.length);

  const addRow = () => {
    keyCounter.current += 1;
    onChange([
      ...benefits,
      { _key: keyCounter.current, benefitTypeId: '', name: '', description: '', durationDays: '' },
    ]);
  };

  const removeRow = (index: number) => {
    onChange(benefits.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, patch: Partial<BenefitFormRow>) => {
    onChange(benefits.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="flex flex-col gap-4">
      {benefits.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('catalog.noBenefitsDesc')}</p>
      ) : (
        benefits.map((row, index) => (
          <div key={row._key} className="relative rounded-md border border-border p-4">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-2 top-2"
              onClick={() => removeRow(index)}
            >
              <X />
            </Button>
            <FieldGroup>
              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <FieldLabel>{t('catalog.benefitType')}</FieldLabel>
                  <Select
                    value={row.benefitTypeId}
                    onValueChange={(v) => updateRow(index, { benefitTypeId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {benefitTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>{t('common.name')}</FieldLabel>
                  <Input
                    value={row.name}
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                    maxLength={50}
                  />
                </Field>
                <Field>
                  <FieldLabel>{t('common.description')}</FieldLabel>
                  <Input
                    value={row.description}
                    onChange={(e) => updateRow(index, { description: e.target.value })}
                    maxLength={150}
                  />
                </Field>
                <Field>
                  <FieldLabel>{t('catalog.durationDays')}</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={row.durationDays}
                    onChange={(e) => updateRow(index, { durationDays: e.target.value })}
                    placeholder={t('catalog.permanent')}
                  />
                </Field>
              </div>
            </FieldGroup>
          </div>
        ))
      )}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addRow}>
        <Plus data-icon="inline-start" />
        {t('catalog.addBenefit')}
      </Button>
    </div>
  );
}
