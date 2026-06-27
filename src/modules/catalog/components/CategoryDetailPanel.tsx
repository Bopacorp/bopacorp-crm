import type { CategoryTreeResponse } from '@bopacorp/shared/catalog';
import { UpdateCategoryRequestSchema } from '@bopacorp/shared/catalog';
import { V, vk } from '@bopacorp/shared/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, FileText, GitBranch, Hash, Loader2, Pencil, Settings, Tag } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { formatRelativeTime } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog, ErrorState, FormAlert, StateBadge } from '@/shared/ui';
import { getCategory, updateCategory } from '../catalog.service.js';
import { useCategoryOptions } from '../hooks/useCategoryOptions.js';

interface CategoryDetailPanelProps {
  categoryId: string;
  tree: CategoryTreeResponse[];
  onUpdated: () => void;
  dirtyRef?: React.MutableRefObject<boolean>;
}

function getDescendantIds(tree: CategoryTreeResponse[], targetId: string): string[] {
  const ids: string[] = [];
  function find(nodes: CategoryTreeResponse[]): boolean {
    for (const node of nodes) {
      if (node.id === targetId) {
        collectAll(node.children);
        return true;
      }
      if (find(node.children)) return true;
    }
    return false;
  }
  function collectAll(nodes: CategoryTreeResponse[]) {
    for (const node of nodes) {
      ids.push(node.id);
      collectAll(node.children);
    }
  }
  find(tree);
  return ids;
}

function findCategoryName(tree: CategoryTreeResponse[], id: string): string | null {
  for (const node of tree) {
    if (node.id === id) return node.name;
    const found = findCategoryName(node.children, id);
    if (found) return found;
  }
  return null;
}

const CategoryEditSchema = UpdateCategoryRequestSchema.extend({
  name: z
    .string({ error: V.REQUIRED })
    .min(1, V.REQUIRED)
    .max(100, vk(V.MAX_CHARS, { max: 100 })),
  sortOrder: z.number({ error: V.REQUIRED }).int(V.INTEGER).min(0, V.NON_NEGATIVE).default(0),
  isActive: z.boolean(),
});

type EditFormValues = z.input<typeof CategoryEditSchema>;

export function CategoryDetailPanel({
  categoryId,
  tree,
  onUpdated,
  dirtyRef: externalDirtyRef,
}: CategoryDetailPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const prevCategoryIdRef = useRef(categoryId);

  const onClose = useCallback(() => setEditing(false), []);
  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose });

  const {
    data: entity,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...queryKeys.catalog.categories.all, 'detail', categoryId],
    queryFn: () => getCategory(categoryId),
    enabled: !!categoryId,
  });

  useEffect(() => {
    if (prevCategoryIdRef.current === categoryId) {
      return;
    }

    prevCategoryIdRef.current = categoryId;
    setEditing(false);
    dirtyRef.current = false;
    if (externalDirtyRef) {
      externalDirtyRef.current = false;
    }
  }, [categoryId, dirtyRef, externalDirtyRef]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.catalog.categories.all });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={`sk-${String(i)}`} className="flex items-start gap-3 px-2 py-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !entity) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  if (editing) {
    return (
      <>
        <EditForm
          entity={entity}
          tree={tree}
          onDirtyChange={(dirty) => {
            handleDirtyChange(dirty);
            if (externalDirtyRef) externalDirtyRef.current = dirty;
          }}
          onSaved={() => {
            dirtyRef.current = false;
            setEditing(false);
            if (externalDirtyRef) externalDirtyRef.current = false;
            invalidate();
            onUpdated();
          }}
          onCancel={() => guardedAction('close')}
        />
        <DiscardChangesDialog
          open={showDiscard}
          onCancel={cancelDiscard}
          onDiscard={() => {
            handleDiscard();
            if (externalDirtyRef) externalDirtyRef.current = false;
          }}
        />
      </>
    );
  }

  const parentName = entity.parentId ? findCategoryName(tree, entity.parentId) : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">{entity.name}</h3>
        <Can permission="categories.update">
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
            <Pencil />
          </Button>
        </Can>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>{t('common.information')}</SectionLabel>
          <DetailField icon={Tag} label={t('common.name')}>
            {entity.name}
          </DetailField>
          {parentName && (
            <DetailField icon={GitBranch} label={t('catalog.parentCategory')}>
              {parentName}
            </DetailField>
          )}
          {entity.description && (
            <DetailField icon={FileText} label={t('common.description')}>
              {entity.description}
            </DetailField>
          )}
          <DetailField icon={Hash} label={t('common.order')}>
            {entity.sortOrder}
          </DetailField>
          <DetailField icon={Settings} label={t('common.status')}>
            <StateBadge
              state={entity.isActive ? 'active' : 'inactive'}
              label={entity.isActive ? t('common.active') : t('common.inactive')}
            />
          </DetailField>
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel>{t('common.dates')}</SectionLabel>
          <DetailField icon={Calendar} label={t('common.created')}>
            {formatRelativeTime(entity.createdAt)}
          </DetailField>
          <DetailField icon={Calendar} label={t('common.updated')}>
            {formatRelativeTime(entity.updatedAt)}
          </DetailField>
        </div>
      </div>
    </div>
  );
}

