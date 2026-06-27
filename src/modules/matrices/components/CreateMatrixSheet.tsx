import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileUp, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/lib/query-keys.js';
import { uploadDocument } from '@/modules/documentation/documentation.service.js';
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog, FormAlert } from '@/shared/ui';
import { createAttachment, createMatrix } from '../matrices.service.js';

const MAX_FILE_SIZE_MB = 50;

function createMatrixFormSchema(fileTooLargeMessage: string) {
  return z.object({
    attachmentType: z.enum(['OFFER_MATRIX', 'EMAIL_TEMPLATE']),
    file: z
      .instanceof(File)
      .refine((f) => f.size / (1024 * 1024) <= MAX_FILE_SIZE_MB, fileTooLargeMessage),
    description: z.string().max(255).optional(),
    observations: z.string().max(1000).optional(),
  });
}

type FormValues = z.input<ReturnType<typeof createMatrixFormSchema>>;

interface CreateMatrixSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiationId: string;
  onSuccess: () => void;
}

export function CreateMatrixSheet({
  open,
  onOpenChange,
  negotiationId,
  onSuccess,
}: CreateMatrixSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [key, setKey] = useState(0);
  const [error, setError] = useState('');
  const formSchema = useMemo(
    () => createMatrixFormSchema(t('matrices.fileTooLarge', { max: MAX_FILE_SIZE_MB })),
    [t],
  );

  const forceClose = useCallback(() => {
    setKey((k) => k + 1);
    setError('');
    onOpenChange(false);
  }, [onOpenChange]);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose: forceClose });

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      guardedAction('close');
    } else {
      onOpenChange(true);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const matrix = await createMatrix({
        negotiationId,
        observations: data.observations || undefined,
      });
      const upload = await uploadDocument(data.file);
      await createAttachment(matrix.id, {
        matrixId: matrix.id,
        attachmentType: data.attachmentType,
        description: data.description || undefined,
        filename: upload.filename,
        fileExtension: upload.fileExtension,
        fileSizeMb: upload.fileSizeMb,
        storagePath: upload.storagePath,
        mimeType: upload.mimeType,
        encryptionMetadata: upload.encryptionMetadata,
      });
      return matrix;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.all });
      toast.success(t('matrices.created'));
      dirtyRef.current = false;
      forceClose();
      onSuccess();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details?.length) {
        setError(err.details[0]?.message ?? getErrorMessage(err));
        return;
      }
      setError(getErrorMessage(err));
    },
  });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('matrices.newMatrix')}</SheetTitle>
        </SheetHeader>
        <CreateMatrixForm
          key={key}
          schema={formSchema}
          onSubmit={(data) => mutation.mutate(data)}
          isPending={mutation.isPending}
          error={error}
          onDirtyChange={handleDirtyChange}
        />
      </SheetContent>

      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />
    </Sheet>
  );
}

interface CreateMatrixFormProps {
  schema: ReturnType<typeof createMatrixFormSchema>;
  onSubmit: (data: FormValues) => void;
  isPending: boolean;
  error: string;
  onDirtyChange: (dirty: boolean) => void;
}

function CreateMatrixForm({
  schema,
  onSubmit,
  isPending,
  error,
  onDirtyChange,
}: CreateMatrixFormProps) {
  const { t } = useTranslation();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors, isDirty, isSubmitting, isSubmitted, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      attachmentType: 'OFFER_MATRIX',
      file: undefined as unknown as File,
      description: '',
      observations: '',
    },
    mode: 'onTouched',
  });

  const file = watch('file');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setValue('file', selected, { shouldValidate: true, shouldDirty: true });
  };

  const removeFile = () => {
    setValue('file', undefined as unknown as File, { shouldDirty: true });
    clearErrors('file');
  };

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {error && <FormAlert message={error} />}

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
                    <SelectItem value="OFFER_MATRIX">{t('matrices.offerAttachment')}</SelectItem>
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
            <FieldLabel htmlFor="matrix-file">{t('matrices.file')}</FieldLabel>
            {!file ? (
              <div className="rounded-lg border border-dashed border-border p-6">
                <label
                  htmlFor="matrix-file"
                  className="flex cursor-pointer flex-col items-center gap-2"
                >
                  <FileUp className="size-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('matrices.chooseFile')}</span>
                </label>
                <Input
                  id="matrix-file"
                  type="file"
                  className="hidden"
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
            <FieldLabel htmlFor="matrix-description">
              {t('common.description')} ({t('common.optional')})
            </FieldLabel>
            <Textarea
              id="matrix-description"
              {...register('description')}
              placeholder={t('common.descriptionPlaceholder')}
              maxLength={150}
            />
            <FieldError>{errors.description?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.observations ? true : undefined}>
            <FieldLabel htmlFor="matrix-observations">
              {t('common.observations')} ({t('common.optional')})
            </FieldLabel>
            <Textarea
              id="matrix-observations"
              {...register('observations')}
              placeholder={t('matrices.observationsPlaceholder')}
              maxLength={500}
            />
            <FieldError>{errors.observations?.message}</FieldError>
          </Field>
        </FieldGroup>
      </div>

      <SheetFooter>
        <Button type="submit" disabled={isPending || isSubmitting || (isSubmitted && !isValid)}>
          {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {t('common.create')}
        </Button>
      </SheetFooter>
    </form>
  );
}
