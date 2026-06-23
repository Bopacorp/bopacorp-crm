import type { CatalogItemResponse } from '@bopacorp/shared/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FormAlert } from '@/shared/ui';
import { useCategoryOptions } from '../hooks/useCategoryOptions.js';
import { useContractTypeOptions } from '../hooks/useContractTypeOptions.js';
import { useItemTypeOptions } from '../hooks/useItemTypeOptions.js';
import { useSegmentOptions } from '../hooks/useSegmentOptions.js';
import { useTierOptions } from '../hooks/useTierOptions.js';
import type { BenefitFormRow } from './detail-fields/BenefitsSection.js';
import { BenefitsSection } from './detail-fields/BenefitsSection.js';
import type {
  AgeConditionFormValues,
  LegalConditionFormValues,
  TemporalConditionFormValues,
} from './detail-fields/ConditionsSection.js';
import { ConditionsSection } from './detail-fields/ConditionsSection.js';
import type { ConnectivityDetailFormValues } from './detail-fields/ConnectivityDetailFields.js';
import { CONNECTIVITY_DEFAULTS } from './detail-fields/ConnectivityDetailFields.js';
import type { DeviceDetailFormValues } from './detail-fields/DeviceDetailFields.js';
import { DEVICE_DEFAULTS } from './detail-fields/DeviceDetailFields.js';
import type { DigitalDetailFormValues } from './detail-fields/DigitalDetailFields.js';
import { DIGITAL_DEFAULTS } from './detail-fields/DigitalDetailFields.js';
import type { RoamingDetailFormValues } from './detail-fields/RoamingDetailFields.js';
import { ROAMING_DEFAULTS } from './detail-fields/RoamingDetailFields.js';
import type { DetailValues } from './detail-fields/TypeSpecificFields.js';
import { TypeSpecificFields } from './detail-fields/TypeSpecificFields.js';
import type { VoiceDetailFormValues } from './detail-fields/VoiceDetailFields.js';
import { VOICE_DEFAULTS } from './detail-fields/VoiceDetailFields.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogItemFormValues {
  name: string;
  description: string;
  price: string;
  activationCode: string;
  permanenceMonths: string;
  categoryId: string;
  itemTypeId: string;
  contractTypeId: string;
  segmentId: string;
  tierId: string;
  isActive: boolean;
  isPublished: boolean;
  voiceDetails: VoiceDetailFormValues | null;
  connectivityDetails: ConnectivityDetailFormValues | null;
  digitalDetails: DigitalDetailFormValues | null;
  roamingDetails: RoamingDetailFormValues | null;
  deviceDetails: DeviceDetailFormValues | null;
  benefits: BenefitFormRow[];
  ageConditions: AgeConditionFormValues | null;
  legalConditions: LegalConditionFormValues | null;
  temporalConditions: TemporalConditionFormValues | null;
}

const CatalogItemFormSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  description: z.string(),
  price: z.string().min(1, 'Requerido'),
  activationCode: z.string(),
  permanenceMonths: z.string(),
  categoryId: z.string().min(1, 'Requerido'),
  itemTypeId: z.string().min(1, 'Requerido'),
  contractTypeId: z.string().min(1, 'Requerido'),
  segmentId: z.string().min(1, 'Requerido'),
  tierId: z.string().min(1, 'Requerido'),
  isActive: z.boolean(),
  isPublished: z.boolean(),
  voiceDetails: z.custom<VoiceDetailFormValues | null>(),
  connectivityDetails: z.custom<ConnectivityDetailFormValues | null>(),
  digitalDetails: z.custom<DigitalDetailFormValues | null>(),
  roamingDetails: z.custom<RoamingDetailFormValues | null>(),
  deviceDetails: z.custom<DeviceDetailFormValues | null>(),
  benefits: z.custom<BenefitFormRow[]>(),
  ageConditions: z.custom<AgeConditionFormValues | null>(),
  legalConditions: z.custom<LegalConditionFormValues | null>(),
  temporalConditions: z.custom<TemporalConditionFormValues | null>(),
});

export const EMPTY_FORM_VALUES: CatalogItemFormValues = {
  name: '',
  description: '',
  price: '',
  activationCode: '',
  permanenceMonths: '0',
  categoryId: '',
  itemTypeId: '',
  contractTypeId: '',
  segmentId: '',
  tierId: '',
  isActive: true,
  isPublished: false,
  voiceDetails: null,
  connectivityDetails: null,
  digitalDetails: null,
  roamingDetails: null,
  deviceDetails: null,
  benefits: [],
  ageConditions: null,
  legalConditions: null,
  temporalConditions: null,
};

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function toNum(v: string): number | undefined {
  const n = Number(v);
  return v === '' || Number.isNaN(n) ? undefined : n;
}

