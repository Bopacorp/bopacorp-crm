import type { NegotiationListItemResponse } from '@bopacorp/shared/crm';
import { CreateNegotiationDocumentRequestSchema } from '@bopacorp/shared/documents';
import { V } from '@bopacorp/shared/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileUp, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { queryKeys } from '@/lib/query-keys.js';
import { listNegotiations } from '@/modules/negotiations/negotiations.service.js';
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog, FormAlert } from '@/shared/ui';
import { createDocument, uploadDocument } from '../documentation.service.js';
import { useActiveDocumentTypes } from '../hooks/useDocumentTypes.js';

const MAX_FILE_SIZE_MB = 50;
const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

function createDocumentUploadSchema(fileTooLargeMessage: string) {
  return CreateNegotiationDocumentRequestSchema.pick({
    negotiationId: true,
    documentTypeId: true,
  }).extend({
    file: z
      .instanceof(File, { message: V.REQUIRED })
      .refine((f) => f.size / (1024 * 1024) <= MAX_FILE_SIZE_MB, fileTooLargeMessage),
  });
}

type FormValues = z.input<ReturnType<typeof createDocumentUploadSchema>>;

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  negotiationId?: string;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  negotiationId: preselectedNegotiationId,
}: DocumentUploadDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const documentUploadSchema = useMemo(
    () => createDocumentUploadSchema(t('documentation.fileTooLarge', { max: MAX_FILE_SIZE_MB })),
    [t],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      negotiationId: preselectedNegotiationId ?? '',
      documentTypeId: '',
      file: undefined as unknown as File,
    },
    mode: 'onTouched',
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = form;

  const file = watch('file');

  const documentTypes = useActiveDocumentTypes();
  const { data: negotiationsData } = useQuery({
    queryKey: ['negotiations', 'select'],
    queryFn: () => listNegotiations({ page: 1, limit: 100, sortOrder: 'asc' }),
    enabled: !preselectedNegotiationId,
  });
  const negotiations = (negotiationsData?.data ?? []) as NegotiationListItemResponse[];

  const forceClose = useCallback(() => {
    form.reset({
      negotiationId: preselectedNegotiationId ?? '',
      documentTypeId: '',
      file: undefined as unknown as File,
    });
    onOpenChange(false);
  }, [onOpenChange, preselectedNegotiationId, form]);

  const { dirtyRef, showDiscard, guardedAction, handleDiscard, cancelDiscard } = useUnsavedGuard({
    onClose: forceClose,
  });

  useEffect(() => {
    if (!open) {
      dirtyRef.current = false;
      form.reset({
        negotiationId: preselectedNegotiationId ?? '',
        documentTypeId: '',
        file: undefined as unknown as File,
      });
    }
  }, [open, dirtyRef, form, preselectedNegotiationId]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const upload = await uploadDocument(data.file);
      await createDocument({
        negotiationId: data.negotiationId,
        documentTypeId: data.documentTypeId,
        filename: upload.filename,
        fileExtension: upload.fileExtension,
        fileSizeMb: upload.fileSizeMb,
        storagePath: upload.storagePath,
        mimeType: upload.mimeType,
        encryptionMetadata: upload.encryptionMetadata,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      toast.success(t('documentation.documentUploaded'));
      forceClose();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setValue('file', selected, { shouldValidate: true, shouldDirty: true });
  };

  const removeFile = () => {
    setValue('file', undefined as unknown as File, { shouldValidate: true, shouldDirty: true });
    form.clearErrors('file');
  };

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) {
            guardedAction('close');
          } else {
            onOpenChange(true);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('documentation.uploadDocument')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {errors.root && <FormAlert message={errors.root.message ?? ''} />}

            <FieldGroup>
              {!preselectedNegotiationId && (
                <Field data-invalid={errors.negotiationId ? true : undefined}>
                  <FieldLabel htmlFor="negotiationId">{t('documentation.negotiation')}</FieldLabel>
                  <Controller
                    control={control}
                    name="negotiationId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="negotiationId">
                          <SelectValue placeholder={t('documentation.selectNegotiation')} />
                        </SelectTrigger>
                        <SelectContent>
                          {negotiations.map((n) => (
                            <SelectItem key={n.id} value={n.id}>
                              {n.client.businessName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError>{errors.negotiationId?.message}</FieldError>
                </Field>
              )}

              <Field data-invalid={errors.documentTypeId ? true : undefined}>
                <FieldLabel htmlFor="documentTypeId">{t('documentation.documentType')}</FieldLabel>
                <Controller
                  control={control}
                  name="documentTypeId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="documentTypeId">
                        <SelectValue placeholder={t('documentation.selectDocumentType')} />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((documentType) => (
                          <SelectItem key={documentType.id} value={documentType.id}>
                            {documentType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.documentTypeId?.message}</FieldError>
              </Field>

              <Field data-invalid={errors.file ? true : undefined}>
                <FieldLabel htmlFor="document-file">{t('documentation.file')}</FieldLabel>
                {!file ? (
                  <div className="border-border rounded-lg border border-dashed p-6">
                    <label
                      htmlFor="document-file"
                      className="flex cursor-pointer flex-col items-center gap-2"
                    >
                      <FileUp className="text-muted-foreground size-8" />
                      <span className="text-sm text-muted-foreground">
                        {t('documentation.fileSelect')}
                      </span>
                    </label>
                    <Input
                      id="document-file"
                      type="file"
                      className="hidden"
                      accept={ACCEPTED_FILE_TYPES}
                      disabled={mutation.isPending || form.formState.isSubmitting}
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <span className="min-w-0 truncate text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      aria-label={t('documentation.removeFile')}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                )}
                <FieldError>{errors.file?.message}</FieldError>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => guardedAction('close')}>
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={
                  mutation.isPending ||
                  form.formState.isSubmitting ||
                  (form.formState.isSubmitted && !form.formState.isValid)
                }
              >
                {mutation.isPending && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                {t('documentation.uploadDocument')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <DiscardChangesDialog
        open={showDiscard}
        onCancel={cancelDiscard}
        onDiscard={() => {
          dirtyRef.current = false;
          handleDiscard();
        }}
      />
    </>
  );
}
