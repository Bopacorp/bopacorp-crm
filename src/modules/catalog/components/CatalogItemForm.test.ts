import { describe, expect, it } from 'vitest';
import { catalogItem } from '@/test/crm-phase6-fixtures.js';
import {
  type CatalogItemFormValues,
  EMPTY_FORM_VALUES,
  mapFormToRequest,
  mapResponseToFormValues,
} from './CatalogItemForm.js';

const baseValues: CatalogItemFormValues = {
  ...EMPTY_FORM_VALUES,
  name: 'Test product',
  description: 'Product description',
  price: '25.50',
  categoryId: catalogItem.category.id,
  itemTypeId: catalogItem.itemType.id,
  contractTypeId: catalogItem.contractType.id,
  segmentId: catalogItem.segment.id,
  tierId: catalogItem.tier.id,
  benefits: [
    {
      _key: 1,
      benefitTypeId: '00000000-0000-4000-8000-000000001007',
      name: 'Priority',
      description: 'Support',
      durationDays: '30',
    },
    {
      _key: 2,
      benefitTypeId: '',
      name: '',
      description: '',
      durationDays: '',
    },
  ],
  ageConditions: { minAge: '18', maxAge: '' },
  legalConditions: { legalRequirement: 'ID required', description: '' },
  temporalConditions: { effectiveDate: '2026-03-01', expirationDate: '' },
};

describe('CatalogItemForm mapping', () => {
  it('maps a catalog response into editable string fields', () => {
    const values = mapResponseToFormValues(catalogItem);

    expect(values).toMatchObject({
      name: catalogItem.name,
      price: '29.99',
      permanenceMonths: '12',
      itemTypeId: catalogItem.itemType.id,
      voiceDetails: {
        gigasStructural: '10',
        minutesNational: '',
        includedRoamingGb: '1.5',
      },
      benefits: [
        expect.objectContaining({ name: 'Priority support', durationDays: '30', _key: 0 }),
      ],
      ageConditions: { minAge: '18', maxAge: '' },
      temporalConditions: { effectiveDate: '2026-03-01', expirationDate: '' },
    });
  });

  it('maps general values, filters incomplete benefits, and converts numbers', () => {
    const request = mapFormToRequest(
      {
        ...baseValues,
        voiceDetails: {
          gigasStructural: '10',
          gigasLoyalty: '5',
          minutesNational: '',
          minutesLdi: '20',
          sms: '100',
          hasUnlimitedMinutes: true,
          hasUnlimitedWhatsapp: true,
          hasSocialNetworks: false,
          includedRoamingGb: '1.5',
        },
      },
      'voice',
    );

    expect(request).toMatchObject({
      name: 'Test product',
      price: 25.5,
      permanenceMonths: 0,
      voiceDetails: {
        gigasStructural: 10,
        minutesNational: undefined,
        includedRoamingGb: 1.5,
      },
      benefits: [
        {
          benefitTypeId: '00000000-0000-4000-8000-000000001007',
          name: 'Priority',
          description: 'Support',
          durationDays: 30,
        },
      ],
      ageConditions: { minAge: 18, maxAge: undefined },
      legalConditions: { legalRequirement: 'ID required', description: undefined },
      temporalConditions: { effectiveDate: '2026-03-01', expirationDate: undefined },
    });
  });

  it.each([
    ['connectivity', { bandwidthMbps: '100' }, 'connectivityDetails'],
    ['digital', { provider: 'Provider' }, 'digitalDetails'],
    [
      'roaming',
      { geoZoneId: catalogItem.category.id, dataMb: '500', durationDays: '7', hasThrottle: false },
      'roamingDetails',
    ],
    [
      'device',
      {
        brand: 'Brand',
        model: 'Model',
        storageGb: '128',
        financingMonths: '12',
        financingMonthly: '20',
      },
      'deviceDetails',
    ],
  ] as const)('builds the %s detail payload', (code, detail, key) => {
    const values = { ...baseValues, [`${key}`]: detail } as unknown as CatalogItemFormValues;
    const request = mapFormToRequest(values, code);

    const expected = Object.fromEntries(
      Object.entries(detail).map(([field, value]) => {
        if (field === 'bandwidthMbps' || field === 'dataMb' || field === 'durationDays') {
          return [field, Number(value)];
        }
        if (field === 'storageGb' || field === 'financingMonths' || field === 'financingMonthly') {
          return [field, Number(value)];
        }
        return [field, value];
      }),
    );
    expect(request).toHaveProperty(key, expected);
  });

  it('omits detail payloads when no type is selected', () => {
    const request = mapFormToRequest(EMPTY_FORM_VALUES, null);

    expect(request).not.toHaveProperty('voiceDetails');
    expect(request).not.toHaveProperty('deviceDetails');
  });
});
