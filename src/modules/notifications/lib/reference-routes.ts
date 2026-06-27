const REFERENCE_ROUTES: Record<string, (id: string) => string> = {
  negotiation: (id) => `/negociaciones/${id}`,
  document: () => '/documentacion',
  matrix: (id) => `/negociaciones/${id}`,
};

export function getNotificationRoute(
  referenceType: string | null,
  referenceId: string | null,
): string | null {
  if (!referenceType || !referenceId) return null;
  return REFERENCE_ROUTES[referenceType]?.(referenceId) ?? null;
}
