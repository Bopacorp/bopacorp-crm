import { useMutation } from '@tanstack/react-query';
import { uploadDocument } from '../documentation.service.js';

export function useUploadDocument() {
  return useMutation({
    mutationFn: (file: File) => uploadDocument(file),
  });
}
