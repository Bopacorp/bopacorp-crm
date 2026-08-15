import { describe, expect, it } from 'vitest';
import { fetchMe, logout } from '@/services/auth.service.js';
import { getRefreshToken } from '@/services/auth-storage.js';
import {
  authenticate,
  authorizationHeaders,
  httpRequest,
  isErrorEnvelope,
  jsonHeaders,
} from './support/api-test-client.js';

const roleAccounts = [
  ['admin', 'admin'],
  ['manager', 'manager'],
  ['supervisor', 'supervisor'],
  ['advisor', 'advisor'],
  ['coordinator', 'coordinator'],
] as const;

describe('authentication and permission contracts', () => {
  it.each(
    roleAccounts,
  )('authenticates the %s account and reads its profile', async (account, role) => {
    const user = await authenticate(account);
    const me = await fetchMe();

    expect(user.email).toBe(me.email);
    expect(user.roles).toContain(role);
    expect(me.roles).toContain(role);
    expect(Array.isArray(user.permissions)).toBe(true);
  });

  it('returns 401 for a protected request without credentials', async () => {
    const response = await httpRequest('/auth/me');

    expect(response.status).toBe(401);
    expect(isErrorEnvelope(response.body)).toBe(true);
    if (!isErrorEnvelope(response.body)) throw new Error('Expected an API error envelope');
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('refreshes an authenticated session and logs out through the API', async () => {
    await authenticate('manager');
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('The login response did not provide a refresh token');

    const refreshResponse = await httpRequest<{
      success: true;
      data: { accessToken: string; refreshToken: string; expiresIn: number };
    }>('/auth/refresh', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ refreshToken }),
    });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number),
      }),
    );

    await logout(refreshToken);
  });

  it('allows users with users.read and denies users without that permission', async () => {
    await authenticate('supervisor');
    const allowed = await httpRequest('/users?page=1&limit=1&sortOrder=asc', {
      headers: authorizationHeaders(),
    });
    expect(allowed.status).toBe(200);

    await authenticate('advisor');
    const denied = await httpRequest('/users?page=1&limit=1&sortOrder=asc', {
      headers: authorizationHeaders(),
    });

    expect(denied.status).toBe(403);
    expect(isErrorEnvelope(denied.body)).toBe(true);
    if (!isErrorEnvelope(denied.body)) throw new Error('Expected an API error envelope');
    expect(denied.body.error.code).toBe('FORBIDDEN');
  });
});
