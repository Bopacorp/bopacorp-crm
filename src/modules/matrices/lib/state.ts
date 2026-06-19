import type { MatrixState } from '@bopacorp/shared/matrices';

const MATRIX_STATE_LABELS: Record<MatrixState, string> = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

export function matrixStateLabel(state: MatrixState): string {
  return MATRIX_STATE_LABELS[state] ?? state;
}

const VALID_TRANSITIONS: Record<MatrixState, MatrixState[]> = {
  DRAFT: ['PENDING_APPROVAL'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED'],
  REJECTED: ['DRAFT'],
  APPROVED: [],
};

export function getValidTransitions(currentState: MatrixState): MatrixState[] {
  return VALID_TRANSITIONS[currentState] ?? [];
}
