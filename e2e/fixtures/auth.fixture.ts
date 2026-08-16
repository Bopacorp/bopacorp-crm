import { type APIRequestContext, test as base, expect, type Page } from '@playwright/test';
import { getCredentials, type TestRole } from '../support/auth.js';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthSession {
  tokens: AuthTokens;
  user: unknown;
}

interface Fixtures {
  role: TestRole;
  authenticatedPage: Page;
}

const apiURL = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';

export const test = base.extend<Fixtures>({
  role: ['advisor', { option: true }],
  authenticatedPage: async ({ page, request, role }, use) => {
    const session = await loginThroughApi(request, role);

    await page.addInitScript(
      ({ authSession }) => {
        const session = authSession as {
          tokens: AuthTokens;
          user: unknown;
        };
        localStorage.setItem('bopacorp_access_token', session.tokens.accessToken);
        localStorage.setItem('bopacorp_refresh_token', session.tokens.refreshToken);
        localStorage.setItem(
          'bopacorp_token_expires_at',
          String(Date.now() + session.tokens.expiresIn * 1000),
        );
        localStorage.setItem('bopacorp_user', JSON.stringify(session.user));
        localStorage.setItem('lang', 'es');
      },
      { authSession: session },
    );

    await page.goto('/');
    await use(page);
  },
});

export { expect };

async function loginThroughApi(request: APIRequestContext, role: TestRole): Promise<AuthSession> {
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
