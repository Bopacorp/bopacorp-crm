import type { CreateNegotiationDocumentRequest } from '@bopacorp/shared/documents';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { createDocument } from '../documentation.service.js';

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNegotiationDocumentRequest) => createDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });
}
