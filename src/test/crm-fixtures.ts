import type { PaginationMeta } from '@bopacorp/shared/common';
import type { EmployeeListItemResponse } from '@bopacorp/shared/core';
import type {
  BusinessClientListItemResponse,
  BusinessClientResponse,
  CreateBusinessClientRequest,
  CreateNegotiationRequest,
  CreateVisitRequest,
  NegotiationListItemResponse,
  NegotiationResponse,
  NegotiationStateResponse,
  VisitListItemResponse,
  VisitTypeResponse,
} from '@bopacorp/shared/crm';

export const CRM_TEST_IDS = {
  advisorA: '00000000-0000-4000-8000-000000000101',
  advisorB: '00000000-0000-4000-8000-000000000102',
  supervisor: '00000000-0000-4000-8000-000000000103',
  manager: '00000000-0000-4000-8000-000000000104',
  clientA: '00000000-0000-4000-8000-000000000201',
  clientB: '00000000-0000-4000-8000-000000000202',
  negotiationA: '00000000-0000-4000-8000-000000000301',
  negotiationB: '00000000-0000-4000-8000-000000000302',
  prospectState: '00000000-0000-4000-8000-000000000401',
  closingState: '00000000-0000-4000-8000-000000000402',
  deniedState: '00000000-0000-4000-8000-000000000403',
  visitA: '00000000-0000-4000-8000-000000000501',
  visitB: '00000000-0000-4000-8000-000000000502',
  visitType: '00000000-0000-4000-8000-000000000601',
  mandatoryDocumentType: '00000000-0000-4000-8000-000000000701',
} as const;

const createdAt = '2026-01-01T00:00:00.000Z';
const updatedAt = '2026-01-02T00:00:00.000Z';

export const advisorA: EmployeeListItemResponse = {
  userId: CRM_TEST_IDS.advisorA,
  user: {
    id: CRM_TEST_IDS.advisorA,
    username: 'advisor.a',
    email: 'advisor.a@bopacorp.test',
    firstName: 'Alex',
    lastName: 'Advisor',
  },
  orgRole: { id: '00000000-0000-4000-8000-000000000801', name: 'Advisor' },
  territory: 'North',
  hiredAt: '2025-01-01',
  isActive: true,
  createdAt,
  updatedAt,
};

export const advisorB: EmployeeListItemResponse = {
  ...advisorA,
  userId: CRM_TEST_IDS.advisorB,
  user: {
    ...advisorA.user,
    id: CRM_TEST_IDS.advisorB,
    username: 'advisor.b',
    email: 'advisor.b@bopacorp.test',
    firstName: 'Blair',
  },
  territory: 'South',
};

const advisorRef = (advisor: EmployeeListItemResponse) => ({
  id: advisor.userId,
  username: advisor.user.username,
  email: advisor.user.email,
  profile: {
    firstName: advisor.user.firstName ?? advisor.user.username,
    lastName: advisor.user.lastName ?? '',
  },
});

export const clientA: BusinessClientResponse = {
  id: CRM_TEST_IDS.clientA,
  ruc: '0991234567001',
  businessName: 'Acme North',
  contactName: 'Casey Contact',
  contactPhone: '0991234567',
  contactEmail: 'casey@acme.test',
  address: 'North Avenue',
  activeServicesCount: 3,
  currentMonthlyBilling: 1250,
  isActive: true,
  advisor: advisorRef(advisorA),
  createdAt,
  updatedAt,
};

export const clientB: BusinessClientResponse = {
  ...clientA,
  id: CRM_TEST_IDS.clientB,
  ruc: '0997654321001',
  businessName: 'Beta South',
  contactName: 'Taylor Contact',
  advisor: advisorRef(advisorB),
};

export const clientListItemA: BusinessClientListItemResponse = {
  id: clientA.id,
  ruc: clientA.ruc,
  businessName: clientA.businessName,
  contactName: clientA.contactName,
  isActive: clientA.isActive,
  advisor: {
    id: advisorA.userId,
    username: advisorA.user.username,
    profile: {
      firstName: advisorA.user.firstName ?? advisorA.user.username,
      lastName: advisorA.user.lastName ?? '',
    },
  },
  createdAt,
  updatedAt,
};

