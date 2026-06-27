import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryKeys } from '@/lib/query-keys.js';
import type { LookupTableConfig } from '@/shared/ui';
import { LookupTableManager, SectionHeader } from '@/shared/ui';
import {
  createBenefitType,
  createContentType,
  createContractType,
  createGeoZone,
  createItemType,
  createSegment,
  createTier,
  disableBenefitType,
  disableContentType,
  disableContractType,
  disableGeoZone,
  disableItemType,
  disableSegment,
  disableTier,
  getBenefitType,
  getContentType,
  getContractType,
  getGeoZone,
  getItemType,
  getSegment,
  getTier,
  listBenefitTypes,
  listContentTypes,
  listContractTypes,
  listGeoZones,
  listItemTypes,
  listSegments,
  listTiers,
  updateBenefitType,
  updateContentType,
  updateContractType,
  updateGeoZone,
  updateItemType,
  updateSegment,
  updateTier,
} from '../catalog.service.js';
import { CategoryManager } from '../components/CategoryManager.js';

export default function CatalogSettingsPage() {
  const { t } = useTranslation();

  const configs: Array<{ key: string; label: string; config: LookupTableConfig }> = [
    {
      key: 'itemTypes',
      label: t('catalog.itemTypes'),
      config: {
        entityName: t('catalog.itemTypeSingular'),
        entityNamePlural: t('catalog.itemTypePlural'),
        permissionPrefix: 'item_types',
        queryKey: queryKeys.catalog.itemTypes.all,
        listFn: listItemTypes,
        getFn: getItemType,
        createFn: createItemType,
        updateFn: updateItemType,
        disableFn: disableItemType,
      },
    },
    {
      key: 'contractTypes',
      label: t('catalog.contractTypes'),
      config: {
        entityName: t('catalog.contractTypeSingular'),
        entityNamePlural: t('catalog.contractTypePlural'),
        permissionPrefix: 'contract_types',
        queryKey: queryKeys.catalog.contractTypes.all,
        listFn: listContractTypes,
        getFn: getContractType,
        createFn: createContractType,
        updateFn: updateContractType,
        disableFn: disableContractType,
      },
    },
    {
      key: 'segments',
      label: t('catalog.segments'),
      config: {
        entityName: t('catalog.segmentSingular'),
        entityNamePlural: t('catalog.segmentPlural'),
        permissionPrefix: 'segments',
        queryKey: queryKeys.catalog.segments.all,
        listFn: listSegments,
        getFn: getSegment,
        createFn: createSegment,
        updateFn: updateSegment,
        disableFn: disableSegment,
      },
    },
    {
      key: 'tiers',
      label: t('catalog.levels'),
      config: {
        entityName: t('catalog.levelSingular'),
        entityNamePlural: t('catalog.levelPlural'),
        permissionPrefix: 'tiers',
        queryKey: queryKeys.catalog.tiers.all,
        listFn: listTiers,
        getFn: getTier,
        createFn: createTier,
        updateFn: updateTier,
        disableFn: disableTier,
      },
    },
    {
      key: 'geoZones',
      label: t('catalog.geoZones'),
      config: {
        entityName: t('catalog.geoZoneSingular'),
        entityNamePlural: t('catalog.geoZonePlural'),
        permissionPrefix: 'geo_zones',
        queryKey: queryKeys.catalog.geoZones.all,
        listFn: listGeoZones,
        getFn: getGeoZone,
        createFn: createGeoZone,
        updateFn: updateGeoZone,
        disableFn: disableGeoZone,
      },
    },
    {
      key: 'benefitTypes',
      label: t('catalog.benefitTypes'),
      config: {
        entityName: t('catalog.benefitTypeSingular'),
        entityNamePlural: t('catalog.benefitTypePlural'),
        permissionPrefix: 'benefit_types',
        queryKey: queryKeys.catalog.benefitTypes.all,
        listFn: listBenefitTypes,
        getFn: getBenefitType,
        createFn: createBenefitType,
        updateFn: updateBenefitType,
        disableFn: disableBenefitType,
      },
    },
    {
      key: 'contentTypes',
      label: t('catalog.contentTypes'),
      config: {
        entityName: t('catalog.contentTypeSingular'),
        entityNamePlural: t('catalog.contentTypePlural'),
        permissionPrefix: 'content_types',
        queryKey: queryKeys.catalog.contentTypes.all,
        listFn: listContentTypes,
        getFn: getContentType,
        createFn: createContentType,
        updateFn: updateContentType,
        disableFn: disableContentType,
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title={t('catalog.settingsTitle')}
        description={t('catalog.settingsDescription')}
      />
      <Tabs defaultValue="categories">
        <TabsList variant="line">
          <TabsTrigger value="categories">{t('catalog.categories')}</TabsTrigger>
          {configs.map((c) => (
            <TabsTrigger key={c.key} value={c.key}>
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>
        {configs.map((c) => (
          <TabsContent key={c.key} value={c.key}>
            <LookupTableManager config={c.config} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
