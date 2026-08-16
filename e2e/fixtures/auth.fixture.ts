import { type APIRequestContext, test as base, expect, type Page } from '@playwright/test';
import { AuthenticatedApi } from '../support/api.js';
import { getCredentials, type TestRole } from '../support/auth.js';
import { MutationTestRun } from '../support/mutation.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  tokens: AuthTokens;
  user: unknown;
}

interface Fixtures {
  role: TestRole;
  authSession: AuthSession;
  authenticatedApi: AuthenticatedApi;
  managerApi: AuthenticatedApi;
  authenticatedPage: Page;
  mutationRun: MutationTestRun;
}

export const apiURL = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';

export const test = base.extend<Fixtures>({
  role: ['advisor', { option: true }],
  authSession: async ({ request, role }, use) => {
    await use(await loginThroughApi(request, role));
  },
  authenticatedApi: async ({ request, authSession }, use) => {
    await use(new AuthenticatedApi(request, apiURL, authSession.tokens.accessToken));
  },
  managerApi: async ({ request, role, authSession }, use) => {
    const managerSession =
      role === 'manager' ? authSession : await loginThroughApi(request, 'manager');
    await use(new AuthenticatedApi(request, apiURL, managerSession.tokens.accessToken));
  },
  authenticatedPage: async ({ page, authSession }, use) => {
    await installAuthSession(page, authSession);
    await page.goto('/');
    await use(page);
  },
  mutationRun: async ({ request: _request }, use, testInfo) => {
    void _request;
    const run = new MutationTestRun(testInfo);
    let cleanupError: Error | undefined;

    try {
      await use(run);
    } finally {
      try {
        await run.cleanup();
      } catch (error) {
        cleanupError = error instanceof Error ? error : new Error('Unknown cleanup error');
        await testInfo.attach('mutable-e2e-cleanup-error.txt', {
          body: cleanupError.message,
          contentType: 'text/plain',
        });
      }
    }

    if (cleanupError) throw cleanupError;
  },
});

export { expect };

export async function installAuthSession(page: Page, authSession: AuthSession): Promise<void> {
  await page.addInitScript(
    ({ session }) => {
      localStorage.setItem('bopacorp_access_token', session.tokens.accessToken);
      localStorage.setItem('bopacorp_refresh_token', session.tokens.refreshToken);
      localStorage.setItem(
        'bopacorp_token_expires_at',
        String(Date.now() + session.tokens.expiresIn * 1000),
      );
      localStorage.setItem('bopacorp_user', JSON.stringify(session.user));
      localStorage.setItem('lang', 'es');
    },
    { session: authSession },
  );
}

export async function loginThroughApi(
  request: APIRequestContext,
  role: TestRole,
): Promise<AuthSession> {
  const response = await request.post(`${apiURL.replace(/\/$/, '')}/auth/login`, {
    data: getCredentials(role),
    failOnStatusCode: false,
  });

  const body = (await response.json()) as {
    success?: boolean;
    data?: { tokens?: AuthTokens; user?: unknown };
    error?: { code?: string; message?: string };
  };

  if (!response.ok() || !body.success || !body.data?.tokens || !body.data.user) {
    throw new Error(
      `API login failed for ${role}: ${response.status()} ${body.error?.code ?? 'UNKNOWN_ERROR'}`,
    );
  }

  return { tokens: body.data.tokens, user: body.data.user };
}
