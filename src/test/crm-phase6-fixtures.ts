import type {
  CatalogItemResponse,
  CategoryTreeResponse,
  ContactRequestResponse,
} from '@bopacorp/shared/catalog';
import type {
  DepartmentResponse,
  EmployeeListItemResponse,
  EmployeeResponse,
  OrgRoleListItemResponse,
} from '@bopacorp/shared/core';
import type {
  JobApplicationListItemResponse,
  JobApplicationResponse,
  JobVacancyListItemResponse,
  JobVacancyResponse,
} from '@bopacorp/shared/employability';
import { CRM_TEST_IDS } from './crm-fixtures.js';

const createdAt = '2026-03-01T00:00:00.000Z';
const updatedAt = '2026-03-02T00:00:00.000Z';

export const PHASE6_TEST_IDS = {
  category: '00000000-0000-4000-8000-000000001001',
  itemType: '00000000-0000-4000-8000-000000001002',
  contractType: '00000000-0000-4000-8000-000000001003',
  segment: '00000000-0000-4000-8000-000000001004',
  tier: '00000000-0000-4000-8000-000000001005',
  geoZone: '00000000-0000-4000-8000-000000001006',
  benefitType: '00000000-0000-4000-8000-000000001007',
  item: '00000000-0000-4000-8000-000000001008',
  benefit: '00000000-0000-4000-8000-000000001009',
  voiceDetail: '00000000-0000-4000-8000-000000001010',
  ageCondition: '00000000-0000-4000-8000-000000001011',
  legalCondition: '00000000-0000-4000-8000-000000001012',
  temporalCondition: '00000000-0000-4000-8000-000000001013',
  contentType: '00000000-0000-4000-8000-000000001014',
  contentBlock: '00000000-0000-4000-8000-000000001015',
  contactRequest: '00000000-0000-4000-8000-000000001016',
  department: '00000000-0000-4000-8000-000000001017',
  orgRole: '00000000-0000-4000-8000-000000001018',
  vacancy: '00000000-0000-4000-8000-000000001019',
  application: '00000000-0000-4000-8000-000000001020',
  resume: '00000000-0000-4000-8000-000000001021',
} as const;

const catalogRef = (id: string, code: string, name: string) => ({ id, code, name });

export const catalogItem: CatalogItemResponse = {
  id: PHASE6_TEST_IDS.item,
  name: 'Business Voice Plan',
  description: 'A representative catalog item for automated tests.',
  price: 29.99,
  activationCode: 'VOICE-TEST',
  imagePath: 'catalog/business-voice.png',
  isActive: true,
  isPublished: false,
  permanenceMonths: 12,
  category: { id: PHASE6_TEST_IDS.category, name: 'Business', slug: 'business' },
  itemType: catalogRef(PHASE6_TEST_IDS.itemType, 'voice', 'Voice'),
  contractType: catalogRef(PHASE6_TEST_IDS.contractType, 'postpaid', 'Postpaid'),
  segment: catalogRef(PHASE6_TEST_IDS.segment, 'business', 'Business'),
  tier: catalogRef(PHASE6_TEST_IDS.tier, 'standard', 'Standard'),
  voiceDetails: {
    id: PHASE6_TEST_IDS.voiceDetail,
    gigasStructural: 10,
    gigasLoyalty: 5,
    minutesNational: null,
    minutesLdi: 20,
    sms: 100,
    hasUnlimitedMinutes: true,
    hasUnlimitedWhatsapp: true,
    hasSocialNetworks: false,
    includedRoamingGb: 1.5,
  },
  connectivityDetails: null,
  digitalDetails: null,
  roamingDetails: null,
  deviceDetails: null,
  benefits: [
    {
      id: PHASE6_TEST_IDS.benefit,
      benefitTypeId: PHASE6_TEST_IDS.benefitType,
      name: 'Priority support',
      description: null,
      durationDays: 30,
      createdAt,
      updatedAt,
    },
  ],
  ageConditions: { id: PHASE6_TEST_IDS.ageCondition, minAge: 18, maxAge: null },
  legalConditions: {
    id: PHASE6_TEST_IDS.legalCondition,
    legalRequirement: 'Business identification required',
    description: null,
  },
  temporalConditions: {
    id: PHASE6_TEST_IDS.temporalCondition,
    effectiveDate: '2026-03-01T00:00:00.000Z',
    expirationDate: null,
  },
  createdAt,
  updatedAt,
};

