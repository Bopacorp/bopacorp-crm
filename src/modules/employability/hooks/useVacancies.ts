import type {
  JobVacancyListItemResponse,
  ListJobVacanciesQuery,
} from '@bopacorp/shared/employability';
import { queryKeys } from '@/lib/query-keys.js';
import { usePaginatedList } from '@/shared/hooks/usePaginatedList.js';
import { listVacancies } from '../employability.service.js';

export interface VacancyFilters {
  search?: string;
  isActive?: boolean;
  isPublished?: boolean;
}

export function useVacancies(page: number, filters: VacancyFilters) {
  const { data, ...rest } = usePaginatedList<JobVacancyListItemResponse, VacancyFilters>({
    page,
    filters,
    queryKey: queryKeys.employability.vacancies.list,
    queryFn: (params) => listVacancies(params as ListJobVacanciesQuery),
    buildParams: (f, debouncedSearch) => ({
      search: debouncedSearch || undefined,
      isActive: f.isActive,
      isPublished: f.isPublished,
      limit: 10,
    }),
  });

  return { vacancies: data, ...rest };
}
