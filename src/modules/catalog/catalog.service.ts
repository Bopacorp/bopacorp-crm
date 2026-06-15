import type {
  BenefitTypeListItemResponse,
  BenefitTypeResponse,
  CatalogItemListItemResponse,
  CatalogItemResponse,
  CategoryListItemResponse,
  CategoryResponse,
  CategoryTreeResponse,
  ContactRequestResponse,
  ContentBlockResponse,
  ContentTypeListItemResponse,
  ContentTypeResponse,
  ContractTypeListItemResponse,
  ContractTypeResponse,
  CreateBenefitTypeRequest,
  CreateCatalogItemRequest,
  CreateCategoryRequest,
  CreateContentBlockRequest,
  CreateContentTypeRequest,
  CreateContractTypeRequest,
  CreateGeoZoneRequest,
  CreateItemTypeRequest,
  CreateSegmentRequest,
  CreateTierRequest,
  GeoZoneListItemResponse,
  GeoZoneResponse,
  ItemTypeListItemResponse,
  ItemTypeResponse,
  ListBenefitTypesQuery,
  ListCatalogItemsQuery,
  ListCategoriesQuery,
  ListContactRequestsQuery,
  ListContentBlocksQuery,
  ListContentTypesQuery,
  ListContractTypesQuery,
  ListGeoZonesQuery,
  ListItemTypesQuery,
  ListSegmentsQuery,
  ListTiersQuery,
  SegmentListItemResponse,
  SegmentResponse,
  TierListItemResponse,
  TierResponse,
  UpdateBenefitTypeRequest,
  UpdateCatalogItemRequest,
  UpdateCategoryRequest,
  UpdateContactRequest,
  UpdateContentBlockRequest,
  UpdateContentTypeRequest,
  UpdateContractTypeRequest,
  UpdateGeoZoneRequest,
  UpdateItemTypeRequest,
  UpdateSegmentRequest,
  UpdateTierRequest,
} from '@bopacorp/shared/catalog';
import type { PaginationMeta } from '@bopacorp/shared/common';
import { request, requestPaginated } from '@/services/api.js';

// ─── Item Types ──────────────────────────────────────────────────────────────

export function listItemTypes(query: ListItemTypesQuery) {
  return requestPaginated<ItemTypeListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/catalog/item-types',
    params: query,
  });
}

export function getItemType(id: string) {
  return request<ItemTypeResponse>({ method: 'GET', url: `/catalog/item-types/${id}` });
}

export function createItemType(data: CreateItemTypeRequest) {
  return request<ItemTypeResponse>({ method: 'POST', url: '/catalog/item-types', data });
}

export function updateItemType(id: string, data: UpdateItemTypeRequest) {
  return request<ItemTypeResponse>({ method: 'PATCH', url: `/catalog/item-types/${id}`, data });
}

export function disableItemType(id: string) {
  return request<ItemTypeResponse>({ method: 'PATCH', url: `/catalog/item-types/${id}/disable` });
}

// ─── Contract Types ──────────────────────────────────────────────────────────

export function listContractTypes(query: ListContractTypesQuery) {
  return requestPaginated<ContractTypeListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/catalog/contract-types',
    params: query,
  });
}

export function getContractType(id: string) {
  return request<ContractTypeResponse>({ method: 'GET', url: `/catalog/contract-types/${id}` });
}

export function createContractType(data: CreateContractTypeRequest) {
  return request<ContractTypeResponse>({ method: 'POST', url: '/catalog/contract-types', data });
}

export function updateContractType(id: string, data: UpdateContractTypeRequest) {
  return request<ContractTypeResponse>({
    method: 'PATCH',
    url: `/catalog/contract-types/${id}`,
    data,
  });
}

export function disableContractType(id: string) {
  return request<ContractTypeResponse>({
    method: 'PATCH',
    url: `/catalog/contract-types/${id}/disable`,
  });
}

// ─── Segments ────────────────────────────────────────────────────────────────

export function listSegments(query: ListSegmentsQuery) {
  return requestPaginated<SegmentListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/catalog/segments',
    params: query,
  });
}

