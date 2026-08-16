import type { SalesTargetResponse } from '@bopacorp/shared/reports';
import { expect, test } from './fixtures/auth.fixture.js';

const tierLabels: Record<string, string> = {
  ONE_SHOT: 'One Shot',
  MEDIANO: 'Mediano',
  SMALL: 'Small',
};

test.describe('E2E-CRM-13 mutable reports journey', () => {
  test.use({ role: 'manager' });

  test('edits a sales target in the UI and restores the original values', async ({
    authenticatedPage,
    authenticatedApi,
    mutationRun,
  }, testInfo) => {
    testInfo.setTimeout(90_000);
    const targets = await authenticatedApi.get<SalesTargetResponse[]>('/reports/targets');
    const target = targets[0];
    if (!target) throw new Error('At least one sales target is required for this test');

    const original = {
      minBilling: target.minBilling,
      maxBilling: target.maxBilling,
      minCloses: target.minCloses,
    };
    const changed = {
      minBilling: target.minBilling + 1,
      maxBilling: target.maxBilling === null ? null : target.maxBilling + 1,
      minCloses: target.minCloses + 1,
    };
    const readTarget = async (): Promise<SalesTargetResponse> => {
      const currentTargets = await authenticatedApi.get<SalesTargetResponse[]>('/reports/targets');
      const current = currentTargets.find((candidate) => candidate.id === target.id);
      if (!current) throw new Error('Sales target disappeared while testing');
      return current;
    };

    mutationRun.register('restore the seeded sales target', async () => {
      await authenticatedApi.put(`/reports/targets/${target.id}`, original);
      const restored = await readTarget();
      if (
        restored.minBilling !== original.minBilling ||
        restored.maxBilling !== original.maxBilling ||
        restored.minCloses !== original.minCloses
      ) {
        throw new Error('Sales target was not restored to its original values');
      }
    });

    await authenticatedPage.goto('/reportes');
    await expect(authenticatedPage.getByRole('heading', { name: 'Reportes' })).toBeVisible();
    const tierLabel = tierLabels[target.tierCode] ?? target.tierLabel;
    const tierConfigurationCard = authenticatedPage
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Configuración de tiers' });
    const targetCard = tierConfigurationCard
      .locator('[data-slot="card-content"] > div')
      .filter({ hasText: tierLabel })
      .first();
    await expect(targetCard).toBeVisible();
    await targetCard.getByRole('button').click();

    const inputs = targetCard.locator('input[type="number"]');
    await expect(inputs).toHaveCount(3);
    await inputs.nth(0).fill(String(changed.minBilling));
    await inputs.nth(1).fill(String(changed.maxBilling ?? 0));
    await inputs.nth(2).fill(String(changed.minCloses));
    await targetCard.getByRole('button').first().click();

    await expect
      .poll(
        async () => {
          const current = await readTarget();
          return `${current.minBilling}:${current.maxBilling}:${current.minCloses}`;
        },
        { timeout: 30_000 },
      )
      .toBe(`${changed.minBilling}:${changed.maxBilling}:${changed.minCloses}`);
    await expect(authenticatedPage.getByText('Meta actualizada', { exact: true })).toBeVisible();

    await authenticatedApi.put(`/reports/targets/${target.id}`, original);
    const restored = await readTarget();
    expect(restored.minBilling).toBe(original.minBilling);
    expect(restored.maxBilling).toBe(original.maxBilling);
    expect(restored.minCloses).toBe(original.minCloses);

    await authenticatedPage.screenshot({
      path: testInfo.outputPath('evidence/mutable-reports-target.png'),
      fullPage: true,
    });
  });
});
