import { CreateJobVacancyRequestSchema } from '@bopacorp/shared/employability';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SheetFooter } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker, FormAlert } from '@/shared/ui';

const VacancyFormSchema = CreateJobVacancyRequestSchema.refine(
  (data) => {
    if (data.publicationDate && data.closingDate) {
      return new Date(data.closingDate) >= new Date(data.publicationDate);
    }
    return true;
  },
  {
    message: 'La fecha de cierre debe ser posterior o igual a la fecha de publicación',
    path: ['closingDate'],
  },
);

type InternalFormValues = z.input<typeof CreateJobVacancyRequestSchema>;

export interface VacancyFormValues {
  title: string;
  description: string;
  requirements: string;
  isActive: boolean;
  isPublished: boolean;
  publicationDate: string | undefined;
  closingDate: string | undefined;
}

interface VacancyFormProps {
  defaultValues: VacancyFormValues;
  onSubmit: (values: VacancyFormValues) => void;
  isPending: boolean;
  error?: string;
  submitLabel: string;
  onDirtyChange?: (dirty: boolean) => void;
}

export function VacancyForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  submitLabel,
  onDirtyChange,
}: VacancyFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<InternalFormValues>({
    resolver: zodResolver(VacancyFormSchema),
    defaultValues: {
      title: defaultValues.title,
      description: defaultValues.description,
      requirements: defaultValues.requirements,
      isActive: defaultValues.isActive,
      isPublished: defaultValues.isPublished,
      publicationDate: defaultValues.publicationDate ?? '',
      closingDate: defaultValues.closingDate ?? '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const submit = (data: InternalFormValues) => {
    const finalPublicationDate =
      data.isPublished && !data.publicationDate ? new Date().toISOString() : data.publicationDate;
    onSubmit({
      title: data.title,
      description: data.description,
      requirements: data.requirements,
      isActive: data.isActive ?? true,
      isPublished: data.isPublished ?? false,
      publicationDate: finalPublicationDate || undefined,
      closingDate: data.closingDate || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {error && <FormAlert message={error} />}

        <FieldGroup>
          <Field data-invalid={errors.title ? true : undefined}>
            <FieldLabel>Título</FieldLabel>
            <Input {...register('title')} placeholder="Título de la vacante" maxLength={50} />
            <FieldError>{errors.title?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.description ? true : undefined}>
            <FieldLabel>Descripción</FieldLabel>
            <Textarea
              {...register('description')}
              placeholder="Descripción general de la vacante"
              rows={4}
            />
            <FieldError>{errors.description?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.requirements ? true : undefined}>
            <FieldLabel>Requisitos</FieldLabel>
            <Textarea {...register('requirements')} placeholder="Requisitos del cargo" rows={4} />
            <FieldError>{errors.requirements?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Fecha de publicación</FieldLabel>
            <Controller
              control={control}
              name="publicationDate"
              render={({ field }) => (
                <DateTimePicker value={field.value ?? ''} onChange={field.onChange} />
              )}
            />
          </Field>

          <Field data-invalid={errors.closingDate ? true : undefined}>
            <FieldLabel>Fecha de cierre</FieldLabel>
            <Controller
              control={control}
              name="closingDate"
              render={({ field }) => (
                <DateTimePicker value={field.value ?? ''} onChange={field.onChange} />
              )}
            />
            <FieldError>{errors.closingDate?.message}</FieldError>
          </Field>

          <Field orientation="horizontal">
            <FieldLabel>Activa</FieldLabel>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
              )}
            />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel>Publicada</FieldLabel>
            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
              )}
            />
          </Field>
        </FieldGroup>
      </div>

      <SheetFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  );
}
