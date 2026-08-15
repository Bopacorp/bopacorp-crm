import type { PaginationMeta } from '@bopacorp/shared/common';
import type { UploadDocumentResponse } from '@bopacorp/shared/document-uploads';
import type {
  DocumentStateHistoryResponse,
  DocumentTypeResponse,
  NegotiationDocumentListItemResponse,
} from '@bopacorp/shared/documents';
import type {
  MatrixAttachmentResponse,
  OfferMatrixListItemResponse,
  OfferMatrixResponse,
} from '@bopacorp/shared/matrices';
import { advisorA, CRM_TEST_IDS, clientA, negotiationA, pageMeta } from './crm-fixtures.js';

const createdAt = '2026-01-01T00:00:00.000Z';
const updatedAt = '2026-01-02T00:00:00.000Z';

export const PHASE4_TEST_IDS = {
  optionalDocumentType: '00000000-0000-4000-8000-000000000711',
  pendingDocument: '00000000-0000-4000-8000-000000000721',
  rejectedDocument: '00000000-0000-4000-8000-000000000722',
  matrix: '00000000-0000-4000-8000-000000000731',
  offerAttachment: '00000000-0000-4000-8000-000000000741',
  emailAttachment: '00000000-0000-4000-8000-000000000742',
  documentHistory: '00000000-0000-4000-8000-000000000751',
} as const;

const userRef = {
  id: advisorA.userId,
  username: advisorA.user.username,
};

const documentNegotiationRef = {
  id: negotiationA.id,
  client: { id: clientA.id, businessName: clientA.businessName },
};

export const mandatoryDocumentType: DocumentTypeResponse = {
  id: CRM_TEST_IDS.mandatoryDocumentType,
  code: 'SIGNED_CONTRACT',
  name: 'Signed contract',
  description: 'Contract signed by the client.',
  isMandatory: true,
  isActive: true,
  createdAt,
  updatedAt,
};

export const optionalDocumentType: DocumentTypeResponse = {
  ...mandatoryDocumentType,
  id: PHASE4_TEST_IDS.optionalDocumentType,
  code: 'PROPOSAL',
  name: 'Commercial proposal',
  description: null,
  isMandatory: false,
};

const documentTypeRef = (type: DocumentTypeResponse) => ({
  id: type.id,
  name: type.name,
});

export const pendingDocument: NegotiationDocumentListItemResponse = {
  id: PHASE4_TEST_IDS.pendingDocument,
  state: 'PENDING_APPROVAL',
  filename: 'proposal.pdf',
  fileExtension: 'pdf',
  fileSizeMb: 1.25,
  uploadedAt: createdAt,
  negotiation: documentNegotiationRef,
  documentType: documentTypeRef(optionalDocumentType),
  uploadedBy: userRef,
  createdAt,
  updatedAt,
};

export const rejectedDocument: NegotiationDocumentListItemResponse = {
  ...pendingDocument,
  id: PHASE4_TEST_IDS.rejectedDocument,
  state: 'REJECTED',
  filename: 'rejected-proposal.pdf',
};

export const documentHistoryEntry: DocumentStateHistoryResponse = {
  id: PHASE4_TEST_IDS.documentHistory,
  previousState: 'PENDING_APPROVAL',
  newState: 'REJECTED',
  changedBy: userRef,
  notes: 'Missing signature.',
  createdAt: updatedAt,
};

export const uploadDocumentResponse: UploadDocumentResponse = {
  storagePath: 'documents/2026/proposal.pdf',
  filename: 'proposal.pdf',
  fileExtension: 'pdf',
  fileSizeMb: 0.01,
  mimeType: 'application/pdf',
  encryptionMetadata: { iv: 'test-iv', authTag: 'test-auth-tag' },
};

const matrixNegotiationRef = {
  id: negotiationA.id,
  client: { id: clientA.id, businessName: clientA.businessName },
};

export const matrix: OfferMatrixResponse = {
  id: PHASE4_TEST_IDS.matrix,
  observations: 'Initial commercial proposal.',
  negotiation: matrixNegotiationRef,
  creator: {
    id: advisorA.userId,
    username: advisorA.user.username,
    email: advisorA.user.email,
    profile: {
      firstName: advisorA.user.firstName ?? advisorA.user.username,
      lastName: advisorA.user.lastName ?? '',
    },
  },
  createdAt,
  updatedAt,
};

export const matrixListItem: OfferMatrixListItemResponse = {
  id: matrix.id,
  negotiation: matrixNegotiationRef,
  creator: userRef,
  createdAt,
  updatedAt,
};

export const offerAttachment: MatrixAttachmentResponse = {
  id: PHASE4_TEST_IDS.offerAttachment,
  attachmentType: 'OFFER_MATRIX',
  description: null,
  filename: 'offer-matrix',
  fileExtension: 'xlsx',
  fileSizeMb: 2.5,
  storagePath: 'matrices/offer-matrix.xlsx',
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  uploadedAt: createdAt,
  uploadedBy: userRef,
};

export const emailAttachment: MatrixAttachmentResponse = {
  ...offerAttachment,
  id: PHASE4_TEST_IDS.emailAttachment,
  attachmentType: 'EMAIL_TEMPLATE',
  filename: 'email-template',
  fileExtension: 'eml',
  storagePath: 'matrices/email-template.eml',
  mimeType: 'message/rfc822',
};

export const emptyPageMeta: PaginationMeta = {
  ...pageMeta,
  totalItems: 0,
  totalPages: 0,
};