export function getSegment(id: string) {
  return request<SegmentResponse>({ method: 'GET', url: `/catalog/segments/${id}` });
}

export function createSegment(data: CreateSegmentRequest) {
  return request<SegmentResponse>({ method: 'POST', url: '/catalog/segments', data });
}

export function updateSegment(id: string, data: UpdateSegmentRequest) {
  return request<SegmentResponse>({ method: 'PATCH', url: `/catalog/segments/${id}`, data });
}

export function disableSegment(id: string) {
  return request<SegmentResponse>({ method: 'PATCH', url: `/catalog/segments/${id}/disable` });
}

// ─── Tiers ───────────────────────────────────────────────────────────────────

export function listTiers(query: ListTiersQuery) {
  return requestPaginated<TierListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/catalog/tiers',
    params: query,
  });
}

export function getTier(id: string) {
  return request<TierResponse>({ method: 'GET', url: `/catalog/tiers/${id}` });
}

export function createTier(data: CreateTierRequest) {
  return request<TierResponse>({ method: 'POST', url: '/catalog/tiers', data });
}

export function updateTier(id: string, data: UpdateTierRequest) {
  return request<TierResponse>({ method: 'PATCH', url: `/catalog/tiers/${id}`, data });
}

export function disableTier(id: string) {
  return request<TierResponse>({ method: 'PATCH', url: `/catalog/tiers/${id}/disable` });
}

// ─── Geo Zones ───────────────────────────────────────────────────────────────

export function listGeoZones(query: ListGeoZonesQuery) {
  return requestPaginated<GeoZoneListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/catalog/geo-zones',
    params: query,
  });
}

export function getGeoZone(id: string) {
  return request<GeoZoneResponse>({ method: 'GET', url: `/catalog/geo-zones/${id}` });
}

export function createGeoZone(data: CreateGeoZoneRequest) {
  return request<GeoZoneResponse>({ method: 'POST', url: '/catalog/geo-zones', data });
}

export function updateGeoZone(id: string, data: UpdateGeoZoneRequest) {
  return request<GeoZoneResponse>({ method: 'PATCH', url: `/catalog/geo-zones/${id}`, data });
}

export function disableGeoZone(id: string) {
  return request<GeoZoneResponse>({ method: 'PATCH', url: `/catalog/geo-zones/${id}/disable` });
}

// ─── Benefit Types ───────────────────────────────────────────────────────────

export function listBenefitTypes(query: ListBenefitTypesQuery) {
  return requestPaginated<BenefitTypeListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/catalog/benefit-types',
    params: query,
  });
}

export function getBenefitType(id: string) {
  return request<BenefitTypeResponse>({ method: 'GET', url: `/catalog/benefit-types/${id}` });
}

export function createBenefitType(data: CreateBenefitTypeRequest) {
  return request<BenefitTypeResponse>({ method: 'POST', url: '/catalog/benefit-types', data });
}

export function updateBenefitType(id: string, data: UpdateBenefitTypeRequest) {
  return request<BenefitTypeResponse>({
    method: 'PATCH',
    url: `/catalog/benefit-types/${id}`,
    data,
  });
}

export function disableBenefitType(id: string) {
  return request<BenefitTypeResponse>({
    method: 'PATCH',
    url: `/catalog/benefit-types/${id}/disable`,
  });
}

// ─── Content Types ───────────────────────────────────────────────────────────

export function listContentTypes(query: ListContentTypesQuery) {
  return requestPaginated<ContentTypeListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/catalog/content-types',
    params: query,
  });
}

export function getContentType(id: string) {
  return request<ContentTypeResponse>({ method: 'GET', url: `/catalog/content-types/${id}` });
}

export function createContentType(data: CreateContentTypeRequest) {
  return request<ContentTypeResponse>({ method: 'POST', url: '/catalog/content-types', data });
}

export function updateContentType(id: string, data: UpdateContentTypeRequest) {
  return request<ContentTypeResponse>({
    method: 'PATCH',
    url: `/catalog/content-types/${id}`,
    data,
  });
}

