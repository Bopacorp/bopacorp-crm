import type { ApplicationState } from '@bopacorp/shared/employability';
import i18n from '@/i18n/index.js';

export function applicationStateLabel(state: ApplicationState): string {
  switch (state) {
    case 'DRAFT':
      return i18n.t('employability.stateDraft');
    case 'PENDING':
      return i18n.t('employability.statePending');
    case 'ACCEPTED':
      return i18n.t('employability.stateReviewed');
    case 'REJECTED':
      return i18n.t('employability.stateRejected');
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
