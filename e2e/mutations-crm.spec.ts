import type {
  BusinessClientListItemResponse,
  NegotiationListItemResponse,
  NegotiationResponse,
  NegotiationStateResponse,
  VisitListItemResponse,
  VisitTypeResponse,
} from '@bopacorp/shared/crm';
import { expect, test } from './fixtures/auth.fixture.js';
import { firstResource, waitForResourceId } from './support/data.js';

test.describe('E2E-CRM-09 mutable CRM journey', () => {
  test.use({ role: 'advisor' });

  test('creates a client and negotiation, changes state, and removes a visit', async ({
    authenticatedPage,
    authenticatedApi,
    managerApi,
    mutationRun,
  }, testInfo) => {
    testInfo.setTimeout(90_000);
    const clientName = mutationRun.marker('Mutable Client');
    const updatedClientName = `${clientName} Updated`;
    const clientRuc = mutationRun.ruc();
    const negotiationNotes = mutationRun.marker('Negotiation notes');
    const visitNotes = mutationRun.marker('Visit notes');

    mutationRun.registerSearchDelete<BusinessClientListItemResponse>(
      managerApi,
      '/crm/business-clients',
      { search: clientRuc, page: 1, limit: 100 },
      (id) => `/crm/business-clients/${id}`,
      'business clients created by the mutable CRM journey',
    );
    mutationRun.registerSearchDelete<NegotiationListItemResponse>(
      managerApi,
      '/crm/negotiations',
      { search: updatedClientName, page: 1, limit: 100 },
      (id) => `/crm/negotiations/${id}`,
      'negotiations created by the mutable CRM journey',
    );

    await authenticatedPage.goto('/clientes');
    await authenticatedPage.getByRole('button', { name: 'Nuevo cliente', exact: true }).click();

    const clientDialog = authenticatedPage.getByRole('dialog');
    await expect(clientDialog.getByRole('heading', { name: 'Nuevo cliente' })).toBeVisible();
    await clientDialog.locator('#ruc').fill(clientRuc);
    await clientDialog.locator('#businessName').fill(clientName);
    await clientDialog.locator('#contactName').fill(mutationRun.marker('Contact'));
    await clientDialog.locator('#contactPhone').fill('0999999999');
    await clientDialog.locator('#contactEmail').fill(`${mutationRun.runId}@example.test`);
    await clientDialog.locator('#activeServicesCount').fill('3');
    await clientDialog.locator('#currentMonthlyBilling').fill('125.5');
    await clientDialog.getByRole('button', { name: 'Crear', exact: true }).click();

    const clientId = await waitForResourceId<BusinessClientListItemResponse>(
      authenticatedApi,
      '/crm/business-clients',
      { search: clientName, page: 1, limit: 100 },
      (client) => client.ruc === clientRuc,
    );
    await authenticatedPage.getByPlaceholder('Buscar por empresa o RUC…').fill(clientName);
    const clientRow = authenticatedPage.getByRole('row').filter({ hasText: clientName });
    await expect(clientRow).toBeVisible();

    await clientRow.click();
    const detailSheet = authenticatedPage.getByRole('dialog');
    await expect(detailSheet).toContainText(clientName);
    await detailSheet.getByRole('button').first().click();
    await detailSheet.locator('#businessName').fill(updatedClientName);
    await detailSheet.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(detailSheet).toContainText(updatedClientName);

    await authenticatedPage.goto('/negociaciones');
    await authenticatedPage.getByRole('button', { name: 'Nueva negociación', exact: true }).click();

    const negotiationSheet = authenticatedPage.getByRole('dialog');
    await negotiationSheet.locator('#negotiation-client').click();
    await negotiationSheet.getByPlaceholder('Buscar cliente…').fill(updatedClientName);
    await expect(
      authenticatedPage.getByRole('option', { name: updatedClientName, exact: true }),
    ).toBeVisible();
    await authenticatedPage.getByRole('option', { name: updatedClientName, exact: true }).click();
    await negotiationSheet.locator('#negotiation-observations').fill(negotiationNotes);
    await negotiationSheet.getByRole('button', { name: 'Crear', exact: true }).click();

    const negotiationId = await waitForResourceId<NegotiationListItemResponse>(
      authenticatedApi,
      '/crm/negotiations',
      { search: updatedClientName, page: 1, limit: 100 },
      (negotiation) => negotiation.client.businessName === updatedClientName,
    );
    const negotiationResponse = await authenticatedApi.get<NegotiationResponse>(
      `/crm/negotiations/${negotiationId}`,
    );

    await authenticatedPage.goto(`/negociaciones/${negotiationId}`);
    await expect(authenticatedPage).toHaveURL(new RegExp(`/negociaciones/${negotiationId}$`));
    await expect(
      authenticatedPage.getByRole('heading', { name: updatedClientName, exact: true }),
    ).toBeVisible();

    const states = await authenticatedApi.get<NegotiationStateResponse[]>(
      '/crm/negotiation-states',
      { page: 1, limit: 100, sortOrder: 'asc' },
    );
    const targetState = states.find((state) => state.id !== negotiationResponse.state.id);
    if (!targetState) throw new Error('At least two negotiation states are required for this test');

    await authenticatedPage.getByRole('button', { name: 'Cambiar estado', exact: true }).click();
    const stateDialog = authenticatedPage.getByRole('dialog');
    await stateDialog.locator('#change-state-id').click();
    await authenticatedPage.getByRole('option', { name: targetState.name, exact: true }).click();
    const stateResponsePromise = authenticatedPage.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url().endsWith(`/crm/negotiations/${negotiationId}/state`),
    );
    await stateDialog.getByRole('button', { name: 'Cambiar', exact: true }).click();
    const stateResponse = await stateResponsePromise;
    expect(stateResponse.ok()).toBe(true);
    const stateResponseBody = (await stateResponse.json()) as {
      data: NegotiationResponse;
    };
    expect(stateResponseBody.data.state.id).toBe(targetState.id);
    await authenticatedPage.keyboard.press('Escape');

    await authenticatedPage.getByRole('tab', { name: 'Visitas', exact: true }).click();
    const visitType = await firstResource<VisitTypeResponse>(authenticatedApi, '/crm/visit-types');
    mutationRun.registerSearchDelete<VisitListItemResponse>(
      managerApi,
      '/crm/visits',
      { clientId, page: 1, limit: 100 },
      (id) => `/crm/visits/${id}`,
      'visits created by the mutable CRM journey',
    );

    await authenticatedPage.getByRole('button', { name: 'Registrar visita', exact: true }).click();
    const visitSheet = authenticatedPage.getByRole('dialog');
    await visitSheet.locator('#visit-type').click();
    await authenticatedPage.getByRole('option', { name: visitType.name, exact: true }).click();
    await visitSheet.locator('#visit-observations').fill(visitNotes);
    await visitSheet.getByRole('button', { name: 'Registrar visita', exact: true }).click();

    const visitId = await waitForResourceId<VisitListItemResponse>(
      authenticatedApi,
      '/crm/visits',
      { clientId, page: 1, limit: 100 },
      () => true,
    );
    const visitRow = authenticatedPage.getByRole('row').filter({ hasText: visitType.name });
    await expect(visitRow).toBeVisible();
    // Advisors can create visits, while deletion is restricted to managers.
    await managerApi.delete(`/crm/visits/${visitId}`);

    await expect
      .poll(
        async () => {
          try {
            await managerApi.expectMissing(`/crm/visits/${visitId}`);
            return true;
          } catch {
            return false;
          }
        },
        { timeout: 30_000 },
      )
      .toBe(true);

    await authenticatedPage.screenshot({
      path: testInfo.outputPath('evidence/mutable-crm-journey.png'),
      fullPage: true,
    });
  });
});
