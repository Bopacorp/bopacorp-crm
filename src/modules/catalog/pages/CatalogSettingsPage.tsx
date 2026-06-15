import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryKeys } from '@/lib/query-keys.js';
import { SectionHeader } from '@/shared/ui';
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
import type { LookupTableConfig } from '../components/LookupTableManager.js';
import { LookupTableManager } from '../components/LookupTableManager.js';

const CONFIGS: Array<{ key: string; label: string; config: LookupTableConfig }> = [
  {
    key: 'itemTypes',
    label: 'Tipos de item',
    config: {
      entityName: 'Tipo de item',
      entityNamePlural: 'Tipos de item',
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
    label: 'Tipos de contrato',
    config: {
      entityName: 'Tipo de contrato',
      entityNamePlural: 'Tipos de contrato',
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
    label: 'Segmentos',
    config: {
      entityName: 'Segmento',
      entityNamePlural: 'Segmentos',
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
    label: 'Niveles',
    config: {
      entityName: 'Nivel',
      entityNamePlural: 'Niveles',
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
    label: 'Zonas geográficas',
    config: {
      entityName: 'Zona geográfica',
      entityNamePlural: 'Zonas geográficas',
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
    label: 'Tipos de beneficio',
    config: {
      entityName: 'Tipo de beneficio',
      entityNamePlural: 'Tipos de beneficio',
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
    label: 'Tipos de contenido',
    config: {
      entityName: 'Tipo de contenido',
      entityNamePlural: 'Tipos de contenido',
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

export default function CatalogSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Configuración del catálogo"
        description="Tablas de referencia y categorías"
      />
      <Tabs defaultValue="itemTypes">
        <TabsList variant="line">
          {CONFIGS.map((c) => (
            <TabsTrigger key={c.key} value={c.key}>
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {CONFIGS.map((c) => (
          <TabsContent key={c.key} value={c.key}>
            <LookupTableManager config={c.config} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
