import type { DocumentState } from '@bopacorp/shared/documents';

export function documentStateLabel(state: DocumentState): string {
  const labels: Record<DocumentState, string> = {
    PENDING_APPROVAL: 'Pendiente de aprobación',
    ACCEPTED: 'Aceptado',
    REJECTED: 'Rechazado',
  };
  return labels[state] ?? state;
}
