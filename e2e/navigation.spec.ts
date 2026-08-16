import { expect, test } from './fixtures/auth.fixture.js';
import type { TestRole } from './support/auth.js';

test.describe('E2E-CRM-01 advisor CRM read-only journey', () => {
  test.use({ role: 'advisor' });

  test('reads owned clients and opens a negotiation detail', async ({
    authenticatedPage,
  }, testInfo) => {
    await authenticatedPage.goto('/clientes');
    await expect(authenticatedPage).toHaveURL(/\/clientes$/);
    await expect(authenticatedPage.getByRole('heading', { name: 'Clientes' })).toBeVisible();
    await expect(authenticatedPage.getByRole('table')).toBeVisible();
    await expect(authenticatedPage.getByPlaceholder('Buscar por empresa o RUC…')).toBeVisible();

    await authenticatedPage.screenshot({
      path: testInfo.outputPath('evidence/advisor-clients.png'),
      fullPage: true,
    });

    await authenticatedPage.goto('/negociaciones');
    await expect(authenticatedPage.getByRole('heading', { name: 'Negociaciones' })).toBeVisible();
    const negotiationRows = authenticatedPage.getByRole('row');
    await expect(negotiationRows.nth(1)).toBeVisible({ timeout: 30000 });
    await expect(negotiationRows.nth(1).getByRole('cell').nth(1)).toHaveText(/\S+/, {
      timeout: 30000,
    });
    await negotiationRows.nth(1).getByRole('cell').nth(1).click();
    await expect(authenticatedPage).toHaveURL(/\/negociaciones\/[^/]+$/);
  });
});

test.describe('E2E-CRM-02 advisor document visibility', () => {
  test.use({ role: 'advisor' });

  test('opens an owned negotiation and reads its document section', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/negociaciones');
    const negotiationRows = authenticatedPage.getByRole('row');
    await expect(negotiationRows.nth(1)).toBeVisible({ timeout: 30000 });
    await expect(negotiationRows.nth(1).getByRole('cell').nth(1)).toHaveText(/\S+/, {
      timeout: 30000,
    });
    await negotiationRows.nth(1).getByRole('cell').nth(1).click();
    await expect(authenticatedPage).toHaveURL(/\/negociaciones\/[^/]+$/);

    await expect(authenticatedPage.getByText('Documentos', { exact: true })).toBeVisible();
    await expect(authenticatedPage.getByText('Historial', { exact: true })).toBeVisible();
  });
});

test.describe('E2E-CRM-07 protected organization route', () => {
  test.use({ role: 'advisor' });

  test('redirects an advisor away from organization management', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/organizacion/equipo');
    await expect(authenticatedPage).toHaveURL(/\/overview$/);
    await expect(authenticatedPage.getByRole('heading', { name: 'Mis métricas' })).toBeVisible();
    await expect(
      authenticatedPage.getByRole('link', { name: 'Organización', exact: true }),
    ).toHaveCount(0);
  });
});

for (const role of ['manager', 'supervisor'] satisfies TestRole[]) {
  test.describe(`E2E-CRM-04 ${role} reports read-only journey`, () => {
    test.use({ role });

    test('loads performance and applies a date filter without mutation', async ({
      authenticatedPage,
    }, testInfo) => {
      await authenticatedPage.goto('/reportes');
      await expect(authenticatedPage.getByRole('heading', { name: 'Reportes' })).toBeVisible();
      await expect(
        authenticatedPage.getByRole('tab', { name: 'Rendimiento', exact: true }),
      ).toBeVisible();

      const dateInputs = authenticatedPage.locator('input[type="date"]');
      await expect(dateInputs).toHaveCount(2);
      await dateInputs.nth(0).fill('2026-01-01');
      await dateInputs.nth(1).fill('2026-12-31');
      await expect(dateInputs.nth(0)).toHaveValue('2026-01-01');
      await expect(dateInputs.nth(1)).toHaveValue('2026-12-31');

      await authenticatedPage.screenshot({
        path: testInfo.outputPath(`evidence/${role}-reports-filter.png`),
        fullPage: true,
      });
    });
  });
}