function DetailField({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md px-2 py-1.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="w-28 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-sm text-foreground">{children ?? '—'}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </span>
  );
}

// ─── Edit Form ──────────────────────────────────────────────────────────────

interface EditFormProps {
  entity: {
    id: string;
    parentId: string | null;
    name: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
  };
  tree: CategoryTreeResponse[];
  onDirtyChange: (dirty: boolean) => void;
  onSaved: () => void;
  onCancel: () => void;
}

function EditForm({ entity, tree, onDirtyChange, onSaved, onCancel }: EditFormProps) {
  const { t } = useTranslation();
  const excludeIds = useMemo(
    () => [entity.id, ...getDescendantIds(tree, entity.id)],
    [tree, entity.id],
  );
  const { options } = useCategoryOptions(excludeIds);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitted, isValid, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(CategoryEditSchema),
    defaultValues: {
      parentId: entity.parentId ?? undefined,
      name: entity.name,
      description: entity.description ?? '',
      sortOrder: entity.sortOrder,
      isActive: entity.isActive,
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: (values: EditFormValues) =>
      updateCategory(entity.id, {
        name: values.name,
        parentId: values.parentId ?? null,
        description: values.description || undefined,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      toast.success(t('catalog.categoryUpdated'));
      onSaved();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details?.length) {
        for (const detail of err.details) {
          setError(detail.field as keyof EditFormValues, {
            type: 'server',
            message: detail.message,
          });
        }
        return;
      }
      setError('root', { type: 'server', message: getErrorMessage(err) });
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
      className="flex flex-col gap-4 p-4"
    >
      <h3 className="text-base font-medium">{t('catalog.editCategory')}</h3>
      <FieldGroup>
        {errors.root?.message && <FormAlert message={errors.root.message} />}
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="name">
            {t('common.name')}{' '}
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          </FieldLabel>
          <Input
            id="name"
            {...register('name')}
            placeholder={t('catalog.categoryName')}
            maxLength={100}
            disabled={isSubmitting}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </Field>
        <Field data-invalid={errors.parentId ? true : undefined}>
          <FieldLabel htmlFor="parentId">{t('catalog.parentCategory')}</FieldLabel>
          <Controller
            control={control}
            name="parentId"
            render={({ field }) => (
              <Select
                value={field.value ?? '__none__'}
                onValueChange={(v) => field.onChange(v === '__none__' ? undefined : v)}
              >
                <SelectTrigger id="parentId" disabled={isSubmitting}>
                  <SelectValue placeholder={t('common.noParent')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('common.noParent')}</SelectItem>
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
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
          <FieldLabel htmlFor="description">{t('common.description')}</FieldLabel>
          <Textarea
            id="description"
            {...register('description')}
            maxLength={255}
            rows={3}
            disabled={isSubmitting}
          />
          <FieldError>{errors.description?.message}</FieldError>
        </Field>
        <Field data-invalid={errors.sortOrder ? true : undefined}>
          <FieldLabel htmlFor="sortOrder">{t('common.order')}</FieldLabel>
          <Input
            id="sortOrder"
            type="number"
            {...register('sortOrder', {
              setValueAs: (value) => {
                if (value === '' || value == null) return undefined;
                const parsed = Number(value);
                return Number.isFinite(parsed) ? parsed : undefined;
              },
            })}
            min={0}
            disabled={isSubmitting}
          />
          <FieldError>{errors.sortOrder?.message}</FieldError>
        </Field>
        <Field orientation="horizontal">
          <FieldLabel htmlFor="isActive">{t('common.active')}</FieldLabel>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Switch
                id="isActive"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </Field>
      </FieldGroup>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting || (isSubmitted && !isValid)}>
          {isSubmitting && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {t('common.save')}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}
