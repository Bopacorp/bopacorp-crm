import type { BusinessClientResponse, NegotiationResponse } from '@bopacorp/shared/crm';
import type { UploadDocumentResponse } from '@bopacorp/shared/document-uploads';
import type {
  DocumentStateHistoryResponse,
  DocumentTypeResponse,
  NegotiationDocumentResponse,
} from '@bopacorp/shared/documents';
import { expect, installAuthSession, loginThroughApi, test } from './fixtures/auth.fixture.js';
import { createSyntheticPdf } from './support/synthetic-files.js';

test.describe('E2E-CRM-10 mutable documentation journey', () => {
  test.use({ role: 'advisor' });

  test('creates pending documents, approves one, rejects another, and cleans document records', async ({
    authenticatedApi,
    authSession,
    browser,
    managerApi,
    request,
    mutationRun,
  }, testInfo) => {
    testInfo.setTimeout(90_000);
    const advisorId = (authSession.user as { id: string }).id;
    const clientName = mutationRun.marker('Documents Client');
    const clientRuc = mutationRun.ruc();
    const negotiationNotes = mutationRun.marker('Documents negotiation');
    const filenameOne = `${mutationRun.runId}-approved.pdf`;
    const filenameTwo = `${mutationRun.runId}-rejected.pdf`;

    mutationRun.registerSearchDelete<BusinessClientResponse>(
      managerApi,
      '/crm/business-clients',
      { search: clientRuc, page: 1, limit: 100 },
      (id) => `/crm/business-clients/${id}`,
      'document journey client',
    );
    mutationRun.registerSearchDelete<NegotiationResponse>(
      managerApi,
      '/crm/negotiations',
      { search: clientName, page: 1, limit: 100 },
      (id) => `/crm/negotiations/${id}`,
      'document journey negotiation',
    );
    mutationRun.registerSearchDelete<NegotiationDocumentResponse>(
      authenticatedApi,
      '/documents',
      { search: filenameOne, page: 1, limit: 100 },
      (id) => `/documents/${id}`,
      'first mutable document',
    );
    mutationRun.registerSearchDelete<NegotiationDocumentResponse>(
      authenticatedApi,
      '/documents',
      { search: filenameTwo, page: 1, limit: 100 },
      (id) => `/documents/${id}`,
      'second mutable document',
    );

    const client = await authenticatedApi.post<BusinessClientResponse>('/crm/business-clients', {
      advisorId,
      ruc: clientRuc,
      businessName: clientName,
      contactName: mutationRun.marker('Documents contact'),
      contactEmail: `${mutationRun.runId}@example.test`,
      activeServicesCount: 1,
      currentMonthlyBilling: 75,
      isActive: true,
    });
    const negotiation = await authenticatedApi.post<NegotiationResponse>('/crm/negotiations', {
      clientId: client.id,
      advisorId,
      observations: negotiationNotes,
      isActive: true,
    });
    const documentTypes = await authenticatedApi.get<DocumentTypeResponse[]>('/documents/types', {
      page: 1,
      limit: 100,
      isActive: true,
    });
    const documentType = documentTypes[0];
    if (!documentType) throw new Error('At least one active document type is required');

    const pdfOne = await createSyntheticPdf(testInfo, filenameOne.replace('.pdf', ''));
    const pdfTwo = await createSyntheticPdf(testInfo, filenameTwo.replace('.pdf', ''));
    const uploadOne = await authenticatedApi.upload<UploadDocumentResponse>(
      '/document-uploads',
      pdfOne,
      'file',
      filenameOne,
      'application/pdf',
    );
    const uploadTwo = await authenticatedApi.upload<UploadDocumentResponse>(
      '/document-uploads',
      pdfTwo,
      'file',
      filenameTwo,
      'application/pdf',
    );

    const firstDocument = await authenticatedApi.post<NegotiationDocumentResponse>('/documents', {
      negotiationId: negotiation.id,
      documentTypeId: documentType.id,
      ...uploadOne,
    });
    const secondDocument = await authenticatedApi.post<NegotiationDocumentResponse>('/documents', {
      negotiationId: negotiation.id,
      documentTypeId: documentType.id,
      ...uploadTwo,
    });

    const coordinatorSession = await loginThroughApi(request, 'coordinator');
    const coordinatorContext = await browser.newContext({
      baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
      locale: 'es-EC',
      timezoneId: 'America/Guayaquil',
    });
    const coordinatorPage = await coordinatorContext.newPage();

    try {
      await installAuthSession(coordinatorPage, coordinatorSession);
      await coordinatorPage.goto('/documentacion');
      await expect(coordinatorPage.getByRole('heading', { name: 'Documentación' })).toBeVisible();

      const documentSearch = coordinatorPage.getByPlaceholder('Buscar por empresa…');
      await documentSearch.fill(mutationRun.runId);
      const pendingRows = coordinatorPage
        .getByRole('row')
        .filter({ hasText: clientName })
        .filter({ hasText: 'Pendiente' });
      const documentPageContent = coordinatorPage
        .locator('main')
        .locator('div.flex.flex-col.gap-6')
        .first();
      await expect(pendingRows).toHaveCount(2);
      await expect(documentPageContent).not.toHaveClass(/pointer-events-none/);

      const firstPendingRow = pendingRows.first();
      await expect(firstPendingRow).toBeVisible();
      const firstActionsButton = firstPendingRow.getByRole('button', {
        name: 'Acciones',
        exact: true,
      });
      await expect(firstActionsButton).toHaveCount(1);
      await firstActionsButton.scrollIntoViewIfNeeded();
      await firstActionsButton.click();
      await coordinatorPage.getByRole('menuitem', { name: 'Aprobar', exact: true }).click();
      await expect
        .poll(
          async () => {
            const states = await Promise.all(
              [firstDocument.id, secondDocument.id].map(async (id) => {
                const document = await authenticatedApi.get<NegotiationDocumentResponse>(
                  `/documents/${id}`,
                );
                return `${id}:${document.state}`;
              }),
            );
            return states.find((state) => state.endsWith(':ACCEPTED')) ?? '';
          },
          { timeout: 30_000 },
        )
        .not.toBe('');

      const documentStates = await Promise.all(
        [firstDocument.id, secondDocument.id].map(async (id) => {
          const document = await authenticatedApi.get<NegotiationDocumentResponse>(
            `/documents/${id}`,
          );
          return { id, state: document.state };
        }),
      );
      const rejectedDocumentId = documentStates.find(
        (document) => document.state === 'PENDING_APPROVAL',
      )?.id;
      if (!rejectedDocumentId) {
        throw new Error('The approval journey did not leave a pending document to reject');
      }

      await coordinatorPage.reload();
      await expect(coordinatorPage.getByRole('heading', { name: 'Documentación' })).toBeVisible();
      await coordinatorPage.getByPlaceholder('Buscar por empresa…').fill(mutationRun.runId);

      const remainingPendingRow = coordinatorPage
        .getByRole('row')
        .filter({ hasText: clientName })
        .filter({ hasText: 'Pendiente' });
      await expect(remainingPendingRow).toHaveCount(1);
      await expect(documentPageContent).not.toHaveClass(/pointer-events-none/);
      const remainingActionsButton = remainingPendingRow.getByRole('button', {
        name: 'Acciones',
        exact: true,
      });
      await expect(remainingActionsButton).toHaveCount(1);
      await remainingActionsButton.scrollIntoViewIfNeeded();
      await remainingActionsButton.click();
      await coordinatorPage.getByRole('menuitem', { name: 'Rechazar', exact: true }).click();

      const rejectionDialog = coordinatorPage.getByRole('dialog');
      const rejectionNotes = mutationRun.marker('Coordinator rejection');
      await rejectionDialog.locator('#coordinatorMessage').fill(rejectionNotes);
      await rejectionDialog.getByRole('button', { name: 'Rechazar', exact: true }).click();

      await expect
        .poll(
          async () =>
            (
              await authenticatedApi.get<NegotiationDocumentResponse>(
                `/documents/${rejectedDocumentId}`,
              )
            ).state,
          { timeout: 30_000 },
        )
        .toBe('REJECTED');
      const rejectedDocument = await authenticatedApi.get<NegotiationDocumentResponse>(
        `/documents/${rejectedDocumentId}`,
      );
      expect(rejectedDocument.coordinatorMessage).toBe(rejectionNotes);

      const history = await authenticatedApi.get<DocumentStateHistoryResponse[]>(
        `/documents/${rejectedDocumentId}/history`,
        { documentId: rejectedDocumentId, page: 1, limit: 100 },
      );
      expect(history.some((entry) => entry.newState === 'REJECTED')).toBe(true);
      await coordinatorPage.screenshot({
        path: testInfo.outputPath('evidence/mutable-document-review.png'),
        fullPage: true,
      });
    } finally {
      await coordinatorContext.close();
    }
  });
});
