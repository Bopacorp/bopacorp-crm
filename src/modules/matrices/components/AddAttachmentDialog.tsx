import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/lib/query-keys.js';
import { uploadDocument } from '@/modules/documentation/documentation.service.js';
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog, FormAlert } from '@/shared/ui';
import { createAttachment } from '../matrices.service.js';

const MAX_FILE_SIZE_MB = 50;

function createAttachmentSchema(fileTooLargeMessage: string) {
  return z.object({
    attachmentType: z.enum(['OFFER_MATRIX', 'EMAIL_TEMPLATE']),
    description: z.string().max(255).optional(),
    file: z
      .instanceof(File)
      .refine((f) => f.size / (1024 * 1024) <= MAX_FILE_SIZE_MB, fileTooLargeMessage),
  });
}

type FormValues = z.input<ReturnType<typeof createAttachmentSchema>>;

interface AddAttachmentDialogProps {
  matrixId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAttachmentDialog({ matrixId, open, onOpenChange }: AddAttachmentDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const attachmentSchema = useMemo(
    () => createAttachmentSchema(t('matrices.fileTooLarge', { max: MAX_FILE_SIZE_MB })),
    [t],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(attachmentSchema),
    defaultValues: {
      attachmentType: 'OFFER_MATRIX',
      description: '',
      file: undefined as unknown as File,
    },
    mode: 'onTouched',
  });

  const {
    control,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    clearErrors,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = form;

  const forceClose = useCallback(() => {
    reset({
      attachmentType: 'OFFER_MATRIX',
      description: '',
      file: undefined as unknown as File,
    });
    onOpenChange(false);
  }, [onOpenChange, reset]);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose: forceClose });

  useEffect(() => {
    handleDirtyChange(isDirty);
  }, [handleDirtyChange, isDirty]);

  useEffect(() => {
    if (open) {
      reset({
        attachmentType: 'OFFER_MATRIX',
        description: '',
        file: undefined as unknown as File,
      });
      clearErrors();
      dirtyRef.current = false;
    }
  }, [clearErrors, dirtyRef, open, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const upload = await uploadDocument(data.file);
      await createAttachment(matrixId, {
        matrixId,
        attachmentType: data.attachmentType,
        description: data.description || undefined,
        filename: upload.filename,
        fileExtension: upload.fileExtension,
        fileSizeMb: upload.fileSizeMb,
        storagePath: upload.storagePath,
        mimeType: upload.mimeType,
        encryptionMetadata: upload.encryptionMetadata,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.attachments(matrixId) });
      toast.success(t('matrices.attachmentUploaded'));
      dirtyRef.current = false;
      forceClose();
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

  const file = watch('file');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setValue('file', selected, { shouldValidate: true, shouldDirty: true });
  };

  const removeFile = () => {
    setValue('file', undefined as unknown as File, { shouldValidate: true, shouldDirty: true });
    clearErrors('file');
  };

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      guardedAction('close');
    } else {
      onOpenChange(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('matrices.addAttachment')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {errors.root && <FormAlert message={errors.root.message ?? ''} />}

            <FieldGroup>
              <Field data-invalid={errors.attachmentType ? true : undefined}>
                <FieldLabel>{t('matrices.attachmentType')}</FieldLabel>
                <Controller
                  control={control}
                  name="attachmentType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('matrices.selectAttachmentType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OFFER_MATRIX">
                          {t('matrices.offerAttachment')}
                        </SelectItem>
                        <SelectItem value="EMAIL_TEMPLATE">
                          {t('matrices.responseAttachment')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.attachmentType?.message}</FieldError>
              </Field>

              <Field data-invalid={errors.file ? true : undefined}>
                <FieldLabel htmlFor="attachment-file">{t('matrices.file')}</FieldLabel>
                {!file ? (
                  <div className="border-border rounded-lg border border-dashed p-6">
                    <label
                      htmlFor="attachment-file"
                      className="flex cursor-pointer flex-col items-center gap-2"
                    >
                      <FileUp className="text-muted-foreground size-8" />
                      <span className="text-muted-foreground text-sm">
                        {t('matrices.chooseFile')}
                      </span>
                    </label>
                    <Input
                      id="attachment-file"
                      type="file"
                      className="hidden"
                      disabled={mutation.isPending || isSubmitting}
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      aria-label={t('matrices.removeFile')}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                )}
                <FieldError>{errors.file?.message}</FieldError>
              </Field>

              <Field data-invalid={errors.description ? true : undefined}>
                <FieldLabel htmlFor="attachment-description">
                  {t('common.description')} ({t('common.optional')})
                </FieldLabel>
                <Textarea
                  id="attachment-description"
                  {...register('description')}
                  placeholder={t('common.descriptionPlaceholder')}
                  maxLength={150}
                  disabled={mutation.isPending || isSubmitting}
                />
                <FieldError>{errors.description?.message}</FieldError>
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
                  isSubmitting ||
                  (form.formState.isSubmitted && !form.formState.isValid)
                }
              >
                {mutation.isPending && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                {t('common.upload')}
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
