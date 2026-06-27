import { CreateItemTypeRequestSchema } from '@bopacorp/shared/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Code,
  FileText,
  Loader2,
  Pencil,
  Settings,
  Tag,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { formatRelativeTime } from '@/lib/format.js';
import { Can } from '@/modules/auth/components/Can.js';
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import {
  DiscardChangesDialog,
  ErrorState,
  FormAlert,
  SheetDetailSkeleton,
  StateBadge,
} from '@/shared/ui';
import type { LookupTableConfig } from './LookupTableManager';

type FormValues = z.input<typeof CreateItemTypeRequestSchema>;

interface LookupTableSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string | null;
  config: LookupTableConfig;
  mode: 'create' | 'view';
}

const SKELETON_SECTIONS = [{ rows: ['w-24', 'w-40', 'w-56', 'w-16', 'w-28'] }];

export function LookupTableSheet({
  open,
  onOpenChange,
  entityId,
  config,
  mode: initialMode,
}: LookupTableSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [showDisable, setShowDisable] = useState(false);
  const isCreate = initialMode === 'create';

  const onClose = useCallback(() => onOpenChange(false), [onOpenChange]);
  const onBack = useCallback(() => setEditing(false), []);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose, onBack });

  const {
    data: entity,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...config.queryKey, 'detail', entityId],
    queryFn: () => config.getFn(entityId as string),
    enabled: !!entityId && open,
  });

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setShowDisable(false);
      dirtyRef.current = false;
      if (isCreate) setFormKey((k) => k + 1);
    }
  }, [open, dirtyRef, isCreate]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: config.queryKey });
  };

  const disableMutation = useMutation({
    mutationFn: () => config.disableFn(entityId as string),
    onSuccess: () => {
      toast.success(t('common.entityDisabled', { entity: config.entityName }));
      setShowDisable(false);
      invalidate();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setShowDisable(false);
    },
  });

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      guardedAction('close');
    } else {
      onOpenChange(true);
    }
  };

  const showViewHeader = !isCreate && !isLoading && !error && entity && !editing;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent showCloseButton={false}>
          <SheetHeader className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {editing && (
                  <Button variant="ghost" size="icon-sm" onClick={() => guardedAction('back')}>
                    <ArrowLeft />
                  </Button>
                )}
                <SheetTitle>
                  {isCreate
                    ? t('common.newEntity', { entity: config.entityName.toLowerCase() })
                    : editing
                      ? t('common.editEntity', { entity: config.entityName.toLowerCase() })
                      : isLoading
                        ? config.entityName
                        : (entity?.name ?? config.entityName)}
                </SheetTitle>
              </div>
              <div className="flex items-center gap-1">
                {showViewHeader && (
                  <>
                    <Can permission={`${config.permissionPrefix}.update`}>
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
                        <Pencil />
                      </Button>
                    </Can>
                    {entity?.isActive && (
                      <Can permission={`${config.permissionPrefix}.update`}>
                        <Button variant="ghost" size="icon-sm" onClick={() => setShowDisable(true)}>
                          <AlertTriangle />
                        </Button>
                      </Can>
                    )}
                  </>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => guardedAction('close')}>
                  <XIcon />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {isCreate ? (
            <CreateForm
              key={formKey}
              config={config}
              onSuccess={() => {
                dirtyRef.current = false;
                invalidate();
                onOpenChange(false);
              }}
              onDirtyChange={handleDirtyChange}
            />
          ) : isLoading ? (
            <SheetDetailSkeleton sections={SKELETON_SECTIONS} />
          ) : error || !entity ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : editing ? (
            <EditForm
              entity={entity}
              config={config}
              onSaved={() => {
                dirtyRef.current = false;
                setEditing(false);
                invalidate();
              }}
              onDirtyChange={handleDirtyChange}
            />
          ) : (
            <ViewMode entity={entity} />
          )}
        </SheetContent>

        <DiscardChangesDialog
          open={showDiscard}
          onCancel={cancelDiscard}
          onDiscard={handleDiscard}
        />
      </Sheet>

      <AlertDialog open={showDisable} onOpenChange={setShowDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.disableEntity', { entity: config.entityName.toLowerCase() })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.disableEntityDesc', { entity: config.entityName.toLowerCase() })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disableMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={disableMutation.isPending}
              onClick={() => disableMutation.mutate()}
            >
              {disableMutation.isPending && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              {t('common.disable')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── View Mode ───────────────────────────────────────────────────────────────

interface ViewEntity {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function ViewMode({ entity }: { entity: ViewEntity }) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>{t('common.information')}</SectionLabel>
          <DetailField icon={Code} label={t('common.code')}>
            <span className="font-mono text-xs">{entity.code}</span>
          </DetailField>
          <DetailField icon={Tag} label={t('common.name')}>
            {entity.name}
          </DetailField>
          {entity.description && (
            <DetailField icon={FileText} label={t('common.description')}>
              {entity.description}
            </DetailField>
          )}
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
      <span className="w-24 shrink-0 text-sm text-muted-foreground">{label}</span>
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

// ─── Create Form ─────────────────────────────────────────────────────────────

function CreateForm({
  config,
  onSuccess,
  onDirtyChange,
}: {
  config: LookupTableConfig;
  onSuccess: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitted, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateItemTypeRequestSchema),
    defaultValues: { code: '', name: '', description: '', isActive: true },
    mode: 'onTouched',
  });

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      config.createFn({
        code: values.code.toUpperCase(),
        name: values.name,
        description: values.description || undefined,
        isActive: values.isActive ?? true,
      }),
    onSuccess: () => {
      toast.success(t('common.entityCreated', { entity: config.entityName }));
      onSuccess();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details?.length) {
        for (const detail of err.details) {
          setError(detail.field as keyof FormValues, { type: 'server', message: detail.message });
        }
        return;
      }
      setError('root', { type: 'server', message: getErrorMessage(err) });
    },
  });

  const isBusy = mutation.isPending;

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex-1 overflow-y-auto p-4">
        <FieldGroup>
          {errors.root?.message && <FormAlert message={errors.root.message} />}
          <Field data-invalid={errors.code ? true : undefined}>
            <FieldLabel htmlFor="code">
              {t('common.code')}{' '}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </FieldLabel>
            <Input
              id="code"
              {...register('code', {
                setValueAs: (value) => String(value ?? '').toUpperCase(),
              })}
              placeholder={t('common.codePlaceholder')}
              maxLength={30}
              disabled={isBusy}
            />
            <FieldError>{errors.code?.message}</FieldError>
          </Field>
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
              placeholder={t('common.namePlaceholder')}
              maxLength={100}
              disabled={isBusy}
            />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
          <Field data-invalid={errors.description ? true : undefined}>
            <FieldLabel htmlFor="description">{t('common.description')}</FieldLabel>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('common.descriptionPlaceholder')}
              maxLength={255}
              rows={3}
              disabled={isBusy}
            />
            <FieldError>{errors.description?.message}</FieldError>
          </Field>
        </FieldGroup>
      </div>
      <SheetFooter>
        <Button type="submit" disabled={isBusy || (isSubmitted && !isValid)}>
          {isBusy && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {t('common.create')}
        </Button>
      </SheetFooter>
    </form>
  );
}

