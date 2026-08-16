import { expect, test } from './fixtures/auth.fixture.js';

test.describe('E2E-CRM-03 coordinator documentation review', () => {
  test.use({ role: 'coordinator' });

  test('opens documentation and inspects review actions without changing data', async ({
    authenticatedPage,
  }, testInfo) => {
    await authenticatedPage.goto('/documentacion');
    await expect(authenticatedPage).toHaveURL(/\/documentacion$/);
    await expect(authenticatedPage.getByRole('heading', { name: 'Documentación' })).toBeVisible();

    const table = authenticatedPage.getByRole('table');
    const emptyState = authenticatedPage.getByText('No hay documentos', { exact: true });
    await expect(table.or(emptyState)).toBeVisible({ timeout: 30000 });

    if (await table.isVisible()) {
      const actionButton = authenticatedPage
        .getByRole('button', { name: 'Acciones', exact: true })
        .first();
      await actionButton.click();
      await expect(
        authenticatedPage.getByRole('menuitem', { name: 'Descargar', exact: true }),
      ).toBeVisible();

      const rejectAction = authenticatedPage.getByRole('menuitem', {
        name: 'Rechazar',
        exact: true,
      });
      if (await rejectAction.count()) {
        await rejectAction.click();
        await expect(
          authenticatedPage.getByRole('heading', { name: 'Rechazar documento' }),
        ).toBeVisible();
        await expect(authenticatedPage.getByLabel('Notas del coordinador')).toBeVisible();
        await authenticatedPage.getByRole('button', { name: 'Cancelar', exact: true }).click();
      }
    }

    await authenticatedPage.screenshot({
      path: testInfo.outputPath('evidence/coordinator-documentation.png'),
      fullPage: true,
    });
  });
});