export const categoryTree: CategoryTreeResponse = {
  id: PHASE6_TEST_IDS.category,
  parentId: null,
  name: 'Business',
  slug: 'business',
  description: 'Business products',
  sortOrder: 1,
  isActive: true,
  createdAt,
  updatedAt,
  children: [],
};

export const contactRequest: ContactRequestResponse = {
  id: PHASE6_TEST_IDS.contactRequest,
  itemId: PHASE6_TEST_IDS.item,
  clientName: 'Taylor Customer',
  clientEmail: 'taylor.customer@example.test',
  clientPhone: '0991234567',
  message: 'Please contact me.',
  isAttended: false,
  attendedAt: null,
  attendedBy: null,
  createdAt,
};

export const department: DepartmentResponse = {
  id: PHASE6_TEST_IDS.department,
  code: 'SALES',
  name: 'Sales',
  isActive: true,
  createdAt,
  updatedAt,
};

export const orgRole: OrgRoleListItemResponse = {
  id: PHASE6_TEST_IDS.orgRole,
  code: 'advisor',
  name: 'Advisor',
  department: { id: department.id, name: department.name },
  isActive: true,
  createdAt,
  updatedAt,
};

export const employeeListItem: EmployeeListItemResponse = {
  userId: CRM_TEST_IDS.advisorA,
  user: {
    id: CRM_TEST_IDS.advisorA,
    username: 'advisor.a',
    email: 'advisor.a@example.test',
    firstName: 'Alex',
    lastName: 'Advisor',
  },
  orgRole: { id: orgRole.id, name: orgRole.name },
  territory: 'North',
  hiredAt: '2026-01-01',
  isActive: true,
  isLocked: true,
  createdAt,
  updatedAt,
};

export const employee: EmployeeResponse = {
  userId: employeeListItem.userId,
  user: {
    id: employeeListItem.user.id,
    username: employeeListItem.user.username,
    email: employeeListItem.user.email,
    profile: {
      firstName: 'Alex',
      lastName: 'Advisor',
      avatarUrl: null,
    },
  },
  orgRole: {
    id: orgRole.id,
    code: orgRole.code,
    name: orgRole.name,
    department: {
      id: department.id,
      code: department.code,
      name: department.name,
    },
  },
  territory: employeeListItem.territory,
  hiredAt: employeeListItem.hiredAt,
  isActive: true,
  deletedAt: null,
  supervisors: [],
  advisors: [],
  createdAt,
  updatedAt,
};

export const vacancy: JobVacancyResponse = {
  id: PHASE6_TEST_IDS.vacancy,
  title: 'Sales Advisor',
  description: 'Help business customers choose the right service.',
  requirements: 'Experience in customer service.',
  isActive: true,
  isPublished: false,
  publicationDate: null,
  closingDate: '2026-04-01T00:00:00.000Z',
  creator: {
    id: CRM_TEST_IDS.manager,
    username: 'manager.test',
    email: 'manager@example.test',
  },
  createdAt,
  updatedAt,
};

export const vacancyListItem: JobVacancyListItemResponse = {
  id: vacancy.id,
  title: vacancy.title,
  isActive: vacancy.isActive,
  isPublished: vacancy.isPublished,
  publicationDate: vacancy.publicationDate,
  closingDate: vacancy.closingDate,
  creator: { id: vacancy.creator.id, username: vacancy.creator.username },
  createdAt,
  updatedAt,
};

export const applicationListItem: JobApplicationListItemResponse = {
  id: PHASE6_TEST_IDS.application,
  state: 'PENDING',
  appliedAt: '2026-03-05T00:00:00.000Z',
  hasResume: true,
  vacancy: { id: vacancy.id, title: vacancy.title },
  candidate: {
    id: '00000000-0000-4000-8000-000000001022',
    firstName: 'Jordan',
    lastName: 'Candidate',
  },
  createdAt,
  updatedAt,
};

export const application: JobApplicationResponse = {
  id: applicationListItem.id,
  state: 'PENDING',
  coverLetter: 'I would like to join the sales team.',
  reviewNotes: null,
  reviewDate: null,
  appliedAt: applicationListItem.appliedAt,
  vacancy: applicationListItem.vacancy,
  candidate: {
    id: applicationListItem.candidate.id,
    firstName: applicationListItem.candidate.firstName,
    lastName: applicationListItem.candidate.lastName,
    email: 'jordan.candidate@example.test',
  },
  reviewer: null,
  resume: {
    id: PHASE6_TEST_IDS.resume,
    filename: 'jordan-candidate.pdf',
    mimeType: 'application/pdf',
    fileSizeMb: 1.2,
  },
  createdAt,
  updatedAt,
};