// ─── Edit Form ───────────────────────────────────────────────────────────────

function EditForm({
  entity,
  config,
  onSaved,
  onDirtyChange,
}: {
  entity: ViewEntity;
  config: LookupTableConfig;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useTranslation();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitted, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateItemTypeRequestSchema),
    defaultValues: {
      code: entity.code,
      name: entity.name,
      description: entity.description ?? '',
      isActive: entity.isActive,
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      config.updateFn(entity.id, {
        name: values.name,
        description: values.description || undefined,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      toast.success(t('common.entityUpdated', { entity: config.entityName }));
      onSaved();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details?.length) {
        for (const detail of err.details) {
          setError(detail.field as keyof FormValues, { type: 'server', message: detail.message });
        }
        return;
      }
      setError('root', { type: 'server', message: getErrorMessage(err) });
    },
  });

  const isBusy = mutation.isPending;

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex-1 overflow-y-auto p-4">
        <FieldGroup>
          {errors.root?.message && <FormAlert message={errors.root.message} />}
          <Field>
            <FieldLabel htmlFor="code">{t('common.code')}</FieldLabel>
            <Input id="code" value={entity.code} disabled className="font-mono" />
          </Field>
          <Field data-invalid={errors.name ? true : undefined}>
            <FieldLabel htmlFor="name">
              {t('common.name')}{' '}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </FieldLabel>
            <Input id="name" {...register('name')} maxLength={100} disabled={isBusy} />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
          <Field data-invalid={errors.description ? true : undefined}>
            <FieldLabel htmlFor="description">{t('common.description')}</FieldLabel>
            <Textarea
              id="description"
              {...register('description')}
              maxLength={255}
              rows={3}
              disabled={isBusy}
            />
            <FieldError>{errors.description?.message}</FieldError>
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
                  disabled={isBusy}
                />
              )}
            />
          </Field>
        </FieldGroup>
      </div>
      <SheetFooter>
        <Button type="submit" disabled={isBusy || (isSubmitted && !isValid)}>
          {isBusy && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {t('common.save')}
        </Button>
      </SheetFooter>
    </form>
  );
}
