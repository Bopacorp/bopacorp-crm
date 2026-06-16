import type { DocumentTypeResponse, ListDocumentTypesQuery } from '@bopacorp/shared/documents';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listDocumentTypes } from '../documentation.service.js';

export function useDocumentTypes() {
  return useQuery({
    queryKey: queryKeys.documents.all,
    queryFn: () => listDocumentTypes({ limit: 100, isActive: true } as ListDocumentTypesQuery),
  });
}

export function useActiveDocumentTypes(): DocumentTypeResponse[] {
  const { data } = useDocumentTypes();
  return data?.data ?? [];
}
