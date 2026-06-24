import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { FormAlert } from '@/shared/ui';
import { createAttachment } from '../matrices.service.js';

const AddAttachmentSchema = z.object({
  attachmentType: z.enum(['OFFER_MATRIX', 'EMAIL_TEMPLATE']),
  description: z.string().max(255).optional(),
  file: z.instanceof(File).refine((f) => f.size / (1024 * 1024) <= 50, {
    message: 'El archivo no puede superar los 50 MB',
  }),
});

type FormValues = z.input<typeof AddAttachmentSchema>;

interface AddAttachmentDialogProps {
  matrixId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAttachmentDialog({ matrixId, open, onOpenChange }: AddAttachmentDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(AddAttachmentSchema),
    defaultValues: {
      attachmentType: 'OFFER_MATRIX',
      description: '',
      file: undefined,
    },
    mode: 'onTouched',
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      reset({ attachmentType: 'OFFER_MATRIX', description: '', file: undefined });
    }
  }, [open, reset]);

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
      toast.success('Adjunto agregado');
      onOpenChange(false);
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

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar adjunto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errors.root && <FormAlert message={errors.root.message ?? ''} />}

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
              <Controller
                control={control}
                name="file"
                render={({ field }) => (
                  <Input
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) field.onChange(f);
                    }}
                  />
                )}
              />
              <FieldError>{errors.file?.message}</FieldError>
            </Field>

            <Field data-invalid={errors.description ? true : undefined}>
              <FieldLabel>Descripción (opcional)</FieldLabel>
              <Textarea
                {...register('description')}
                placeholder="Descripción del adjunto..."
                maxLength={150}
              />
              <FieldError>{errors.description?.message}</FieldError>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Subir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
