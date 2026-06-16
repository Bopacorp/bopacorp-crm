import type { ChangeDocumentStateRequest } from '@bopacorp/shared/documents';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { changeDocumentState } from '../documentation.service.js';

export function useChangeDocumentState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangeDocumentStateRequest }) =>
      changeDocumentState(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });
}
