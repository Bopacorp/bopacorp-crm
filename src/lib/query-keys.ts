export const queryKeys = {
  businessClients: {
    all: ['business-clients'] as const,
    list: (page: number, filters: Record<string, unknown>) =>
      ['business-clients', 'list', page, filters] as const,
    detail: (id: string) => ['business-clients', 'detail', id] as const,
  },
  negotiations: {
    all: ['negotiations'] as const,
    list: (page: number, filters: Record<string, unknown>) =>
      ['negotiations', 'list', page, filters] as const,
    detail: (id: string) => ['negotiations', 'detail', id] as const,
    history: (id: string) => ['negotiations', 'history', id] as const,
  },
  negotiationStates: {
    all: ['negotiation-states'] as const,
  },
  visits: {
    all: ['visits'] as const,
    list: (page: number, filters: Record<string, unknown>) =>
      ['visits', 'list', page, filters] as const,
  },
  visitTypes: {
    all: ['visit-types'] as const,
  },
  employees: {
    all: ['employees'] as const,
    list: (filters: Record<string, unknown>) => ['employees', 'list', filters] as const,
    paginated: (page: number, filters: Record<string, unknown>) =>
      ['employees', 'paginated', page, filters] as const,
    detail: (userId: string) => ['employees', 'detail', userId] as const,
    supervisors: (userId: string) => ['employees', 'supervisors', userId] as const,
    advisors: (userId: string) => ['employees', 'advisors', userId] as const,
  },
  departments: {
    all: ['departments'] as const,
    list: (page: number, filters: Record<string, unknown>) =>
      ['departments', 'list', page, filters] as const,
  },
  orgRoles: {
    all: ['org-roles'] as const,
    list: (page: number, filters: Record<string, unknown>) =>
      ['org-roles', 'list', page, filters] as const,
  },
  users: {
    all: ['users'] as const,
    list: (page: number, filters: Record<string, unknown>) =>
      ['users', 'list', page, filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  documents: {
    all: ['documents'] as const,
    list: (page: number, filters: Record<string, unknown>) =>
      ['documents', 'list', page, filters] as const,
    detail: (id: string) => ['documents', 'detail', id] as const,
    history: (id: string) => ['documents', 'history', id] as const,
  },
  employability: {
    vacancies: {
      all: ['employability', 'vacancies'] as const,
      list: (page: number, filters: Record<string, unknown>) =>
        ['employability', 'vacancies', 'list', page, filters] as const,
      detail: (id: string) => ['employability', 'vacancies', 'detail', id] as const,
    },
    applications: {
      all: ['employability', 'applications'] as const,
      list: (page: number, filters: Record<string, unknown>) =>
        ['employability', 'applications', 'list', page, filters] as const,
      detail: (id: string) => ['employability', 'applications', 'detail', id] as const,
    },
  },
  catalog: {
    all: ['catalog'] as const,
    itemTypes: {
      all: ['catalog', 'item-types'] as const,
      list: (page: number, filters: Record<string, unknown>) =>
        ['catalog', 'item-types', 'list', page, filters] as const,
    },
    contractTypes: {
      all: ['catalog', 'contract-types'] as const,
      list: (page: number, filters: Record<string, unknown>) =>
        ['catalog', 'contract-types', 'list', page, filters] as const,
    },
    segments: {
      all: ['catalog', 'segments'] as const,
      list: (page: number, filters: Record<string, unknown>) =>
        ['catalog', 'segments', 'list', page, filters] as const,
    },
    tiers: {
      all: ['catalog', 'tiers'] as const,
      list: (page: number, filters: Record<string, unknown>) =>
        ['catalog', 'tiers', 'list', page, filters] as const,
    },
    geoZones: {
      all: ['catalog', 'geo-zones'] as const,
      list: (page: number, filters: Record<string, unknown>) =>
        ['catalog', 'geo-zones', 'list', page, filters] as const,
    },
    benefitTypes: {
      all: ['catalog', 'benefit-types'] as const,
      list: (page: number, filters: Record<string, unknown>) =>
        ['catalog', 'benefit-types', 'list', page, filters] as const,
    },
    contentTypes: {
      all: ['catalog', 'content-types'] as const,
      list: (page: number, filters: Record<string, unknown>) =>
        ['catalog', 'content-types', 'list', page, filters] as const,
    },
    categories: {
      all: ['catalog', 'categories'] as const,
      list: (page: number, filters: Record<string, unknown>) =>
        ['catalog', 'categories', 'list', page, filters] as const,
      tree: ['catalog', 'categories', 'tree'] as const,
    },
    items: {
      all: ['catalog', 'items'] as const,
      list: (page: number, filters: Record<string, unknown>) =>
        ['catalog', 'items', 'list', page, filters] as const,
      detail: (id: string) => ['catalog', 'items', 'detail', id] as const,
    },
    contentBlocks: {
      all: ['catalog', 'content-blocks'] as const,
      list: (page: number, filters: Record<string, unknown>) =>
        ['catalog', 'content-blocks', 'list', page, filters] as const,
      detail: (id: string) => ['catalog', 'content-blocks', 'detail', id] as const,
    },
    contactRequests: {
      all: ['catalog', 'contact-requests'] as const,
      list: (page: number, filters: Record<string, unknown>) =>
        ['catalog', 'contact-requests', 'list', page, filters] as const,
      detail: (id: string) => ['catalog', 'contact-requests', 'detail', id] as const,
    },
  },
};
