import type { CategoryResponse } from '@bopacorp/shared/catalog';
import { CreateCategoryRequestSchema } from '@bopacorp/shared/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { z } from 'zod';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog, FormAlert } from '@/shared/ui';
import { createCategory } from '../catalog.service.js';
import { useCategoryOptions } from '../hooks/useCategoryOptions.js';

type FormValues = z.input<typeof CreateCategoryRequestSchema>;

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}

export function CreateCategoryDialog({ open, onOpenChange, onCreated }: CreateCategoryDialogProps) {
  const { t } = useTranslation();
  const [formKey, setFormKey] = useState(0);

  const onClose = useCallback(() => onOpenChange(false), [onOpenChange]);
  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose });

  useEffect(() => {
    if (!open) {
      dirtyRef.current = false;
      setFormKey((k) => k + 1);
    }
  }, [open, dirtyRef]);

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
            <DialogTitle>{t('catalog.newCategory')}</DialogTitle>
          </DialogHeader>
          <CreateForm
            key={formKey}
            onDirtyChange={handleDirtyChange}
            onSuccess={(id) => {
              dirtyRef.current = false;
              onCreated(id);
              onOpenChange(false);
            }}
          />
        </DialogContent>
      </Dialog>
      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />
    </>
  );
}

function CreateForm({
  onDirtyChange,
  onSuccess,
}: {
  onDirtyChange: (dirty: boolean) => void;
  onSuccess: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { options } = useCategoryOptions();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateCategoryRequestSchema),
    defaultValues: { name: '', parentId: undefined, description: '', sortOrder: 0, isActive: true },
    mode: 'onTouched',
  });

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const slug = data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      return createCategory({
        name: data.name,
        slug,
        parentId: data.parentId || undefined,
        description: data.description || undefined,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      });
    },
    onSuccess: (data: CategoryResponse) => {
      toast.success(t('catalog.categoryCreated'));
      onSuccess(data.id);
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-4 px-4">
        <FieldGroup>
          {errors.root && <FormAlert message={errors.root.message ?? ''} />}

          <Field data-invalid={errors.name ? true : undefined}>
            <FieldLabel>{t('common.name')}</FieldLabel>
            <Input {...register('name')} placeholder={t('catalog.categoryName')} maxLength={30} />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.parentId ? true : undefined}>
            <FieldLabel>{t('catalog.parentCategory')}</FieldLabel>
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <Select
                  value={field.value ?? '__none__'}
                  onValueChange={(v) => field.onChange(v === '__none__' ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.noParent')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('common.noParent')}</SelectItem>
                    {options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError>{errors.parentId?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.description ? true : undefined}>
            <FieldLabel>{t('common.description')}</FieldLabel>
            <Textarea
              {...register('description')}
              placeholder={t('common.descriptionPlaceholder')}
              maxLength={150}
              rows={3}
            />
            <FieldError>{errors.description?.message}</FieldError>
          </Field>

          <Field data-invalid={errors.sortOrder ? true : undefined}>
            <FieldLabel>{t('common.order')}</FieldLabel>
            <Input type="number" {...register('sortOrder', { valueAsNumber: true })} min={0} />
            <FieldError>{errors.sortOrder?.message}</FieldError>
          </Field>

          <Field orientation="horizontal">
            <FieldLabel>{t('common.active')}</FieldLabel>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </Field>
        </FieldGroup>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {t('common.create')}
        </Button>
      </DialogFooter>
    </form>
  );
}
