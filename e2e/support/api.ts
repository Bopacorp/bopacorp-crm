import { readFile } from 'node:fs/promises';
import type { APIRequestContext } from '@playwright/test';

interface ApiError {
  code?: string;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: ApiError;
}

export interface AuthenticatedApiOptions {
  ignoreMissing?: boolean;
}

export class AuthenticatedApi {
  private readonly context: APIRequestContext;
  private readonly baseURL: string;
  private readonly accessToken: string;

  constructor(context: APIRequestContext, baseURL: string, accessToken: string) {
    this.context = context;
    this.baseURL = baseURL;
    this.accessToken = accessToken;
  }

  get<T>(path: string, params?: Record<string, string | number | boolean>) {
    return this.send<T>('GET', path, undefined, params);
  }

  post<T>(path: string, data?: unknown) {
    return this.send<T>('POST', path, data);
  }

  patch<T>(path: string, data?: unknown) {
    return this.send<T>('PATCH', path, data);
  }

  put<T>(path: string, data?: unknown) {
    return this.send<T>('PUT', path, data);
  }

  async delete<T>(path: string, options: AuthenticatedApiOptions = {}): Promise<T | undefined> {
    return this.send<T>('DELETE', path, undefined, undefined, options);
  }

  async expectMissing(path: string): Promise<void> {
    const response = await this.context.get(this.buildUrl(path), {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      failOnStatusCode: false,
    });

    if (response.status() !== 404) {
      throw new Error(`Expected API GET ${path} to return 404, received ${response.status()}`);
    }
  }

  async upload<T>(
    path: string,
    filePath: string,
    fieldName: string,
    filename: string,
    mimeType: string,
  ): Promise<T> {
    const response = await this.context.post(this.buildUrl(path), {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      multipart: {
        [fieldName]: {
          name: filename,
          mimeType,
          buffer: await readFile(filePath),
        },
      },
      failOnStatusCode: false,
    });
    const bodyText = await response.text();
    const body = bodyText ? (JSON.parse(bodyText) as ApiEnvelope<T>) : undefined;

    if (!response.ok() || body?.success === false || body?.data === undefined) {
      throw new Error(
        `API POST ${path} upload failed with ${response.status()} ${body?.error?.code ?? 'UNKNOWN_ERROR'}`,
      );
    }

    return body.data;
  }

  private async send<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    data?: unknown,
    params?: Record<string, string | number | boolean>,
    options: AuthenticatedApiOptions = {},
  ): Promise<T> {
    const response = await this.context.fetch(this.buildUrl(path), {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      data,
      params,
      failOnStatusCode: false,
    });

    const bodyText = await response.text();
    const body = bodyText ? (JSON.parse(bodyText) as ApiEnvelope<T>) : undefined;

    if (response.status() === 404 && options.ignoreMissing) {
      return undefined as T;
    }

    if (!response.ok() || body?.success === false || body?.data === undefined) {
      throw new Error(
        `API ${method} ${path} failed with ${response.status()} ${body?.error?.code ?? 'UNKNOWN_ERROR'}`,
      );
    }

    return body.data;
  }

  private buildUrl(path: string): string {
    return `${this.baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }
}
