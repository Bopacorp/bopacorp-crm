const KEYS = {
  user: 'bopacorp_user',
  accessToken: 'bopacorp_access_token',
  refreshToken: 'bopacorp_refresh_token',
  expiresAt: 'bopacorp_token_expires_at',
} as const;

import type { AuthTokensResponse } from '@bopacorp/shared/auth';

const LEGACY_KEYS = ['access_token', 'refresh_token', 'token_expires_at'] as const;

export function getAccessToken(): string | null {
  return localStorage.getItem(KEYS.accessToken);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(KEYS.refreshToken);
}

export function getTokenExpiresAt(): number | null {
  const raw = localStorage.getItem(KEYS.expiresAt);
  return raw ? Number(raw) : null;
}

export function getStoredUser<T>(): T | null {
  try {
    const raw = localStorage.getItem(KEYS.user);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: AuthTokensResponse): void {
  localStorage.setItem(KEYS.accessToken, tokens.accessToken);
  localStorage.setItem(KEYS.refreshToken, tokens.refreshToken);
  localStorage.setItem(KEYS.expiresAt, String(Date.now() + tokens.expiresIn * 1000));
}

export function saveUser<T>(user: T): void {
  localStorage.setItem(KEYS.user, JSON.stringify(user));
}

export function clearAll(): void {
  for (const key of Object.values(KEYS)) {
    localStorage.removeItem(key);
  }
  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key);
  }
}
