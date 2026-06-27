import type { CatalogItemResponse } from '@bopacorp/shared/catalog';
import {
  CreateAgeConditionSchema,
  CreateCatalogItemRequestSchema,
  CreateConnectivityDetailSchema,
  CreateDeviceDetailSchema,
  CreateDigitalDetailSchema,
  CreateLegalConditionSchema,
  CreateRoamingDetailSchema,
  CreateVoiceDetailSchema,
} from '@bopacorp/shared/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { Controller, useForm, useFormState } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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

function toNumberInput(value: unknown): number | undefined {
  if (value === '' || value == null) return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function numberInput<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(toNumberInput, schema);
}

const CatalogItemFormSchema = z.object({
  name: CreateCatalogItemRequestSchema.shape.name,
  description: CreateCatalogItemRequestSchema.shape.description,
  price: numberInput(CreateCatalogItemRequestSchema.shape.price),
  activationCode: CreateCatalogItemRequestSchema.shape.activationCode,
  permanenceMonths: numberInput(CreateCatalogItemRequestSchema.shape.permanenceMonths),
  categoryId: CreateCatalogItemRequestSchema.shape.categoryId,
  itemTypeId: CreateCatalogItemRequestSchema.shape.itemTypeId,
  contractTypeId: CreateCatalogItemRequestSchema.shape.contractTypeId,
  segmentId: CreateCatalogItemRequestSchema.shape.segmentId,
  tierId: CreateCatalogItemRequestSchema.shape.tierId,
  isActive: z.boolean(),
  isPublished: z.boolean(),
  voiceDetails: z
    .object({
      gigasStructural: numberInput(CreateVoiceDetailSchema.shape.gigasStructural),
      gigasLoyalty: numberInput(CreateVoiceDetailSchema.shape.gigasLoyalty),
      minutesNational: numberInput(CreateVoiceDetailSchema.shape.minutesNational),
      minutesLdi: numberInput(CreateVoiceDetailSchema.shape.minutesLdi),
      sms: numberInput(CreateVoiceDetailSchema.shape.sms),
      hasUnlimitedMinutes: z.boolean(),
      hasUnlimitedWhatsapp: z.boolean(),
      hasSocialNetworks: z.boolean(),
      includedRoamingGb: numberInput(CreateVoiceDetailSchema.shape.includedRoamingGb),
    })
    .nullable(),
  connectivityDetails: z
    .object({
      bandwidthMbps: numberInput(CreateConnectivityDetailSchema.shape.bandwidthMbps),
    })
    .nullable(),
  digitalDetails: z
    .object({
      provider: CreateDigitalDetailSchema.shape.provider,
    })
    .nullable(),
  roamingDetails: z
    .object({
      geoZoneId: CreateRoamingDetailSchema.shape.geoZoneId,
      dataMb: numberInput(CreateRoamingDetailSchema.shape.dataMb),
      durationDays: numberInput(CreateRoamingDetailSchema.shape.durationDays),
      hasThrottle: z.boolean(),
    })
    .nullable(),
  deviceDetails: z
    .object({
      brand: CreateDeviceDetailSchema.shape.brand,
      model: CreateDeviceDetailSchema.shape.model,
      storageGb: numberInput(CreateDeviceDetailSchema.shape.storageGb),
      financingMonths: numberInput(CreateDeviceDetailSchema.shape.financingMonths),
      financingMonthly: numberInput(CreateDeviceDetailSchema.shape.financingMonthly),
    })
    .nullable(),
  benefits: z.array(
    z.object({
      _key: z.number(),
      benefitTypeId: z.string(),
      name: z.string(),
      description: z.string(),
      durationDays: z.string(),
    }),
  ),
  ageConditions: z
    .object({
      minAge: numberInput(CreateAgeConditionSchema.shape.minAge),
      maxAge: numberInput(CreateAgeConditionSchema.shape.maxAge),
    })
    .nullable(),
  legalConditions: z
    .object({
      legalRequirement: CreateLegalConditionSchema.shape.legalRequirement,
      description: CreateLegalConditionSchema.shape.description,
    })
    .nullable(),
  temporalConditions: z
    .object({
      effectiveDate: z.string(),
      expirationDate: z.string(),
    })
    .nullable(),
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

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      *
    </span>
  );
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
    description: values.description,
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
  const { t } = useTranslation();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CatalogItemFormValues>({
    resolver: zodResolver(CatalogItemFormSchema) as unknown as Resolver<CatalogItemFormValues>,
    defaultValues,
    mode: 'onTouched',
  });
  const { isSubmitting, isSubmitted, isValid } = useFormState({ control });
  const isBusy = isPending || isSubmitting;

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

  const onSubmitHandler: SubmitHandler<CatalogItemFormValues> = (data) => {
    onSubmit(data, itemTypeCode);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} noValidate className="flex flex-col gap-8">
      {error && <FormAlert message={error} />}

      {/* Section 1: General */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">{t('catalog.generalInfo')}</h3>
        <FieldGroup>
          <div className="grid gap-5 md:grid-cols-2">
            <Field data-invalid={errors.name ? true : undefined}>
              <FieldLabel htmlFor="name">
                {t('common.name')} <RequiredMark />
              </FieldLabel>
              <Input id="name" {...register('name')} maxLength={200} disabled={isBusy} />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.price ? true : undefined}>
              <FieldLabel htmlFor="price">
                {t('common.price')} <RequiredMark />
              </FieldLabel>
              <Input
                id="price"
                type="number"
                min={0}
                step={0.01}
                {...register('price')}
                disabled={isBusy}
              />
              <FieldError>{errors.price?.message}</FieldError>
            </Field>
            <Field className="md:col-span-2" data-invalid={errors.description ? true : undefined}>
              <FieldLabel htmlFor="description">
                {t('common.description')} <RequiredMark />
              </FieldLabel>
              <Textarea
                id="description"
                {...register('description')}
                rows={3}
                maxLength={1000}
                disabled={isBusy}
              />
              <FieldError>{errors.description?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="activationCode">{t('catalog.activationCode')}</FieldLabel>
              <Input
                id="activationCode"
                {...register('activationCode')}
                maxLength={20}
                disabled={isBusy}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="permanenceMonths">{t('catalog.permanenceMonths')}</FieldLabel>
              <Input
                id="permanenceMonths"
                type="number"
                min={0}
                {...register('permanenceMonths')}
                disabled={isBusy}
              />
            </Field>
            <Field data-invalid={errors.categoryId ? true : undefined}>
              <FieldLabel htmlFor="categoryId">
                {t('common.category')} <RequiredMark />
              </FieldLabel>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="categoryId" disabled={isBusy}>
                      <SelectValue placeholder={t('common.selectCategory')} />
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
              <FieldLabel htmlFor="itemTypeId">
                {t('catalog.itemType')} <RequiredMark />
              </FieldLabel>
              <Controller
                control={control}
                name="itemTypeId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="itemTypeId" disabled={isBusy}>
                      <SelectValue placeholder={t('common.selectType')} />
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
              <FieldLabel htmlFor="contractTypeId">
                {t('catalog.contractType')} <RequiredMark />
              </FieldLabel>
              <Controller
                control={control}
                name="contractTypeId"
                render={({ field }) => (
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    spacing={0}
                    value={field.value}
                    onValueChange={(v) => {
                      if (v) field.onChange(v);
                    }}
                    className="w-full"
                    disabled={isBusy}
                  >
                    {contractTypeOptions.map((opt) => (
                      <ToggleGroupItem key={opt.value} value={opt.value} className="flex-1 text-xs">
                        {opt.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
              />
              <FieldError>{errors.contractTypeId?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.segmentId ? true : undefined}>
              <FieldLabel htmlFor="segmentId">
                {t('catalog.segment')} <RequiredMark />
              </FieldLabel>
              <Controller
                control={control}
                name="segmentId"
                render={({ field }) => (
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    spacing={0}
                    value={field.value}
                    onValueChange={(v) => {
                      if (v) field.onChange(v);
                    }}
                    className="w-full"
                    disabled={isBusy}
                  >
                    {segmentOptions.map((opt) => (
                      <ToggleGroupItem key={opt.value} value={opt.value} className="flex-1 text-xs">
                        {opt.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
              />
              <FieldError>{errors.segmentId?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.tierId ? true : undefined}>
              <FieldLabel htmlFor="tierId">
                {t('catalog.level')} <RequiredMark />
              </FieldLabel>
              <Controller
                control={control}
                name="tierId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tierId" disabled={isBusy}>
                      <SelectValue placeholder={t('common.selectLevel')} />
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
                <FieldLabel htmlFor="isActive">{t('common.active')}</FieldLabel>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isBusy}
                    />
                  )}
                />
              </Field>
            )}
            <Field orientation="horizontal">
              <FieldLabel htmlFor="isPublished">{t('common.published')}</FieldLabel>
              <Controller
                control={control}
                name="isPublished"
                render={({ field }) => (
                  <Switch
                    id="isPublished"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isBusy}
                  />
                )}
              />
            </Field>
          </div>
        </FieldGroup>
      </section>

      {/* Section 2: Technical details */}
      {itemTypeCode && (
        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">{t('catalog.technicalDetail')}</h3>
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
        <h3 className="text-sm font-semibold text-foreground">{t('catalog.benefits')}</h3>
        <BenefitsSection
          benefits={watch('benefits')}
          onChange={(b) => setValue('benefits', b, { shouldDirty: true })}
        />
      </section>

      {/* Section 4: Conditions */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">{t('catalog.conditions')}</h3>
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
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isBusy}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isBusy || (isSubmitted && !isValid)}>
          {isBusy && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
