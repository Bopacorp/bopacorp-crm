import type { PaginationMeta } from '@bopacorp/shared/common';
import type {
  CreateJobVacancyRequest,
  JobApplicationListItemResponse,
  JobApplicationResponse,
  JobVacancyListItemResponse,
  JobVacancyResponse,
  ListJobApplicationsQuery,
  ListJobVacanciesQuery,
  UpdateJobApplicationRequest,
  UpdateJobVacancyRequest,
} from '@bopacorp/shared/employability';
import api, { request, requestPaginated } from '@/services/api.js';

export function listVacancies(query: ListJobVacanciesQuery) {
  return requestPaginated<JobVacancyListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/employability/vacancies',
    params: query,
  });
}

export function getVacancy(id: string) {
  return request<JobVacancyResponse>({ method: 'GET', url: `/employability/vacancies/${id}` });
}

export function createVacancy(data: CreateJobVacancyRequest) {
  return request<JobVacancyResponse>({ method: 'POST', url: '/employability/vacancies', data });
}

export function updateVacancy(id: string, data: UpdateJobVacancyRequest) {
  return request<JobVacancyResponse>({
    method: 'PATCH',
    url: `/employability/vacancies/${id}`,
    data,
  });
}

export function removeVacancy(id: string) {
  return request<null>({ method: 'DELETE', url: `/employability/vacancies/${id}` });
}

export function listJobApplications(query: ListJobApplicationsQuery) {
  return requestPaginated<JobApplicationListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/employability/job-applications',
    params: query,
  });
}

export function getJobApplication(id: string) {
  return request<JobApplicationResponse>({
    method: 'GET',
    url: `/employability/job-applications/${id}`,
  });
}

export function updateJobApplication(id: string, data: UpdateJobApplicationRequest) {
  return request<JobApplicationResponse>({
    method: 'PATCH',
    url: `/employability/job-applications/${id}`,
    data,
  });
}

export async function downloadCandidateResume(resumeId: string, filename: string) {
  const response = await api.get(`/employability/candidate-resumes/${resumeId}/download`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data as BlobPart]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
