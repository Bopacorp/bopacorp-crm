import { ApiError } from '@/services/api.js';

const GENERIC_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Sesión expirada. Inicia sesión nuevamente.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  RESOURCE_NOT_FOUND: 'El recurso solicitado no existe.',
  CONFLICT: 'Ya existe un registro con esos datos.',
  VALIDATION_ERROR: 'Algunos campos tienen errores. Revísalos e intenta de nuevo.',
  BAD_REQUEST: 'Solicitud inválida. Verifica los datos enviados.',
  INTERNAL_ERROR: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
  ROUTE_NOT_FOUND: 'La ruta solicitada no existe.',
};

const FALLBACK = 'Ocurrió un error inesperado. Intenta de nuevo más tarde.';

export function getErrorMessage(error: unknown, overrides?: Record<string, string>): string {
  if (error instanceof ApiError) {
    return overrides?.[error.code] ?? GENERIC_MESSAGES[error.code] ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return FALLBACK;
}

export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof ApiError) return error.code;
  return undefined;
}
