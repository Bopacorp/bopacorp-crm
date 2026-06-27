import type { DocumentState } from '@bopacorp/shared/documents';
import i18n from '@/i18n/index.js';

export function documentStateLabel(state: DocumentState): string {
  switch (state) {
    case 'PENDING_APPROVAL':
      return i18n.t('documentation.statePendingApproval');
    case 'ACCEPTED':
      return i18n.t('documentation.stateAccepted');
    case 'REJECTED':
      return i18n.t('documentation.stateRejected');
    default:
      return state;
  }
}