export const createClientRequest: CreateBusinessClientRequest = {
  advisorId: CRM_TEST_IDS.advisorA,
  ruc: '0991234567001',
  businessName: 'Acme North',
  contactName: 'Casey Contact',
  contactPhone: '0991234567',
  contactEmail: 'casey@acme.test',
  address: 'North Avenue',
  activeServicesCount: 3,
  currentMonthlyBilling: 1250,
  isActive: true,
};

export const prospectState: NegotiationStateResponse = {
  id: CRM_TEST_IDS.prospectState,
  code: 'prospect',
  name: 'Prospect',
  description: null,
  position: 1,
  isActive: true,
  createdAt,
  updatedAt,
};

export const closingState: NegotiationStateResponse = {
  ...prospectState,
  id: CRM_TEST_IDS.closingState,
  code: 'closing',
  name: 'Closing',
  position: 2,
};

export const deniedState: NegotiationStateResponse = {
  ...prospectState,
  id: CRM_TEST_IDS.deniedState,
  code: 'denied',
  name: 'Denied',
  position: 3,
};

const clientRef = (client: BusinessClientResponse) => ({
  id: client.id,
  businessName: client.businessName,
  contactName: client.contactName,
});

const stateRef = (state: NegotiationStateResponse) => ({
  id: state.id,
  code: state.code,
  name: state.name,
});

export const createNegotiationRequest: CreateNegotiationRequest = {
  clientId: CRM_TEST_IDS.clientA,
  advisorId: CRM_TEST_IDS.advisorA,
  stateId: CRM_TEST_IDS.prospectState,
  startDate: '2026-01-03',
  estimatedCloseDate: '2026-01-31',
  observations: 'Initial discovery completed.',
  isActive: true,
};

export const negotiationA: NegotiationResponse = {
  id: CRM_TEST_IDS.negotiationA,
  startDate: '2026-01-03',
  estimatedCloseDate: '2026-01-31',
  observations: 'Initial discovery completed.',
  isActive: true,
  client: clientRef(clientA),
  advisor: advisorRef(advisorA),
  state: stateRef(prospectState),
  createdAt,
  updatedAt,
};

export const negotiationB: NegotiationResponse = {
  ...negotiationA,
  id: CRM_TEST_IDS.negotiationB,
  client: clientRef(clientB),
  advisor: advisorRef(advisorB),
  state: stateRef(closingState),
};

export const negotiationListItemA: NegotiationListItemResponse = {
  id: negotiationA.id,
  startDate: negotiationA.startDate,
  estimatedCloseDate: negotiationA.estimatedCloseDate,
  isActive: negotiationA.isActive,
  client: { id: clientA.id, businessName: clientA.businessName },
  advisor: {
    id: advisorA.userId,
    username: advisorA.user.username,
    profile: {
      firstName: advisorA.user.firstName ?? advisorA.user.username,
      lastName: advisorA.user.lastName ?? '',
    },
  },
  state: stateRef(prospectState),
  createdAt,
  updatedAt,
};

export const visitType: VisitTypeResponse = {
  id: CRM_TEST_IDS.visitType,
  code: 'onsite',
  name: 'On-site visit',
  description: null,
  isActive: true,
  createdAt,
  updatedAt,
};

export const createVisitRequest: CreateVisitRequest = {
  negotiationId: CRM_TEST_IDS.negotiationA,
  clientId: CRM_TEST_IDS.clientA,
  advisorId: CRM_TEST_IDS.advisorA,
  visitTypeId: CRM_TEST_IDS.visitType,
  visitDate: '2026-01-04T15:00:00.000Z',
  observations: 'Customer requested a pricing follow-up.',
  gpsLatitude: -2.1894,
  gpsLongitude: -79.8891,
  gpsAccuracy: 8,
  gpsTimestamp: '2026-01-04T15:00:05.000Z',
};

export const visitListItemA: VisitListItemResponse = {
  id: CRM_TEST_IDS.visitA,
  visitDate: createVisitRequest.visitDate,
  isVerified: false,
  client: { id: clientA.id, businessName: clientA.businessName },
  advisor: {
    id: advisorA.userId,
    username: advisorA.user.username,
    profile: {
      firstName: advisorA.user.firstName ?? advisorA.user.username,
      lastName: advisorA.user.lastName ?? '',
    },
  },
  visitType: { id: visitType.id, code: visitType.code, name: visitType.name },
  createdAt,
  updatedAt,
};

export const pageMeta: PaginationMeta = {
  page: 1,
  limit: 10,
  totalItems: 1,
  totalPages: 1,
};
