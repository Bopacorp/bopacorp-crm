import type {
  AdvisorMetricResponse,
  CreateReportExportRequest,
  CreateSalesObjectiveRequest,
  ListAdvisorMetricsQuery,
  ListRecentActivityQuery,
  ListReportExportsQuery,
  ListSalesObjectivesQuery,
  RecentActivityResponse,
  ReportExportListItemResponse,
  ReportExportResponse,
  SalesObjectiveListItemResponse,
  SalesObjectiveResponse,
  UpdateSalesObjectiveRequest,
} from '@bopacorp/shared/reports';
import { request, requestPaginated } from '@/services/api.js';

export function listAdvisorMetrics(query: ListAdvisorMetricsQuery = {}) {
  return request<AdvisorMetricResponse[]>({
    method: 'GET',
    url: '/reports/advisor-metrics',
    params: query,
  });
}

export function listRecentActivity(query: ListRecentActivityQuery) {
  return requestPaginated<RecentActivityResponse>({
    method: 'GET',
    url: '/reports/recent-activity',
    params: query,
  });
}

export function listObjectives(query: ListSalesObjectivesQuery) {
  return requestPaginated<SalesObjectiveListItemResponse>({
    method: 'GET',
    url: '/reports/objectives',
    params: query,
  });
}

export function createObjective(data: CreateSalesObjectiveRequest) {
  return request<SalesObjectiveResponse>({
    method: 'POST',
    url: '/reports/objectives',
    data,
  });
}

export function updateObjective(id: string, data: UpdateSalesObjectiveRequest) {
  return request<SalesObjectiveResponse>({
    method: 'PUT',
    url: `/reports/objectives/${id}`,
    data,
  });
}

export function deleteObjective(id: string) {
  return request<null>({
    method: 'DELETE',
    url: `/reports/objectives/${id}`,
  });
}

export function listExports(query: ListReportExportsQuery) {
  return requestPaginated<ReportExportListItemResponse>({
    method: 'GET',
    url: '/reports/exports',
    params: query,
  });
}

export function createExport(data: CreateReportExportRequest) {
  return request<ReportExportResponse>({
    method: 'POST',
    url: '/reports/exports',
    data,
  });
}
