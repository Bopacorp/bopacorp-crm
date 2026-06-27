import i18n from '@/i18n/index.js';
import { ApiError } from '@/services/api.js';

const ERROR_KEY_MAP: Record<string, string> = {
  UNAUTHORIZED: 'error.unauthorized',
  FORBIDDEN: 'error.forbidden',
  RESOURCE_NOT_FOUND: 'error.notFound',
  CONFLICT: 'error.conflict',
  VALIDATION_ERROR: 'error.validation',
  BAD_REQUEST: 'error.badRequest',
  INTERNAL_ERROR: 'error.generic',
  ROUTE_NOT_FOUND: 'error.routeNotFound',
};

export function getErrorMessage(error: unknown, overrides?: Record<string, string>): string {
  if (error instanceof ApiError) {
    const overrideKey = overrides?.[error.code];
    if (overrideKey) return i18n.t(overrideKey);
    const genericKey = ERROR_KEY_MAP[error.code];
    if (genericKey) return i18n.t(genericKey);
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return i18n.t('error.generic');
}

export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof ApiError) return error.code;
  return undefined;
}