function toNumRequired(v: string): number {
  return Number(v) || 0;
}

const CODE_TO_DETAIL_KEY: Record<string, keyof DetailValues> = {
  voice: 'voiceDetails',
  connectivity: 'connectivityDetails',
  digital: 'digitalDetails',
  roaming: 'roamingDetails',
  device: 'deviceDetails',
};

const CODE_TO_DEFAULTS: Record<
  string,
  | VoiceDetailFormValues
  | ConnectivityDetailFormValues
  | DigitalDetailFormValues
  | RoamingDetailFormValues
  | DeviceDetailFormValues
> = {
  voice: VOICE_DEFAULTS,
  connectivity: CONNECTIVITY_DEFAULTS,
  digital: DIGITAL_DEFAULTS,
  roaming: ROAMING_DEFAULTS,
  device: DEVICE_DEFAULTS,
};

export function mapResponseToFormValues(item: CatalogItemResponse): CatalogItemFormValues {
  return {
    name: item.name,
    description: item.description ?? '',
    price: String(item.price),
    activationCode: item.activationCode ?? '',
    permanenceMonths: String(item.permanenceMonths),
    categoryId: item.category.id,
    itemTypeId: item.itemType.id,
    contractTypeId: item.contractType.id,
    segmentId: item.segment.id,
    tierId: item.tier.id,
    isActive: item.isActive,
    isPublished: item.isPublished,
    voiceDetails: item.voiceDetails
      ? {
          gigasStructural: String(item.voiceDetails.gigasStructural),
          gigasLoyalty: String(item.voiceDetails.gigasLoyalty),
          minutesNational:
            item.voiceDetails.minutesNational != null
              ? String(item.voiceDetails.minutesNational)
              : '',
          minutesLdi: String(item.voiceDetails.minutesLdi),
          sms: String(item.voiceDetails.sms),
          hasUnlimitedMinutes: item.voiceDetails.hasUnlimitedMinutes,
          hasUnlimitedWhatsapp: item.voiceDetails.hasUnlimitedWhatsapp,
          hasSocialNetworks: item.voiceDetails.hasSocialNetworks,
          includedRoamingGb: String(item.voiceDetails.includedRoamingGb),
        }
      : null,
    connectivityDetails: item.connectivityDetails
      ? { bandwidthMbps: String(item.connectivityDetails.bandwidthMbps) }
      : null,
    digitalDetails: item.digitalDetails ? { provider: item.digitalDetails.provider } : null,
    roamingDetails: item.roamingDetails
      ? {
          geoZoneId: item.roamingDetails.geoZoneId,
          dataMb: String(item.roamingDetails.dataMb),
          durationDays: String(item.roamingDetails.durationDays),
          hasThrottle: item.roamingDetails.hasThrottle,
        }
      : null,
    deviceDetails: item.deviceDetails
      ? {
          brand: item.deviceDetails.brand,
          model: item.deviceDetails.model,
          storageGb:
            item.deviceDetails.storageGb != null ? String(item.deviceDetails.storageGb) : '',
          financingMonths:
            item.deviceDetails.financingMonths != null
              ? String(item.deviceDetails.financingMonths)
              : '',
          financingMonthly:
            item.deviceDetails.financingMonthly != null
              ? String(item.deviceDetails.financingMonthly)
              : '',
        }
      : null,
    benefits: item.benefits.map((b, i) => ({
      _key: i,
      benefitTypeId: b.benefitTypeId,
      name: b.name,
      description: b.description ?? '',
      durationDays: b.durationDays != null ? String(b.durationDays) : '',
    })),
    ageConditions: item.ageConditions
      ? {
          minAge: String(item.ageConditions.minAge),
          maxAge: item.ageConditions.maxAge != null ? String(item.ageConditions.maxAge) : '',
        }
      : null,
    legalConditions: item.legalConditions
      ? {
          legalRequirement: item.legalConditions.legalRequirement,
          description: item.legalConditions.description ?? '',
        }
      : null,
    temporalConditions: item.temporalConditions
      ? {
          effectiveDate: item.temporalConditions.effectiveDate.split('T')[0],
          expirationDate: item.temporalConditions.expirationDate
            ? item.temporalConditions.expirationDate.split('T')[0]
            : '',
        }
      : null,
  };
}

