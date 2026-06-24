import type { ApplicationState } from '@bopacorp/shared/employability';

export function applicationStateLabel(state: ApplicationState): string {
  switch (state) {
    case 'DRAFT':
      return 'Borrador';
    case 'PENDING':
      return 'Pendiente';
    case 'ACCEPTED':
      return 'Revisado';
    case 'REJECTED':
      return 'Rechazado';
    default:
      return state;
  }
}

export function applicationStateVariant(
  state: ApplicationState,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (state) {
    case 'DRAFT':
      return 'secondary';
    case 'PENDING':
      return 'secondary';
    case 'ACCEPTED':
      return 'default';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'secondary';
  }
}
