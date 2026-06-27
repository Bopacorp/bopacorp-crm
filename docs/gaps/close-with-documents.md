# Close With Documents — Gap Analysis

Audited: 2026-06-27

## Backend change (already deployed)

New atomic endpoint replaces the sequential upload loop:

```
POST /api/v1/crm/negotiations/:id/close-with-documents
Content-Type: multipart/form-data

files[]: File (multiple, PDF/JPG/PNG, max 50MB each, max 10 files)
documentTypeIds[]: UUID[] (one per file, same order)
notes?: string (optional state change notes)
```

Response: `{ success: true, data: NegotiationResponse }` — negotiation already in closing state.

Backend handles atomically:
- Validates mandatory doc coverage (existing + new)
- Uploads all files to S3 (encrypted)
- Creates doc records + changes state in single DB transaction
- On failure: rolls back DB + best-effort S3 cleanup

Old flow (N+1 calls) still works but is no longer needed for closing.

---

## Current CRM state

`ChangeStateDialog.tsx` currently does closing with sequential calls:

```ts
// lines 162-188 — current onSubmit
for (const [docTypeId, file] of docFiles) {
  const upload = await uploadDocument(file);     // POST /document-uploads
  await createDocument({ negotiationId, ... });  // POST /documents
}
mutation.mutate({ stateId, notes });              // PATCH /negotiations/:id/state
```

No rollback if any step fails mid-loop. Orphaned S3 objects possible.

---

## What needs to change

### 1. Add `closeWithDocuments` to `negotiations.service.ts`

```ts
import api from '@/services/api.js';
import type { NegotiationResponse } from '@bopacorp/shared/crm';

export async function closeWithDocuments(
  negotiationId: string,
  files: Map<string, File>,
  notes?: string,
): Promise<NegotiationResponse> {
  const formData = new FormData();

  for (const [docTypeId, file] of files) {
    formData.append('files', file);
    formData.append('documentTypeIds', docTypeId);
  }

  if (notes) {
    formData.append('notes', notes);
  }

  const response = await api.post<{ success: boolean; data: NegotiationResponse }>(
    `/crm/negotiations/${negotiationId}/close-with-documents`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  if (!response.data.success) {
    throw new Error('Close with documents failed');
  }

  return response.data.data;
}
```

Key: `files` and `documentTypeIds` are appended in the same order — backend matches them positionally.

### 2. Rewrite `ChangeStateDialog.tsx` onSubmit

Replace the sequential upload loop + state change with a single call.

**Before** (lines 162-188):
```ts
const onSubmit = async (data: FormValues) => {
  if (isClosing && docFiles.size > 0) {
    setUploading(true);
    setUploadError('');
    try {
      for (const [docTypeId, file] of docFiles) {
        const upload = await uploadDocument(file);
        await createDocument({
          negotiationId,
          documentTypeId: docTypeId,
          filename: upload.filename,
          fileExtension: upload.fileExtension,
          fileSizeMb: upload.fileSizeMb,
          storagePath: upload.storagePath,
          mimeType: upload.mimeType,
          encryptionMetadata: upload.encryptionMetadata,
        });
      }
    } catch (err) {
      setUploadError(getErrorMessage(err));
      setUploading(false);
      return;
    }
    setUploading(false);
  }

  mutation.mutate({ stateId: data.stateId, notes: data.notes || undefined });
};
```

**After**:
```ts
const closeMutation = useMutation({
  mutationFn: ({ notes }: { notes?: string }) =>
    closeWithDocuments(negotiationId, docFiles, notes),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.negotiations.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    toast.success(t('negotiations.stateUpdated'));
    onOpenChange(false);
    onSuccess();
  },
  onError: (err) => {
    if (err instanceof ApiError && err.details?.length) {
      for (const d of err.details) {
        setError(d.field as keyof FormValues, { type: 'server', message: d.message });
      }
      return;
    }
    setError('root', { type: 'server', message: getErrorMessage(err) });
  },
});

const onSubmit = async (data: FormValues) => {
  if (isClosing && docFiles.size > 0) {
    closeMutation.mutate({ notes: data.notes || undefined });
    return;
  }

  mutation.mutate({ stateId: data.stateId, notes: data.notes || undefined });
};
```

### 3. Update mutation busy state

```ts
// Before
const isBusy = mutation.isPending || uploading;

// After
const isBusy = mutation.isPending || closeMutation.isPending;
```

Remove `uploading` and `setUploading` state — no longer needed.

### 4. Remove unused imports

After rewrite, these imports from `documentation.service.js` are no longer needed in `ChangeStateDialog.tsx`:

```ts
// REMOVE
import { createDocument, uploadDocument } from '@/modules/documentation/documentation.service.js';

// ADD
import { closeWithDocuments } from '../negotiations.service.js';
```

### 5. Remove unused state

```ts
// REMOVE — no longer tracking upload state manually
const [uploading, setUploading] = useState(false);
const [uploadError, setUploadError] = useState('');
```

The `uploadError` display can stay — just wire it to `closeMutation.error` instead:

```ts
// In the JSX, replace:
{uploadError && <FormAlert message={uploadError} />}

// With (optional, since onError already sets form errors):
// Remove this line entirely — errors handled by closeMutation.onError → setError('root', ...)
```

---

## Files to change

| Action | File | Description |
|--------|------|-------------|
| EDIT | `negotiations/negotiations.service.ts` | Add `closeWithDocuments()` function |
| EDIT | `negotiations/components/ChangeStateDialog.tsx` | Replace sequential loop with single mutation |

---

## Error handling changes

| Scenario | Old behavior | New behavior |
|----------|-------------|-------------|
| S3 upload fails | Orphaned docs already created | Backend rolls back everything |
| DB error after uploads | Docs created but state not changed | Backend rolls back DB + cleans S3 |
| Missing mandatory docs | Frontend checks locally only | Backend validates (400 with missing type names) |
| File type invalid | Frontend accepts validation | Multer rejects at backend (422) |
| Race condition (double submit) | Both succeed, corrupted state | Backend `SELECT FOR UPDATE` prevents race |

---

## Execution order

1. Add `closeWithDocuments` to `negotiations.service.ts`
2. Rewrite `ChangeStateDialog.tsx` onSubmit
3. Remove unused imports and state
4. Test: select closing state, attach files, submit — single request in network tab
5. Test error: submit without all mandatory docs — backend returns 400 with missing type names