function buildDetailPayload(values: CatalogItemFormValues, code: string | null) {
  if (!code) return {};
  switch (code) {
    case 'voice':
      if (!values.voiceDetails) return {};
      return {
        voiceDetails: {
          gigasStructural: toNumRequired(values.voiceDetails.gigasStructural),
          gigasLoyalty: toNumRequired(values.voiceDetails.gigasLoyalty),
          minutesNational: toNum(values.voiceDetails.minutesNational),
          minutesLdi: toNumRequired(values.voiceDetails.minutesLdi),
          sms: toNumRequired(values.voiceDetails.sms),
          hasUnlimitedMinutes: values.voiceDetails.hasUnlimitedMinutes,
          hasUnlimitedWhatsapp: values.voiceDetails.hasUnlimitedWhatsapp,
          hasSocialNetworks: values.voiceDetails.hasSocialNetworks,
          includedRoamingGb: toNumRequired(values.voiceDetails.includedRoamingGb),
        },
      };
    case 'connectivity':
      if (!values.connectivityDetails) return {};
      return {
        connectivityDetails: {
          bandwidthMbps: toNumRequired(values.connectivityDetails.bandwidthMbps),
        },
      };
    case 'digital':
      if (!values.digitalDetails) return {};
      return { digitalDetails: { provider: values.digitalDetails.provider } };
    case 'roaming':
      if (!values.roamingDetails) return {};
      return {
        roamingDetails: {
          geoZoneId: values.roamingDetails.geoZoneId,
          dataMb: toNumRequired(values.roamingDetails.dataMb),
          durationDays: toNumRequired(values.roamingDetails.durationDays),
          hasThrottle: values.roamingDetails.hasThrottle,
        },
      };
    case 'device':
      if (!values.deviceDetails) return {};
      return {
        deviceDetails: {
          brand: values.deviceDetails.brand,
          model: values.deviceDetails.model,
          storageGb: toNum(values.deviceDetails.storageGb),
          financingMonths: toNum(values.deviceDetails.financingMonths),
          financingMonthly: toNum(values.deviceDetails.financingMonthly),
        },
      };
    default:
      return {};
  }
}

export function mapFormToRequest(values: CatalogItemFormValues, code: string | null) {
  return {
    name: values.name,
    description: values.description || undefined,
    price: toNumRequired(values.price),
    activationCode: values.activationCode || undefined,
    permanenceMonths: toNumRequired(values.permanenceMonths),
    categoryId: values.categoryId,
    itemTypeId: values.itemTypeId,
    contractTypeId: values.contractTypeId,
    segmentId: values.segmentId,
    tierId: values.tierId,
    isActive: values.isActive,
    isPublished: values.isPublished,
    ...buildDetailPayload(values, code),
    benefits: values.benefits
      .filter((b) => b.benefitTypeId && b.name)
      .map((b) => ({
        benefitTypeId: b.benefitTypeId,
        name: b.name,
        description: b.description || undefined,
        durationDays: toNum(b.durationDays),
      })),
    ageConditions: values.ageConditions
      ? {
          minAge: toNumRequired(values.ageConditions.minAge),
          maxAge: toNum(values.ageConditions.maxAge),
        }
      : undefined,
    legalConditions: values.legalConditions
      ? {
          legalRequirement: values.legalConditions.legalRequirement,
          description: values.legalConditions.description || undefined,
        }
      : undefined,
    temporalConditions: values.temporalConditions
      ? {
          effectiveDate: values.temporalConditions.effectiveDate,
          expirationDate: values.temporalConditions.expirationDate || undefined,
        }
      : undefined,
  };
}

// ─── Form Component ───────────────────────────────────────────────────────────

interface CatalogItemFormProps {
  defaultValues: CatalogItemFormValues;
  onSubmit: (values: CatalogItemFormValues, itemTypeCode: string | null) => void;
  isPending: boolean;
  error?: string;
  submitLabel: string;
  onDirtyChange?: (dirty: boolean) => void;
  onCancel?: () => void;
  mode: 'create' | 'edit';
}

