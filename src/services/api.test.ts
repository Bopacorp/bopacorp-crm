import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { request } from './api.js';

describe('request', () => {
  beforeEach(() => {
    mocks.apiClient.mockReset();
    mocks.axiosPost.mockReset();
  });

  it('desenvuelve la carga útil de una respuesta exitosa', async () => {
    mocks.apiClient.mockResolvedValue({ data: { success: true, data: { id: 'cliente-1' } } });

    await expect(
      request<{ id: string }>({ method: 'GET', url: '/clientes/cliente-1' }),
    ).resolves.toEqual({
      id: 'cliente-1',
    });
  });

  it('normaliza el sobre de error de la API', async () => {
    mocks.apiClient.mockResolvedValue({
      data: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          details: [{ field: 'email', message: 'Correo inválido' }],
        },
      },
    });

    await expect(request({ method: 'POST', url: '/clientes' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Datos inválidos',
      details: [{ field: 'email', message: 'Correo inválido' }],
    });
  });

  it.each([
    '/auth/login',
    '/auth/refresh',
    '/auth/register',
  ])('no intenta refrescar un 401 de la ruta pública %s', async (url) => {
    const rejected = mocks.apiClient.interceptors.response.use.mock.calls[0]?.[1] as (
      error: unknown,
    ) => Promise<never>;
    const error = {
      config: { url, headers: {} },
      response: { status: 401 },
    };

    await expect(rejected(error)).rejects.toBe(error);
    expect(mocks.axiosPost).not.toHaveBeenCalled();
  });
});
