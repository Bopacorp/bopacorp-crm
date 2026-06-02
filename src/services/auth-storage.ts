const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const EXPIRES_AT_KEY = 'token_expires_at';

interface TokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function saveTokens({ accessToken, refreshToken, expiresIn }: TokenPayload) {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getTokenExpiresAt(): number | null {
  const raw = localStorage.getItem(EXPIRES_AT_KEY);
  return raw ? Number(raw) : null;
}

export function clearAll() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
}
