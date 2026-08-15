import { beforeEach, describe, expect, it, vi } from 'vitest';
import { catalogItem, contactRequest, PHASE6_TEST_IDS } from '@/test/crm-phase6-fixtures.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  requestPaginated: vi.fn(),
}));

vi.mock('@/services/api.js', () => ({
  request: mocks.request,
  requestPaginated: mocks.requestPaginated,
}));

import {
  createBenefitType,
  createCatalogItem,
  createCategory,
  createContentBlock,
  createContentType,
  createContractType,
  createGeoZone,
  createItemType,
  createSegment,
  createTier,
  deleteCatalogItem,
  deleteCatalogItemImage,
  deleteContentBlock,
  disableBenefitType,
  disableCategory,
  disableContentType,
  disableContractType,
  disableGeoZone,
  disableItemType,
  disableSegment,
  disableTier,
  getBenefitType,
  getCatalogItem,
  getCategory,
  getCategoryTree,
  getContactRequest,
  getContentBlock,
  getContentType,
  getContractType,
  getGeoZone,
  getItemType,
  getSegment,
  getTier,
  listBenefitTypes,
  listCatalogItems,
  listCategories,
  listContactRequests,
  listContentBlocks,
  listContentTypes,
  listContractTypes,
  listGeoZones,
  listItemTypes,
  listSegments,
  listTiers,
  updateBenefitType,
  updateCatalogItem,
  updateCategory,
  updateContactRequest,
  updateContentBlock,
  updateContentType,
  updateContractType,
  updateGeoZone,
  updateItemType,
  updateSegment,
  updateTier,
  uploadCatalogItemImage,
} from './catalog.service.js';

const id = PHASE6_TEST_IDS;
const query = { page: 1, limit: 10, sortOrder: 'asc' as const, search: 'business' };
const lookupCreate = {
  code: 'TEST',
  name: 'Test lookup',
  description: 'Test description',
  isActive: true,
};
const lookupUpdate = { name: 'Updated lookup', isActive: false };
const categoryCreate = {
  parentId: id.category,
  name: 'Child category',
  slug: 'child-category',
  description: 'Child description',
  sortOrder: 2,
  isActive: true,
};
const categoryUpdate = { name: 'Updated category', slug: 'updated-category', isActive: false };
const catalogCreate = {
  categoryId: id.category,
  itemTypeId: id.itemType,
  contractTypeId: id.contractType,
  segmentId: id.segment,
  tierId: id.tier,
  name: 'New catalog item',
  description: 'Catalog item description',
  price: 10,
  activationCode: 'TEST-CODE',
  isActive: true,
  isPublished: false,
  permanenceMonths: 0,
};
const contentBlockCreate = {
  contentKey: 'landing.hero',
  contentTypeId: id.contentType,
  title: 'Hero title',
  body: 'Hero body',
  sortOrder: 1,
};

describe('catalog service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue(catalogItem);
    mocks.requestPaginated.mockResolvedValue({ data: [], meta: undefined });
  });

  it('maps all lookup table operations to their API contracts', async () => {
    const tables = [
      ['item-types', listItemTypes, getItemType, createItemType, updateItemType, disableItemType],
      [
        'contract-types',
        listContractTypes,
        getContractType,
        createContractType,
        updateContractType,
        disableContractType,
      ],
      ['segments', listSegments, getSegment, createSegment, updateSegment, disableSegment],
      ['tiers', listTiers, getTier, createTier, updateTier, disableTier],
      ['geo-zones', listGeoZones, getGeoZone, createGeoZone, updateGeoZone, disableGeoZone],
      [
        'benefit-types',
        listBenefitTypes,
        getBenefitType,
        createBenefitType,
        updateBenefitType,
        disableBenefitType,
      ],
      [
        'content-types',
        listContentTypes,
        getContentType,
        createContentType,
        updateContentType,
        disableContentType,
      ],
    ] as const;

    for (const [, list, get, create, update, disable] of tables) {
      await list(query);
      await get(id.itemType);
      await create(lookupCreate);
      await update(id.itemType, lookupUpdate);
      await disable(id.itemType);
    }

    expect(mocks.requestPaginated).toHaveBeenCalledWith({
      method: 'GET',
      url: '/catalog/item-types',
      params: query,
    });
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'PATCH',
      url: '/catalog/content-types/00000000-0000-4000-8000-000000001002/disable',
    });
    expect(mocks.requestPaginated).toHaveBeenCalledTimes(7);
    expect(mocks.request).toHaveBeenCalledTimes(28);
  });

  it('maps categories, catalog items, content blocks, and contact requests', async () => {
    await listCategories(query);
    await getCategory(id.category);
    await getCategoryTree();
    await createCategory(categoryCreate);
    await updateCategory(id.category, categoryUpdate);
    await disableCategory(id.category);

    await listCatalogItems(query);
    await getCatalogItem(id.item);
    await createCatalogItem(catalogCreate);
    await updateCatalogItem(id.item, { price: 20, isPublished: true });
    await deleteCatalogItem(id.item);
    await deleteCatalogItemImage(id.item);

    await listContentBlocks(query);
    await getContentBlock(id.contentBlock);
    await createContentBlock(contentBlockCreate);
    await updateContentBlock(id.contentBlock, { title: 'Updated title' });
    await deleteContentBlock(id.contentBlock);

    await listContactRequests({ page: 1, limit: 10, sortOrder: 'desc', isAttended: false });
    await getContactRequest(contactRequest.id);
    await updateContactRequest(contactRequest.id, { isAttended: true });

    expect(mocks.request).toHaveBeenCalledWith({
      method: 'GET',
      url: '/catalog/categories/tree',
    });
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'PATCH',
      url: `/catalog-items/${id.item}`,
      data: { price: 20, isPublished: true },
    });
    expect(mocks.requestPaginated).toHaveBeenCalledWith({
      method: 'GET',
      url: '/contact-requests',
      params: { page: 1, limit: 10, sortOrder: 'desc', isAttended: false },
    });
  });

  it('uploads catalog images as multipart form data', async () => {
    const file = new File(['image'], 'catalog.png', { type: 'image/png' });

    await uploadCatalogItemImage(id.item, file);

    const call = mocks.request.mock.calls.at(-1)?.[0];
    expect(call).toMatchObject({
      method: 'POST',
      url: `/catalog-items/${id.item}/image`,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    expect(call.data).toBeInstanceOf(FormData);
    expect(call.data.get('image')).toBe(file);
  });
});
