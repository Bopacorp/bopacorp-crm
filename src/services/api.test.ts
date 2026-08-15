import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const apiClient = Object.assign(vi.fn(), {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  });
  const axiosPost = vi.fn();
  return { apiClient, axiosPost };
});

vi.mock('axios', () => ({
  default: Object.assign(vi.fn(), {
    create: vi.fn(() => mocks.apiClient),
    isAxiosError: (error: unknown) => Boolean((error as { isAxiosError?: boolean }).isAxiosError),
    post: mocks.axiosPost,
  }),
}));

import { request, requestPaginated } from './api.js';

type RequestInterceptor = (
  config: InternalAxiosRequestConfig,
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
type ResponseInterceptor = (error: AxiosError) => Promise<unknown>;

const requestInterceptor = mocks.apiClient.interceptors.request.use.mock
  .calls[0]?.[0] as RequestInterceptor;
const responseInterceptor = mocks.apiClient.interceptors.response.use.mock
  .calls[0]?.[1] as ResponseInterceptor;

function makeRequestConfig(url: string): InternalAxiosRequestConfig {
  return {
    url,
    method: 'GET',
    headers: {} as InternalAxiosRequestConfig['headers'],
  } as InternalAxiosRequestConfig;
}

function makeUnauthorizedError(config: InternalAxiosRequestConfig): AxiosError {
  return {
    config,
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Unauthorized',
    response: { status: 401 } as AxiosError['response'],
  } as AxiosError;
}

function stubWindow() {
  const fakeWindow = {
    dispatchEvent: vi.fn(),
    location: { href: '' },
  };
  vi.stubGlobal('window', fakeWindow);
  return fakeWindow;
}

describe('api', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.apiClient.mockReset();
    mocks.axiosPost.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('unwraps the payload from a successful response', async () => {
    mocks.apiClient.mockResolvedValue({ data: { success: true, data: { id: 'client-1' } } });

    await expect(
      request<{ id: string }>({ method: 'GET', url: '/clients/client-1' }),
    ).resolves.toEqual({ id: 'client-1' });
  });

  it('normalizes an API error envelope with details', async () => {
    mocks.apiClient.mockResolvedValue({
      data: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data',
          details: [{ field: 'email', message: 'Invalid email' }],
        },
      },
    });

    await expect(request({ method: 'POST', url: '/clients' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid data',
      details: [{ field: 'email', message: 'Invalid email' }],
    });
  });

  it('normalizes an Axios error envelope', async () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
            details: [],
          },
        },
      },
    };
    mocks.apiClient.mockRejectedValue(error);

    await expect(request({ method: 'GET', url: '/clients' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Access denied',
    });
  });

  it('propagates a network error without changing it into an ApiError', async () => {
    const error = { isAxiosError: true, message: 'Network unavailable' };
    mocks.apiClient.mockRejectedValue(error);

    await expect(request({ method: 'GET', url: '/clients' })).rejects.toBe(error);
  });

  it('preserves data and metadata from a paginated response', async () => {
    mocks.apiClient.mockResolvedValue({
      data: {
        success: true,
        data: [{ id: 'client-1' }],
        meta: { page: 1, total: 1 },
      },
    });

    await expect(
      requestPaginated<{ id: string }, { page: number; total: number }>({
        method: 'GET',
        url: '/clients',
      }),
    ).resolves.toEqual({ data: [{ id: 'client-1' }], meta: { page: 1, total: 1 } });
  });

  it.each([
    '/auth/login',
    '/auth/refresh',
    '/auth/register',
  ])('does not refresh a 401 from the public route %s', async (url) => {
    const error = makeUnauthorizedError(makeRequestConfig(url));

    await expect(responseInterceptor(error)).rejects.toBe(error);
    expect(mocks.axiosPost).not.toHaveBeenCalled();
  });

  it('adds the bearer token to an authenticated request', async () => {
    localStorage.setItem('bopacorp_access_token', 'access-token');
    const config = makeRequestConfig('/clients');

    expect(await requestInterceptor(config)).toMatchObject({
      headers: { Authorization: 'Bearer access-token' },
    });
  });

  it('refreshes a protected request and retries it with the new token', async () => {
    localStorage.setItem('bopacorp_refresh_token', 'old-refresh-token');
    const config = makeRequestConfig('/clients');
    const refreshedTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
    };
    mocks.axiosPost.mockResolvedValue({ data: { data: refreshedTokens } });
    mocks.apiClient.mockResolvedValue({ data: { success: true, data: { id: 'client-1' } } });

    await expect(responseInterceptor(makeUnauthorizedError(config))).resolves.toEqual({
      data: { success: true, data: { id: 'client-1' } },
    });

    expect(mocks.axiosPost).toHaveBeenCalledWith('http://test.local/api/v1/auth/refresh', {
      refreshToken: 'old-refresh-token',
    });
    expect(localStorage.getItem('bopacorp_access_token')).toBe(refreshedTokens.accessToken);
    expect(localStorage.getItem('bopacorp_refresh_token')).toBe(refreshedTokens.refreshToken);
    expect(config.headers.Authorization).toBe('Bearer new-access-token');
  });

  it('clears the session and redirects when refresh fails', async () => {
    const fakeWindow = stubWindow();
    localStorage.setItem('bopacorp_access_token', 'old-access-token');
    localStorage.setItem('bopacorp_refresh_token', 'refresh-token');
    const config = makeRequestConfig('/clients');
    const refreshError = { isAxiosError: true, message: 'Refresh failed' };
    mocks.axiosPost.mockRejectedValue(refreshError);

    await expect(responseInterceptor(makeUnauthorizedError(config))).rejects.toBe(refreshError);

    expect(localStorage.getItem('bopacorp_access_token')).toBeNull();
    expect(localStorage.getItem('bopacorp_refresh_token')).toBeNull();
    expect(fakeWindow.location.href).toBe('/login');
  });

  it('rejects and redirects when a protected request has no refresh token', async () => {
    const fakeWindow = stubWindow();
    const config = makeRequestConfig('/clients');
    const error = makeUnauthorizedError(config);

    await expect(responseInterceptor(error)).rejects.toThrow('No refresh token');

    expect(fakeWindow.location.href).toBe('/login');
    expect(mocks.axiosPost).not.toHaveBeenCalled();
  });

  it('queues concurrent protected requests behind one refresh operation', async () => {
    localStorage.setItem('bopacorp_refresh_token', 'old-refresh-token');
    const firstConfig = makeRequestConfig('/clients/1');
    const secondConfig = makeRequestConfig('/clients/2');
    const refreshedTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
    };
    let resolveRefresh!: (value: unknown) => void;
    mocks.axiosPost.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );
    mocks.apiClient.mockResolvedValue({ data: { success: true, data: { ok: true } } });

    const firstRequest = responseInterceptor(makeUnauthorizedError(firstConfig));
    await Promise.resolve();
    const secondRequest = responseInterceptor(makeUnauthorizedError(secondConfig));

    resolveRefresh({ data: { data: refreshedTokens } });
    await expect(Promise.all([firstRequest, secondRequest])).resolves.toHaveLength(2);

    expect(mocks.axiosPost).toHaveBeenCalledTimes(1);
    expect(mocks.apiClient).toHaveBeenCalledTimes(2);
    expect(firstConfig.headers.Authorization).toBe('Bearer new-access-token');
    expect(secondConfig.headers.Authorization).toBe('Bearer new-access-token');
  });

  it('proactively refreshes a token that is close to expiration', async () => {
    const fakeWindow = stubWindow();
    localStorage.setItem('bopacorp_access_token', 'old-access-token');
    localStorage.setItem('bopacorp_refresh_token', 'old-refresh-token');
    localStorage.setItem('bopacorp_token_expires_at', String(Date.now() + 1_000));
    const refreshedTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
    };
    mocks.axiosPost.mockResolvedValue({ data: { data: refreshedTokens } });

    const config = makeRequestConfig('/clients');
    await requestInterceptor(config);

    expect(mocks.axiosPost).toHaveBeenCalledWith('http://test.local/api/v1/auth/refresh', {
      refreshToken: 'old-refresh-token',
    });
    expect(config.headers.Authorization).toBe('Bearer new-access-token');
    expect(fakeWindow.dispatchEvent).toHaveBeenCalledWith(expect.any(Event));
  });
});
