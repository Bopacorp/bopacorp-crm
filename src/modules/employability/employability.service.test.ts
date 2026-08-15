import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  application,
  PHASE6_TEST_IDS,
  vacancy,
  vacancyListItem,
} from '@/test/crm-phase6-fixtures.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  requestPaginated: vi.fn(),
  get: vi.fn(),
  createObjectURL: vi.fn(),
  revokeObjectURL: vi.fn(),
}));

vi.mock('@/services/api.js', () => ({
  default: { get: mocks.get },
  request: mocks.request,
  requestPaginated: mocks.requestPaginated,
}));

import {
  createVacancy,
  downloadCandidateResume,
  getJobApplication,
  getVacancy,
  listJobApplications,
  listVacancies,
  removeVacancy,
  updateJobApplication,
  updateVacancy,
} from './employability.service.js';

const id = PHASE6_TEST_IDS;

describe('employability service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue(vacancy);
    mocks.requestPaginated.mockResolvedValue({ data: [vacancyListItem], meta: undefined });
  });

  it('maps vacancy and application CRUD operations', async () => {
    const vacancyQuery = {
      page: 1,
      limit: 10,
      sortOrder: 'asc' as const,
      search: 'sales',
      isPublished: false,
    };
    const applicationQuery = {
      page: 2,
      limit: 10,
      sortOrder: 'desc' as const,
      vacancyId: vacancy.id,
      state: 'PENDING' as const,
    };

    await listVacancies(vacancyQuery);
    await getVacancy(vacancy.id);
    await createVacancy({
      title: vacancy.title,
      description: vacancy.description,
      requirements: vacancy.requirements,
      isActive: true,
      isPublished: false,
      closingDate: vacancy.closingDate ?? undefined,
    });
    await updateVacancy(vacancy.id, { isPublished: true });
    await removeVacancy(vacancy.id);
    await listJobApplications(applicationQuery);
    await getJobApplication(application.id);
    await updateJobApplication(application.id, { state: 'ACCEPTED', reviewNotes: 'Reviewed.' });

    expect(mocks.requestPaginated).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: '/employability/vacancies',
      params: vacancyQuery,
    });
    expect(mocks.requestPaginated).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      url: '/employability/job-applications',
      params: applicationQuery,
    });
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'PATCH',
      url: `/employability/job-applications/${application.id}`,
      data: { state: 'ACCEPTED', reviewNotes: 'Reviewed.' },
    });
  });

  it('downloads a candidate resume as a browser file', async () => {
    const originalUrl = window.URL;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const remove = vi.spyOn(HTMLAnchorElement.prototype, 'remove').mockImplementation(() => {});
    mocks.get.mockResolvedValue({ data: new Blob(['resume']) });
    mocks.createObjectURL.mockReturnValue('blob:resume');
    Object.defineProperty(window, 'URL', {
      configurable: true,
      value: {
        createObjectURL: mocks.createObjectURL,
        revokeObjectURL: mocks.revokeObjectURL,
      },
    });

    try {
      await downloadCandidateResume(id.resume, 'candidate.pdf');

      expect(mocks.get).toHaveBeenCalledWith(
        `/employability/candidate-resumes/${id.resume}/download`,
        { responseType: 'blob' },
      );
      expect(mocks.createObjectURL).toHaveBeenCalledOnce();
      expect(click).toHaveBeenCalledOnce();
      expect(remove).toHaveBeenCalledOnce();
      expect(mocks.revokeObjectURL).toHaveBeenCalledWith('blob:resume');
    } finally {
      Object.defineProperty(window, 'URL', { configurable: true, value: originalUrl });
      click.mockRestore();
      remove.mockRestore();
    }
  });
});
