import type {
  AdvisorMetricResponse,
  AdvisorPerformanceResponse,
  CreateReportExportRequest,
  ListAdvisorMetricsQuery,
  ListAdvisorPerformanceQuery,
  ListRecentActivityQuery,
  ListReportExportsQuery,
  RecentActivityResponse,
  ReportExportListItemResponse,
  ReportExportResponse,
  SalesTargetResponse,
  UpdateSalesTargetRequest,
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

export function listTargets() {
  return request<SalesTargetResponse[]>({ method: 'GET', url: '/reports/targets' });
}

export function updateTarget(id: string, data: UpdateSalesTargetRequest) {
  return request<SalesTargetResponse>({ method: 'PUT', url: `/reports/targets/${id}`, data });
}

export function getAdvisorPerformance(query: ListAdvisorPerformanceQuery = {}) {
  return request<AdvisorPerformanceResponse[]>({
    method: 'GET',
    url: '/reports/advisor-performance',
    params: query,
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
