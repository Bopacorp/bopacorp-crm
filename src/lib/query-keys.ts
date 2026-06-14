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
};
