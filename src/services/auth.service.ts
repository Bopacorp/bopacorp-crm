import type { AuthTokensResponse, ProfileResponse } from '@bopacorp/shared/auth';
import { request } from './api.js';
import { getAccessToken } from './auth-storage.js';
import { decodeJwtPayload } from './jwt.js';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  profile: ProfileResponse | null;
}

interface MeResponse {
  id: string;
  username: string;
  email: string;
  roles: string[];
  profile: ProfileResponse | null;
}

interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokensResponse;
}

export async function login(data: { email: string; password: string }) {
  return request<LoginResponse>({
    method: 'POST',
    url: '/auth/login',
    data,
  });
}

export async function logout(refreshToken: string) {
  return request<void>({
    method: 'POST',
    url: '/auth/logout',
    data: { refreshToken },
  });
}

export async function fetchMe() {
  return request<MeResponse>({
    method: 'GET',
    url: '/auth/me',
  });
}

export function buildAuthUser(me: MeResponse): AuthUser {
  let permissions: string[] = [];
  try {
    const token = getAccessToken();
    if (token) {
      permissions = decodeJwtPayload(token).permissions ?? [];
    }
  } catch {
    // malformed JWT — fall back to empty permissions
  }
  return { ...me, permissions };
}
