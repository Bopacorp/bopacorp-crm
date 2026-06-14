import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import axios from 'axios';
import {
  clearAll,
  getAccessToken,
  getRefreshToken,
  getTokenExpiresAt,
  saveTokens,
} from './auth-storage.js';

const baseURL = import.meta.env.VITE_API_URL as string;

if (!baseURL) {
  throw new Error('VITE_API_URL is required');
}

if (!baseURL.includes('/api/')) {
  throw new Error('VITE_API_URL must include the API path (e.g. http://localhost:3000/api/v1)');
}

const api = axios.create({ baseURL });

api.interceptors.request.use(injectAuthHeader);

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  (error) => handleResponseError(error as AxiosError),
);

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  let response: AxiosResponse;
  try {
    response = await api(config);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new ApiError(code, message);
    }
    throw error;
  }
  if (!response.data.success) {
    throw new ApiError(response.data.error.code, response.data.error.message);
  }
  return response.data.data as T;
}

export interface PaginatedResponse<T, M = unknown> {
  data: T[];
  meta: M;
}

export async function requestPaginated<T, M = unknown>(
  config: AxiosRequestConfig,
): Promise<PaginatedResponse<T, M>> {
  let response: AxiosResponse;
  try {
    response = await api(config);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new ApiError(code, message);
    }
    throw error;
  }
  if (!response.data.success) {
    throw new ApiError(response.data.error.code, response.data.error.message);
  }
  return { data: response.data.data as T[], meta: response.data.meta as M };
}

export default api;

function injectAuthHeader(config: InternalAxiosRequestConfig) {
  const token = getAccessToken();
  const expiresAt = getTokenExpiresAt();

  if (token && expiresAt && expiresAt - Date.now() < 120000 && !isRefreshing) {
    return triggerProactiveRefresh().then(() => {
      const newToken = getAccessToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
      }
      return config;
    });
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function handleResponseError(error: AxiosError) {
  const originalRequest = error.config as RetryConfig;
  if (!shouldRefresh(error, originalRequest)) {
    return Promise.reject(error);
  }
  return isRefreshing ? queueForRefresh(originalRequest) : refreshWithRetry(originalRequest);
}

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/register'];

function shouldRefresh(error: AxiosError, request: RetryConfig) {
  const url = request.url ?? '';
  if (PUBLIC_AUTH_PATHS.some((path) => url.includes(path))) return false;
  return error.response?.status === 401 && !request._retry;
}

function queueForRefresh(request: RetryConfig) {
  return new Promise((resolve) => {
    refreshSubscribers.push((token) => {
      request.headers.Authorization = `Bearer ${token}`;
      resolve(api(request));
    });
  });
}

async function refreshWithRetry(request: RetryConfig) {
  request._retry = true;
  isRefreshing = true;

  try {
    const token = getRefreshToken();
    if (!token) throw new Error('No refresh token');

    const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken: token });
    const { accessToken, refreshToken: newRefreshToken, expiresIn } = res.data.data;

    saveTokens({ accessToken, refreshToken: newRefreshToken, expiresIn });
    notifySubscribers(accessToken);
    dispatchTokenRefreshed();

    return api(request);
  } catch (err) {
    return handleRefreshError(err as AxiosError);
  } finally {
    isRefreshing = false;
  }
}

async function triggerProactiveRefresh() {
  isRefreshing = true;

  try {
    const token = getRefreshToken();
    if (!token) throw new Error('No refresh token');

    const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken: token });
    const { accessToken, refreshToken: newRefreshToken, expiresIn } = res.data.data;

    saveTokens({ accessToken, refreshToken: newRefreshToken, expiresIn });
    dispatchTokenRefreshed();
  } catch {
    clearAll();
    redirectToLogin();
  } finally {
    isRefreshing = false;
  }
}

function notifySubscribers(token: string) {
  for (const cb of refreshSubscribers) {
    cb(token);
  }
  refreshSubscribers = [];
}

function dispatchTokenRefreshed() {
  window.dispatchEvent(new Event('bopacorp:token-refreshed'));
}

function handleRefreshError(error: AxiosError) {
  clearAll();
  redirectToLogin();
  return Promise.reject(error);
}

function redirectToLogin() {
  window.location.href = '/login';
}