export function CatalogItemForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  submitLabel,
  onDirtyChange,
  onCancel,
  mode,
}: CatalogItemFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CatalogItemFormValues>({
    resolver: zodResolver(CatalogItemFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const { options: categoryOptions } = useCategoryOptions();
  const { options: itemTypeOptions } = useItemTypeOptions();
  const { options: contractTypeOptions } = useContractTypeOptions();
  const { options: segmentOptions } = useSegmentOptions();
  const { options: tierOptions } = useTierOptions();

  const watchedItemTypeId = watch('itemTypeId');
  const itemTypeCode = useMemo(
    () => itemTypeOptions.find((o) => o.value === watchedItemTypeId)?.code ?? null,
    [itemTypeOptions, watchedItemTypeId],
  );

  const prevItemTypeIdRef = useRef(watchedItemTypeId);
  useEffect(() => {
    const prev = prevItemTypeIdRef.current;
    if (prev === watchedItemTypeId) return;
    prevItemTypeIdRef.current = watchedItemTypeId;

    const prevCode = itemTypeOptions.find((o) => o.value === prev)?.code;
    const newCode = itemTypeOptions.find((o) => o.value === watchedItemTypeId)?.code;

    if (prevCode && prevCode !== newCode) {
      const prevKey = CODE_TO_DETAIL_KEY[prevCode];
      // biome-ignore lint/suspicious/noExplicitAny: detail key union too wide for setValue generics
      if (prevKey) setValue(prevKey, null as any, { shouldDirty: true });
    }
    if (newCode) {
      const newKey = CODE_TO_DETAIL_KEY[newCode];
      const defaults = CODE_TO_DEFAULTS[newCode];
      if (newKey && defaults) {
        // biome-ignore lint/suspicious/noExplicitAny: detail key union too wide for setValue generics
        setValue(newKey, defaults as any, { shouldDirty: true });
      }
    }
  }, [watchedItemTypeId, itemTypeOptions, setValue]);

  const handleDetailChange = <K extends keyof DetailValues>(key: K, val: DetailValues[K]) => {
    // biome-ignore lint/suspicious/noExplicitAny: react-hook-form setValue generics can't infer mapped detail types
    setValue(key, val as any, { shouldDirty: true });
  };

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const onSubmitHandler = (data: CatalogItemFormValues) => {
    onSubmit(data, itemTypeCode);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} noValidate className="flex flex-col gap-8">
      {error && <FormAlert message={error} />}

      {/* Section 1: General */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">Información general</h3>
        <FieldGroup>
          <div className="grid gap-5 md:grid-cols-2">
            <Field data-invalid={errors.name ? true : undefined}>
              <FieldLabel>Nombre</FieldLabel>
              <Input {...register('name')} maxLength={200} />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.price ? true : undefined}>
              <FieldLabel>Precio</FieldLabel>
              <Input type="number" min={0} step={0.01} {...register('price')} />
              <FieldError>{errors.price?.message}</FieldError>
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel>Descripción</FieldLabel>
              <Textarea {...register('description')} rows={3} />
            </Field>
            <Field>
              <FieldLabel>Código de activación</FieldLabel>
              <Input {...register('activationCode')} maxLength={50} />
            </Field>
            <Field>
              <FieldLabel>Permanencia (meses)</FieldLabel>
              <Input type="number" min={0} {...register('permanenceMonths')} />
            </Field>
            <Field data-invalid={errors.categoryId ? true : undefined}>
              <FieldLabel>Categoría</FieldLabel>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.categoryId?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.itemTypeId ? true : undefined}>
              <FieldLabel>Tipo de ítem</FieldLabel>
              <Controller
                control={control}
                name="itemTypeId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.itemTypeId?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.contractTypeId ? true : undefined}>
              <FieldLabel>Tipo de contrato</FieldLabel>
              <Controller
                control={control}
                name="contractTypeId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.contractTypeId?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.segmentId ? true : undefined}>
              <FieldLabel>Segmento</FieldLabel>
              <Controller
                control={control}
                name="segmentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      {segmentOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.segmentId?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.tierId ? true : undefined}>
              <FieldLabel>Nivel</FieldLabel>
              <Controller
                control={control}
                name="tierId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {tierOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.tierId?.message}</FieldError>
            </Field>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {mode === 'edit' && (
              <Field orientation="horizontal">
                <FieldLabel>Activo</FieldLabel>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </Field>
            )}
            <Field orientation="horizontal">
              <FieldLabel>Publicado</FieldLabel>
              <Controller
                control={control}
                name="isPublished"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </Field>
          </div>
        </FieldGroup>
      </section>

      {/* Section 2: Technical details */}
      {itemTypeCode && (
        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">Detalle técnico</h3>
          <TypeSpecificFields
            itemTypeCode={itemTypeCode}
            values={{
              voiceDetails: watch('voiceDetails'),
              connectivityDetails: watch('connectivityDetails'),
              digitalDetails: watch('digitalDetails'),
              roamingDetails: watch('roamingDetails'),
              deviceDetails: watch('deviceDetails'),
            }}
            onChange={handleDetailChange}
          />
        </section>
      )}

      {/* Section 3: Benefits */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">Beneficios</h3>
        <BenefitsSection
          benefits={watch('benefits')}
          onChange={(b) => setValue('benefits', b, { shouldDirty: true })}
        />
      </section>

      {/* Section 4: Conditions */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">Condiciones</h3>
        <ConditionsSection
          ageConditions={watch('ageConditions')}
          legalConditions={watch('legalConditions')}
          temporalConditions={watch('temporalConditions')}
          onAgeChange={(v) => setValue('ageConditions', v, { shouldDirty: true })}
          onLegalChange={(v) => setValue('legalConditions', v, { shouldDirty: true })}
          onTemporalChange={(v) => setValue('temporalConditions', v, { shouldDirty: true })}
        />
      </section>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
