import type {
  JobApplicationListItemResponse,
  ListJobApplicationsQuery,
} from '@bopacorp/shared/employability';
import { queryKeys } from '@/lib/query-keys.js';
import { usePaginatedList } from '@/shared/hooks/usePaginatedList.js';
import { listJobApplications } from '../employability.service.js';

export interface JobApplicationFilters {
  search?: string;
  vacancyId?: string;
  state?: string;
}

export function useJobApplications(page: number, filters: JobApplicationFilters) {
  const { data, ...rest } = usePaginatedList<JobApplicationListItemResponse, JobApplicationFilters>(
    {
      page,
      filters,
      queryKey: queryKeys.employability.applications.list,
      queryFn: (params) => listJobApplications(params as ListJobApplicationsQuery),
      buildParams: (f, debouncedSearch) => ({
        search: debouncedSearch || undefined,
        vacancyId: f.vacancyId,
        state: f.state,
        limit: 10,
      }),
    },
  );

  return { applications: data, ...rest };
}
