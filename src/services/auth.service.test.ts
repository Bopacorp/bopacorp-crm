import type { LoginRequest, MeResponse } from '@bopacorp/shared/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loginUser, meResponse } from '@/test/auth-fixtures';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  getAccessToken: vi.fn(),
  decodeJwtPayload: vi.fn(),
}));

vi.mock('./api.js', () => ({ request: mocks.request }));
vi.mock('./auth-storage.js', () => ({ getAccessToken: mocks.getAccessToken }));
vi.mock('./jwt.js', () => ({ decodeJwtPayload: mocks.decodeJwtPayload }));

import { buildAuthUser, fetchMe, login, logout } from './auth.service.js';

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends login credentials to the auth endpoint', async () => {
    const credentials: LoginRequest = {
      email: 'maria@bopacorp.test',
      password: 'Valid-password1!',
    };
    mocks.request.mockResolvedValue({
      user: loginUser,
      tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: 60 },
    });

    await login(credentials);

    expect(mocks.request).toHaveBeenCalledWith({
      method: 'POST',
      url: '/auth/login',
      data: credentials,
    });
  });

  it('sends the refresh token to logout', async () => {
    mocks.request.mockResolvedValue(undefined);

    await logout('refresh-token');

    expect(mocks.request).toHaveBeenCalledWith({
      method: 'POST',
      url: '/auth/logout',
      data: { refreshToken: 'refresh-token' },
    });
  });

  it('fetches the current user', async () => {
    mocks.request.mockResolvedValue(meResponse);

    await expect(fetchMe()).resolves.toEqual(meResponse);
    expect(mocks.request).toHaveBeenCalledWith({ method: 'GET', url: '/auth/me' });
  });

  it('builds the auth user with permissions from the access token', () => {
    mocks.getAccessToken.mockReturnValue('access-token');
    mocks.decodeJwtPayload.mockReturnValue({ permissions: ['clients.read'] });

    expect(buildAuthUser(meResponse)).toEqual({
      ...meResponse,
      permissions: ['clients.read'],
    });
  });

  it('falls back to empty permissions without a usable access token', () => {
    mocks.getAccessToken.mockReturnValue(null);

    expect(buildAuthUser(meResponse)).toEqual({
      ...meResponse,
      permissions: [],
    });
  });

  it('falls back to empty permissions when the JWT cannot be decoded', () => {
    mocks.getAccessToken.mockReturnValue('malformed-token');
    mocks.decodeJwtPayload.mockImplementation(() => {
      throw new Error('Invalid JWT');
    });

    expect(buildAuthUser(meResponse as MeResponse)).toEqual({
      ...meResponse,
      permissions: [],
    });
  });
});
