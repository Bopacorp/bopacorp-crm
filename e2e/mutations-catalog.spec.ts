import type {
  CatalogItemListItemResponse,
  CatalogItemResponse,
  CategoryTreeResponse,
  ContractTypeListItemResponse,
  ItemTypeListItemResponse,
  SegmentListItemResponse,
  TierListItemResponse,
} from '@bopacorp/shared/catalog';
import { expect, test } from './fixtures/auth.fixture.js';
import { waitForResourceId } from './support/data.js';
import { createSyntheticPng } from './support/synthetic-files.js';

function firstActiveCategory(nodes: CategoryTreeResponse[]): CategoryTreeResponse {
  for (const node of nodes) {
    if (node.isActive) return node;
    if (node.children.length > 0) {
      try {
        return firstActiveCategory(node.children);
      } catch {
        // Try the next category branch.
      }
    }
  }
  throw new Error('At least one active catalog category is required');
}

test.describe('E2E-CRM-11 mutable catalog journey', () => {
  test.use({ role: 'manager' });

  test('creates and edits a catalog product, uploads an image, and deletes it', async ({
    authenticatedPage,
    authenticatedApi,
    mutationRun,
  }, testInfo) => {
    testInfo.setTimeout(90_000);
    const itemName = mutationRun.marker('Mutable Product');
    const updatedItemName = `${itemName} Updated`;
    const itemTypes = await authenticatedApi.get<ItemTypeListItemResponse[]>(
      '/catalog/item-types',
      {
        page: 1,
        limit: 100,
        sortOrder: 'asc',
        isActive: true,
      },
    );
    const contractTypes = await authenticatedApi.get<ContractTypeListItemResponse[]>(
      '/catalog/contract-types',
      { page: 1, limit: 100, sortOrder: 'asc', isActive: true },
    );
    const segments = await authenticatedApi.get<SegmentListItemResponse[]>('/catalog/segments', {
      page: 1,
      limit: 100,
      sortOrder: 'asc',
      isActive: true,
    });
    const tiers = await authenticatedApi.get<TierListItemResponse[]>('/catalog/tiers', {
      page: 1,
      limit: 100,
      sortOrder: 'asc',
      isActive: true,
    });
    const categoryTree = await authenticatedApi.get<CategoryTreeResponse[]>(
      '/catalog/categories/tree',
    );
    const itemType =
      itemTypes.find((type) => type.code.toLowerCase() === 'digital') ?? itemTypes[0];
    const contractType = contractTypes[0];
    const segment = segments[0];
    const tier = tiers[0];
    const category = firstActiveCategory(categoryTree);

    if (!itemType || !contractType || !segment || !tier) {
      throw new Error('Catalog lookup data is incomplete for the mutable journey');
    }

    mutationRun.register('catalog item and image cleanup', async () => {
      const names = [updatedItemName, itemName];
      for (const name of names) {
        const items = await authenticatedApi.get<CatalogItemListItemResponse[]>('/catalog-items', {
          search: name,
          page: 1,
          limit: 100,
        });
        for (const item of items) {
          await authenticatedApi.delete(`/catalog-items/${item.id}/image`, {
            ignoreMissing: true,
          });
          await authenticatedApi.delete(`/catalog-items/${item.id}`, { ignoreMissing: true });
          await authenticatedApi.expectMissing(`/catalog-items/${item.id}`);
        }
      }
    });

    await authenticatedPage.goto('/catalogo');
    await authenticatedPage.getByRole('button', { name: 'Nuevo producto', exact: true }).click();
    const createSheet = authenticatedPage.getByRole('dialog');
    await expect(createSheet.getByRole('heading', { name: 'Nuevo producto' })).toBeVisible();
    await createSheet.locator('#name').fill(itemName);
    await createSheet.locator('#price').fill('19.99');
    await createSheet.locator('#description').fill(mutationRun.marker('Product description'));

    await createSheet.locator('#categoryId').click();
    await authenticatedPage.getByRole('option', { name: new RegExp(category.name, 'i') }).click();
    await createSheet.locator('#itemTypeId').click();
    await authenticatedPage.getByRole('option', { name: itemType.name, exact: true }).click();
    await createSheet.getByText(contractType.name, { exact: true }).click();
    await createSheet.getByText(segment.name, { exact: true }).click();
    await createSheet.locator('#tierId').click();
    await authenticatedPage.getByRole('option', { name: tier.name, exact: true }).click();

    const itemTypeCode = itemType.code.toLowerCase();
    if (itemTypeCode === 'digital') {
      await createSheet
        .getByText('Proveedor', { exact: true })
        .locator('..')
        .locator('input')
        .fill(mutationRun.marker('Digital provider'));
    } else if (itemTypeCode === 'connectivity') {
      await createSheet
        .getByText('Ancho de banda (Mbps)', { exact: true })
        .locator('..')
        .locator('input')
        .fill('100');
    } else if (itemTypeCode === 'voice') {
      await createSheet
        .getByText('Gigas estructurales', { exact: true })
        .locator('..')
        .locator('input')
        .fill('10');
    } else if (itemTypeCode === 'device') {
      await createSheet
        .getByText('Marca', { exact: true })
        .locator('..')
        .locator('input')
        .fill('Bopa');
      await createSheet
        .getByText('Modelo', { exact: true })
        .locator('..')
        .locator('input')
        .fill('E2E');
    }

    await createSheet.getByRole('button', { name: 'Crear', exact: true }).click();

    const itemId = await waitForResourceId<CatalogItemListItemResponse>(
      authenticatedApi,
      '/catalog-items',
      { search: itemName, page: 1, limit: 100 },
      (item) => item.name === itemName,
    );

    const catalogSearch = authenticatedPage.getByPlaceholder('Buscar por nombre…');
    await catalogSearch.fill(itemName);
    const createdItemRow = authenticatedPage.getByRole('row').filter({ hasText: itemName });
    await expect(createdItemRow).toBeVisible();
    await createdItemRow.click();
    await expect(authenticatedPage).toHaveURL(new RegExp(`/catalogo/${itemId}$`));
    await expect(authenticatedPage.getByRole('heading', { name: itemName })).toBeVisible();

    await authenticatedPage.getByRole('button', { name: 'Editar', exact: true }).click();
    const editSheet = authenticatedPage.getByRole('dialog');
    await editSheet.locator('#name').fill(updatedItemName);
    await editSheet.locator('#price').fill('29.99');
    const publishedSwitch = editSheet.locator('#isPublished');
    if ((await publishedSwitch.getAttribute('data-state')) !== 'checked') {
      await publishedSwitch.click();
    }
    await editSheet.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(authenticatedPage.getByRole('heading', { name: updatedItemName })).toBeVisible();

    const imagePath = await createSyntheticPng(testInfo, mutationRun.marker('catalog-image'));
    await authenticatedApi.upload<{ imagePath: string }>(
      `/catalog-items/${itemId}/image`,
      imagePath,
      'image',
      `${mutationRun.runId}.png`,
      'image/png',
    );
    const updatedItem = await authenticatedApi.get<CatalogItemResponse>(`/catalog-items/${itemId}`);
    expect(updatedItem.name).toBe(updatedItemName);
    expect(updatedItem.price).toBe(29.99);
    expect(updatedItem.isPublished).toBe(true);
    expect(updatedItem.imagePath).toBeTruthy();

    await authenticatedApi.delete(`/catalog-items/${itemId}/image`);
    const itemWithoutImage = await authenticatedApi.get<CatalogItemResponse>(
      `/catalog-items/${itemId}`,
    );
    expect(itemWithoutImage.imagePath).toBeNull();

    await authenticatedPage.getByRole('button', { name: 'Eliminar', exact: true }).click();
    const deleteDialog = authenticatedPage.getByRole('alertdialog');
    await deleteDialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(authenticatedPage).toHaveURL(/\/catalogo$/);
    await expect
      .poll(
        async () => {
          try {
            await authenticatedApi.expectMissing(`/catalog-items/${itemId}`);
            return true;
          } catch {
            return false;
          }
        },
        { timeout: 30_000 },
      )
      .toBe(true);

    await authenticatedPage.screenshot({
      path: testInfo.outputPath('evidence/mutable-catalog-journey.png'),
      fullPage: true,
    });
  });
});
