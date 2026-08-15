import type {
  AdvisorMetricResponse,
  AdvisorPerformanceResponse,
  ReportExportListItemResponse,
  SalesTargetResponse,
} from '@bopacorp/shared/reports';
import { advisorA, advisorB, CRM_TEST_IDS, pageMeta } from './crm-fixtures.js';

const createdAt = '2026-02-01T00:00:00.000Z';
const updatedAt = '2026-02-02T00:00:00.000Z';

const reportUser = (advisor: typeof advisorA) => ({
  id: advisor.userId,
  username: advisor.user.username,
  email: advisor.user.email,
  profile: {
    firstName: advisor.user.firstName ?? advisor.user.username,
    lastName: advisor.user.lastName ?? '',
  },
});

export const reportMetricA: AdvisorMetricResponse = {
  advisor: {
    id: advisorA.userId,
    username: advisorA.user.username,
    profile: {
      firstName: 'Alex',
      lastName: 'Advisor',
    },
  },
  stateCounts: [
    {
      stateId: CRM_TEST_IDS.prospectState,
      stateCode: 'prospect',
      stateName: 'New, lead',
      count: 3,
    },
    {
      stateId: CRM_TEST_IDS.closingState,
      stateCode: 'closing',
      stateName: 'Closing',
      count: 2,
    },
  ],
  clientsVisited: 4,
  totalBilledAmount: 1200,
  averageBillingPerService: 300,
  avgDaysToClose: 8,
};

export const reportMetricB: AdvisorMetricResponse = {
  advisor: {
    id: advisorB.userId,
    username: advisorB.user.username,
    profile: {
      firstName: 'Blair',
      lastName: 'Advisor',
    },
  },
  stateCounts: [
    {
      stateId: CRM_TEST_IDS.closingState,
      stateCode: 'closing',
      stateName: 'Closing',
      count: 5,
    },
    {
      stateId: CRM_TEST_IDS.deniedState,
      stateCode: 'denied',
      stateName: 'Lost "deal"',
      count: 1,
    },
  ],
  clientsVisited: 2,
  totalBilledAmount: 800,
  averageBillingPerService: 400,
  avgDaysToClose: null,
};

export const reportPerformanceA: AdvisorPerformanceResponse = {
  advisor: reportUser(advisorA),
  tiers: [
    { tierCode: 'ONE_SHOT', tierLabel: 'One Shot', closedCount: 2, minCloses: 2, met: true },
    { tierCode: 'MEDIANO', tierLabel: 'Mediano', closedCount: 1, minCloses: 2, met: false },
  ],
  totalClosed: 3,
  totalRequired: 4,
  overallMet: false,
};

export const reportPerformanceB: AdvisorPerformanceResponse = {
  advisor: reportUser(advisorB),
  tiers: [
    { tierCode: 'ONE_SHOT', tierLabel: 'One Shot', closedCount: 3, minCloses: 2, met: true },
    { tierCode: 'SMALL', tierLabel: 'Small', closedCount: 2, minCloses: 2, met: true },
  ],
  totalClosed: 5,
  totalRequired: 4,
  overallMet: true,
};

export const reportTarget: SalesTargetResponse = {
  id: '00000000-0000-4000-8000-000000000901',
  tierCode: 'ONE_SHOT',
  tierLabel: 'One Shot',
  minBilling: 1000,
  maxBilling: null,
  minCloses: 2,
  isActive: true,
  createdAt,
  updatedAt,
};

export const reportExport: ReportExportListItemResponse = {
  id: '00000000-0000-4000-8000-000000000902',
  reportType: 'COMMERCIAL_PERFORMANCE',
  title: 'Commercial performance',
  filename: 'metrics.csv',
  fileExtension: 'csv',
  fileSizeMb: 0.01,
  generatedAt: createdAt,
  createdBy: {
    id: advisorA.userId,
    username: advisorA.user.username,
  },
  createdAt,
  updatedAt,
};

export const reportPageResult = {
  data: [reportExport],
  meta: pageMeta,
};
