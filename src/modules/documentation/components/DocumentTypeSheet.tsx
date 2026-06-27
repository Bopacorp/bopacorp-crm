import {
  CreateDocumentTypeRequestSchema,
  type DocumentTypeResponse,
} from '@bopacorp/shared/documents';
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
  ShieldCheck,
  Tag,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { z } from 'zod';
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
import { queryKeys } from '@/lib/query-keys.js';
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
import {
  createDocumentType,
  disableDocumentType,
  getDocumentType,
  updateDocumentType,
} from '../documentation.service.js';

type FormValues = z.input<typeof CreateDocumentTypeRequestSchema>;

interface DocumentTypeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string | null;
  mode: 'create' | 'view';
}

const SKELETON_SECTIONS = [{ rows: ['w-24', 'w-40', 'w-56', 'w-16', 'w-28'] }];

export function DocumentTypeSheet({
  open,
  onOpenChange,
  entityId,
  mode: initialMode,
}: DocumentTypeSheetProps) {
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
    queryKey: queryKeys.documents.types.detail(entityId as string),
    queryFn: () => getDocumentType(entityId as string),
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
    queryClient.invalidateQueries({ queryKey: queryKeys.documents.types.all });
  };

  const disableMutation = useMutation({
    mutationFn: () => disableDocumentType(entityId as string),
    onSuccess: () => {
      toast.success(t('common.entityDisabled', { entity: t('documentation.types.singular') }));
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
                    ? t('common.newEntity', {
                        entity: t('documentation.types.singular').toLowerCase(),
                      })
                    : editing
                      ? t('common.editEntity', {
                          entity: t('documentation.types.singular').toLowerCase(),
                        })
                      : isLoading
                        ? t('documentation.types.singular')
                        : (entity?.name ?? t('documentation.types.singular'))}
                </SheetTitle>
              </div>
              <div className="flex items-center gap-1">
                {showViewHeader && (
                  <>
                    <Can permission="document_types.update">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
                        <Pencil />
                      </Button>
                    </Can>
                    {entity?.isActive && (
                      <Can permission="document_types.update">
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
              {t('common.disableEntity', {
                entity: t('documentation.types.singular').toLowerCase(),
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.disableEntityDesc', {
                entity: t('documentation.types.singular').toLowerCase(),
              })}
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

function ViewMode({ entity }: { entity: DocumentTypeResponse }) {
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
          <DetailField icon={ShieldCheck} label={t('documentation.types.isMandatory')}>
            <StateBadge
              state={entity.isMandatory ? 'mandatory' : 'optional'}
              label={
                entity.isMandatory
                  ? t('documentation.types.mandatory')
                  : t('documentation.types.optional')
              }
            />
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
  onSuccess,
  onDirtyChange,
}: {
  onSuccess: () => void;
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
    resolver: zodResolver(CreateDocumentTypeRequestSchema),
    defaultValues: { code: '', name: '', description: '', isMandatory: false, isActive: true },
    mode: 'onTouched',
  });

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createDocumentType({
        code: values.code.toUpperCase(),
        name: values.name,
        description: values.description || undefined,
        isMandatory: values.isMandatory ?? false,
        isActive: values.isActive ?? true,
      }),
    onSuccess: () => {
      toast.success(t('common.entityCreated', { entity: t('documentation.types.singular') }));
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
            <FieldLabel htmlFor="dt-code">
              {t('common.code')}{' '}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </FieldLabel>
            <Input
              id="dt-code"
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
            <FieldLabel htmlFor="dt-name">
              {t('common.name')}{' '}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </FieldLabel>
            <Input
              id="dt-name"
              {...register('name')}
              placeholder={t('common.namePlaceholder')}
              maxLength={50}
              disabled={isBusy}
            />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
          <Field data-invalid={errors.description ? true : undefined}>
            <FieldLabel htmlFor="dt-description">{t('common.description')}</FieldLabel>
            <Textarea
              id="dt-description"
              {...register('description')}
              placeholder={t('common.descriptionPlaceholder')}
              maxLength={255}
              rows={3}
              disabled={isBusy}
            />
            <FieldError>{errors.description?.message}</FieldError>
          </Field>
          <Field orientation="horizontal">
            <div className="flex flex-col gap-0.5">
              <FieldLabel htmlFor="dt-isMandatory">
                {t('documentation.types.isMandatory')}
              </FieldLabel>
              <span className="text-xs text-muted-foreground">
                {t('documentation.types.isMandatoryHint')}
              </span>
            </div>
            <Controller
              control={control}
              name="isMandatory"
              render={({ field }) => (
                <Switch
                  id="dt-isMandatory"
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
          {t('common.create')}
        </Button>
      </SheetFooter>
    </form>
  );
}

// ─── Edit Form ───────────────────────────────────────────────────────────────

function EditForm({
  entity,
  onSaved,
  onDirtyChange,
}: {
  entity: DocumentTypeResponse;
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
    resolver: zodResolver(CreateDocumentTypeRequestSchema),
    defaultValues: {
      code: entity.code,
      name: entity.name,
      description: entity.description ?? '',
      isMandatory: entity.isMandatory,
      isActive: entity.isActive,
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateDocumentType(entity.id, {
        name: values.name,
        description: values.description || undefined,
        isMandatory: values.isMandatory,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      toast.success(t('common.entityUpdated', { entity: t('documentation.types.singular') }));
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
            <FieldLabel htmlFor="dt-code">{t('common.code')}</FieldLabel>
            <Input id="dt-code" value={entity.code} disabled className="font-mono" />
          </Field>
          <Field data-invalid={errors.name ? true : undefined}>
            <FieldLabel htmlFor="dt-name">
              {t('common.name')}{' '}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </FieldLabel>
            <Input id="dt-name" {...register('name')} maxLength={50} disabled={isBusy} />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
          <Field data-invalid={errors.description ? true : undefined}>
            <FieldLabel htmlFor="dt-description">{t('common.description')}</FieldLabel>
            <Textarea
              id="dt-description"
              {...register('description')}
              maxLength={255}
              rows={3}
              disabled={isBusy}
            />
            <FieldError>{errors.description?.message}</FieldError>
          </Field>
          <Field orientation="horizontal">
            <div className="flex flex-col gap-0.5">
              <FieldLabel htmlFor="dt-isMandatory">
                {t('documentation.types.isMandatory')}
              </FieldLabel>
              <span className="text-xs text-muted-foreground">
                {t('documentation.types.isMandatoryHint')}
              </span>
            </div>
            <Controller
              control={control}
              name="isMandatory"
              render={({ field }) => (
                <Switch
                  id="dt-isMandatory"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isBusy}
                />
              )}
            />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="dt-isActive">{t('common.active')}</FieldLabel>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  id="dt-isActive"
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
