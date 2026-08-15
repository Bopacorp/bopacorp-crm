import type { AuthTokensResponse, LoginResponse, MeResponse } from '@bopacorp/shared/auth';

export const authTokens: AuthTokensResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 3600,
};

export const loginUser: LoginResponse['user'] = {
  id: '00000000-0000-4000-8000-000000000001',
  username: 'maria',
  email: 'maria@bopacorp.test',
  roles: ['manager'],
  permissions: ['employees.read'],
  profile: null,
};

export const loginResponse: LoginResponse = {
  user: loginUser,
  tokens: authTokens,
};

export const meResponse: MeResponse = {
  id: loginUser.id,
  username: loginUser.username,
  email: loginUser.email,
  roles: loginUser.roles,
  profile: loginUser.profile,
};
