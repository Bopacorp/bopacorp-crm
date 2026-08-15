import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authTokens, loginUser } from '@/test/auth-fixtures';
import {
  clearAll,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  getTokenExpiresAt,
  saveTokens,
  saveUser,
} from './auth-storage.js';

describe('auth-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and reads tokens, expiration, and user data', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);

    saveTokens(authTokens);
    saveUser(loginUser);

    expect(getAccessToken()).toBe(authTokens.accessToken);
    expect(getRefreshToken()).toBe(authTokens.refreshToken);
    expect(getTokenExpiresAt()).toBe(1_000_000 + authTokens.expiresIn * 1000);
    expect(getStoredUser<typeof loginUser>()).toEqual(loginUser);

    vi.restoreAllMocks();
  });

  it('returns null when the stored user JSON is invalid', () => {
    localStorage.setItem('bopacorp_user', '{invalid-json');

    expect(getStoredUser()).toBeNull();
  });

  it('removes current and legacy auth keys', () => {
    localStorage.setItem('bopacorp_access_token', authTokens.accessToken);
    localStorage.setItem('bopacorp_refresh_token', authTokens.refreshToken);
    localStorage.setItem('bopacorp_token_expires_at', '123');
    localStorage.setItem('bopacorp_user', JSON.stringify(loginUser));
    localStorage.setItem('access_token', 'legacy-access');
    localStorage.setItem('refresh_token', 'legacy-refresh');
    localStorage.setItem('token_expires_at', '456');

    clearAll();

    expect(localStorage.length).toBe(0);
  });
});