export function disableContentType(id: string) {
  return request<ContentTypeResponse>({
    method: 'PATCH',
    url: `/catalog/content-types/${id}/disable`,
  });
}

// ─── Categories ──────────────────────────────────────────────────────────────

export function listCategories(query: ListCategoriesQuery) {
  return requestPaginated<CategoryListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/catalog/categories',
    params: query,
  });
}

export function getCategoryTree() {
  return request<CategoryTreeResponse[]>({ method: 'GET', url: '/catalog/categories/tree' });
}

export function getCategory(id: string) {
  return request<CategoryResponse>({ method: 'GET', url: `/catalog/categories/${id}` });
}

export function createCategory(data: CreateCategoryRequest) {
  return request<CategoryResponse>({ method: 'POST', url: '/catalog/categories', data });
}

export function updateCategory(id: string, data: UpdateCategoryRequest) {
  return request<CategoryResponse>({ method: 'PATCH', url: `/catalog/categories/${id}`, data });
}

export function disableCategory(id: string) {
  return request<CategoryResponse>({ method: 'PATCH', url: `/catalog/categories/${id}/disable` });
}

// ─── Catalog Items ───────────────────────────────────────────────────────────

export function listCatalogItems(query: ListCatalogItemsQuery) {
  return requestPaginated<CatalogItemListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/catalog-items',
    params: query,
  });
}

export function getCatalogItem(id: string) {
  return request<CatalogItemResponse>({ method: 'GET', url: `/catalog-items/${id}` });
}

export function createCatalogItem(data: CreateCatalogItemRequest) {
  return request<CatalogItemResponse>({ method: 'POST', url: '/catalog-items', data });
}

export function updateCatalogItem(id: string, data: UpdateCatalogItemRequest) {
  return request<CatalogItemResponse>({ method: 'PATCH', url: `/catalog-items/${id}`, data });
}

export function deleteCatalogItem(id: string) {
  return request<void>({ method: 'DELETE', url: `/catalog-items/${id}` });
}

export function uploadCatalogItemImage(id: string, file: File) {
  const formData = new FormData();
  formData.append('image', file);
  return request<CatalogItemResponse>({
    method: 'POST',
    url: `/catalog-items/${id}/image`,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function deleteCatalogItemImage(id: string) {
  return request<CatalogItemResponse>({ method: 'DELETE', url: `/catalog-items/${id}/image` });
}

// ─── Content Blocks ──────────────────────────────────────────────────────────

export function listContentBlocks(query: ListContentBlocksQuery) {
  return requestPaginated<ContentBlockResponse, PaginationMeta>({
    method: 'GET',
    url: '/catalog/content-blocks',
    params: query,
  });
}

export function getContentBlock(id: string) {
  return request<ContentBlockResponse>({ method: 'GET', url: `/catalog/content-blocks/${id}` });
}

export function createContentBlock(data: CreateContentBlockRequest) {
  return request<ContentBlockResponse>({ method: 'POST', url: '/catalog/content-blocks', data });
}

export function updateContentBlock(id: string, data: UpdateContentBlockRequest) {
  return request<ContentBlockResponse>({
    method: 'PATCH',
    url: `/catalog/content-blocks/${id}`,
    data,
  });
}

export function deleteContentBlock(id: string) {
  return request<void>({ method: 'DELETE', url: `/catalog/content-blocks/${id}` });
}

// ─── Contact Requests ────────────────────────────────────────────────────────

export function listContactRequests(query: ListContactRequestsQuery) {
  return requestPaginated<ContactRequestResponse, PaginationMeta>({
    method: 'GET',
    url: '/contact-requests',
    params: query,
  });
}

export function getContactRequest(id: string) {
  return request<ContactRequestResponse>({ method: 'GET', url: `/contact-requests/${id}` });
}

export function updateContactRequest(id: string, data: UpdateContactRequest) {
  return request<ContactRequestResponse>({
    method: 'PATCH',
    url: `/contact-requests/${id}`,
    data,
  });
}
