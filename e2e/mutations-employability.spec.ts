import type {
  JobVacancyListItemResponse,
  JobVacancyResponse,
} from '@bopacorp/shared/employability';
import { expect, test } from './fixtures/auth.fixture.js';
import { waitForResourceId } from './support/data.js';

test.describe('E2E-CRM-12 mutable employability journey', () => {
  test.use({ role: 'manager' });

  test('creates, edits, publishes, reviews applicants, and deletes a vacancy', async ({
    authenticatedPage,
    authenticatedApi,
    mutationRun,
  }, testInfo) => {
    testInfo.setTimeout(90_000);
    const vacancyTitle = `Mutable Vacancy-${mutationRun.runId.slice(-8)}`;
    const updatedVacancyTitle = `${vacancyTitle} Updated`;
    const description = mutationRun.marker('Vacancy description');
    const requirements = mutationRun.marker('Vacancy requirements');

    mutationRun.registerSearchDelete<JobVacancyListItemResponse>(
      authenticatedApi,
      '/employability/vacancies',
      { search: vacancyTitle, page: 1, limit: 100 },
      (id) => `/employability/vacancies/${id}`,
      'original mutable vacancy title',
    );
    mutationRun.registerSearchDelete<JobVacancyListItemResponse>(
      authenticatedApi,
      '/employability/vacancies',
      { search: updatedVacancyTitle, page: 1, limit: 100 },
      (id) => `/employability/vacancies/${id}`,
      'updated mutable vacancy title',
    );

    await authenticatedPage.goto('/empleabilidad/vacantes');
    await authenticatedPage.getByRole('button', { name: 'Nueva vacante', exact: true }).click();
    const createDialog = authenticatedPage.getByRole('dialog');
    await createDialog.getByPlaceholder('Título de la vacante').fill(vacancyTitle);
    await createDialog.getByPlaceholder('Descripción general de la vacante').fill(description);
    await createDialog.getByPlaceholder('Requisitos del cargo').fill(requirements);
    await createDialog.getByRole('button', { name: 'Crear', exact: true }).click();

    const vacancyId = await waitForResourceId<JobVacancyListItemResponse>(
      authenticatedApi,
      '/employability/vacancies',
      { search: vacancyTitle, page: 1, limit: 100 },
      (vacancy) => vacancy.title === vacancyTitle,
    );
    const vacancyRow = authenticatedPage.getByRole('row').filter({ hasText: vacancyTitle });
    await expect(vacancyRow).toBeVisible();
    await vacancyRow.click();

    const vacancySheet = authenticatedPage.getByRole('dialog');
    await expect(vacancySheet).toContainText(vacancyTitle);
    await vacancySheet.locator('[data-slot="sheet-header"] button').first().click({ force: true });
    await vacancySheet.getByPlaceholder('Título de la vacante').fill(updatedVacancyTitle);
    const publishedSwitch = vacancySheet.getByRole('switch').nth(1);
    if ((await publishedSwitch.getAttribute('data-state')) !== 'checked') {
      await publishedSwitch.click();
    }
    await vacancySheet.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(vacancySheet).toContainText(updatedVacancyTitle);

    await expect
      .poll(
        async () => {
          const vacancy = await authenticatedApi.get<JobVacancyResponse>(
            `/employability/vacancies/${vacancyId}`,
          );
          return `${vacancy.title}:${vacancy.isPublished}`;
        },
        { timeout: 30_000 },
      )
      .toBe(`${updatedVacancyTitle}:true`);

    await authenticatedPage.goto('/empleabilidad/aplicantes');
    await expect(authenticatedPage.getByRole('heading', { name: 'Aplicantes' })).toBeVisible();
    await authenticatedPage.screenshot({
      path: testInfo.outputPath('evidence/mutable-employability-applicants.png'),
      fullPage: true,
    });

    await authenticatedPage.goto('/empleabilidad/vacantes');
    const updatedRow = authenticatedPage.getByRole('row').filter({ hasText: updatedVacancyTitle });
    await expect(updatedRow).toBeVisible();
    await updatedRow.click();
    const detailSheet = authenticatedPage.getByRole('dialog');
    await detailSheet.locator('[data-slot="sheet-header"] button').nth(1).click({ force: true });
    const deleteDialog = authenticatedPage.getByRole('alertdialog');
    await deleteDialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(authenticatedPage).toHaveURL(/\/empleabilidad\/vacantes$/);

    await expect
      .poll(
        async () => {
          try {
            await authenticatedApi.expectMissing(`/employability/vacancies/${vacancyId}`);
            return true;
          } catch {
            return false;
          }
        },
        { timeout: 30_000 },
      )
      .toBe(true);
  });
});
