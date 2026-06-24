import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileUp, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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

const FormSchema = z.object({
  attachmentType: z.enum(['OFFER_MATRIX', 'EMAIL_TEMPLATE']),
  file: z
    .instanceof(File)
    .refine(
      (f) => f.size / (1024 * 1024) <= MAX_FILE_SIZE_MB,
      `El archivo no puede superar los ${MAX_FILE_SIZE_MB} MB`,
    ),
  description: z.string().max(255).optional(),
  observations: z.string().max(1000).optional(),
});

type FormValues = z.input<typeof FormSchema>;

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
  const queryClient = useQueryClient();
  const [key, setKey] = useState(0);
  const [error, setError] = useState('');

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
      toast.success('Matriz creada');
      dirtyRef.current = false;
      forceClose();
      onSuccess();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details?.length) {
        setError('');
        return;
      }
      setError(getErrorMessage(err));
    },
  });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nueva matriz de oferta</SheetTitle>
        </SheetHeader>
        <CreateMatrixForm
          key={key}
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
  onSubmit: (data: FormValues) => void;
  isPending: boolean;
  error: string;
  onDirtyChange: (dirty: boolean) => void;
}

function CreateMatrixForm({ onSubmit, isPending, error, onDirtyChange }: CreateMatrixFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
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
            <FieldLabel>Tipo</FieldLabel>
            <Controller
              control={control}
              name="attachmentType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFER_MATRIX">Matriz de oferta</SelectItem>
                    <SelectItem value="EMAIL_TEMPLATE">Plantilla de email</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError>{errors.attachmentType?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.file ? true : undefined}>
            <FieldLabel>Archivo</FieldLabel>
            {!file ? (
              <div className="rounded-lg border border-dashed border-border p-6">
                <label
                  htmlFor="matrix-file"
                  className="flex cursor-pointer flex-col items-center gap-2"
                >
                  <FileUp className="size-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Haz clic para seleccionar un archivo
                  </span>
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
                  aria-label="Quitar archivo"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
            <FieldError>{errors.file?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.description ? true : undefined}>
            <FieldLabel>Descripción (opcional)</FieldLabel>
            <Textarea
              {...register('description')}
              placeholder="Descripción del adjunto..."
              maxLength={255}
            />
            <FieldError>{errors.description?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.observations ? true : undefined}>
            <FieldLabel>Observaciones (opcional)</FieldLabel>
            <Textarea
              {...register('observations')}
              placeholder="Notas sobre esta matriz..."
              maxLength={1000}
            />
            <FieldError>{errors.observations?.message}</FieldError>
          </Field>
        </FieldGroup>
      </div>

      <SheetFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          Crear
        </Button>
      </SheetFooter>
    </form>
  );
}
