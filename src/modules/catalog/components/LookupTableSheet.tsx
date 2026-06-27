import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
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
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { formatRelativeTime } from '@/lib/format.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog, ErrorState, SheetDetailSkeleton, StateBadge } from '@/shared/ui';
import type { LookupTableConfig } from './LookupTableManager.js';

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
      dirtyRef.current = false;
      if (isCreate) setFormKey((k) => k + 1);
    }
  }, [open, dirtyRef, isCreate]);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      guardedAction('close');
    } else {
      onOpenChange(true);
    }
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: config.queryKey });
  };

  const showViewHeader = !isCreate && !isLoading && !error && entity && !editing;

  return (
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
                <Can permission={`${config.permissionPrefix}.update`}>
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
                    <Pencil />
                  </Button>
                </Can>
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
              setEditing(false);
              invalidate();
            }}
            onDirtyChange={handleDirtyChange}
          />
        ) : (
          <ViewMode entity={entity} config={config} />
        )}
      </SheetContent>

      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />
    </Sheet>
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

function ViewMode({ entity }: { entity: ViewEntity; config: LookupTableConfig }) {
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
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const isDirty = code !== '' || name !== '' || description !== '';

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: () =>
      config.createFn({ code, name, isActive: true, description: description || undefined }),
    onSuccess: () => {
      toast.success(t('common.entityCreated', { entity: config.entityName }));
      onSuccess();
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const canSubmit = code.trim() !== '' && name.trim() !== '';

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <FieldGroup>
          {formError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}
          <Field>
            <FieldLabel>{t('common.code')}</FieldLabel>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t('common.codePlaceholder')}
              maxLength={30}
            />
          </Field>
          <Field>
            <FieldLabel>{t('common.name')}</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('common.namePlaceholder')}
              maxLength={100}
            />
          </Field>
          <Field>
            <FieldLabel>{t('common.description')}</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('common.descriptionPlaceholder')}
              maxLength={255}
              rows={3}
            />
          </Field>
        </FieldGroup>
      </div>
      <SheetFooter>
        <Button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
        >
          {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {t('common.create')}
        </Button>
      </SheetFooter>
    </>
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
  const [name, setName] = useState(entity.name);
  const [description, setDescription] = useState(entity.description ?? '');
  const [isActive, setIsActive] = useState(entity.isActive);
  const [formError, setFormError] = useState('');

  const isDirty =
    name !== entity.name ||
    description !== (entity.description ?? '') ||
    isActive !== entity.isActive;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: () =>
      config.updateFn(entity.id, {
        name,
        description: description || undefined,
        isActive,
      }),
    onSuccess: () => {
      toast.success(t('common.entityUpdated', { entity: config.entityName }));
      onSaved();
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const canSubmit = name.trim() !== '' && isDirty;

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <FieldGroup>
          {formError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}
          <Field>
            <FieldLabel>{t('common.code')}</FieldLabel>
            <Input value={entity.code} disabled className="font-mono" />
          </Field>
          <Field>
            <FieldLabel>{t('common.name')}</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </Field>
          <Field>
            <FieldLabel>{t('common.description')}</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={255}
              rows={3}
            />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel>{t('common.active')}</FieldLabel>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </Field>
        </FieldGroup>
      </div>
      <SheetFooter>
        <Button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
        >
          {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {t('common.save')}
        </Button>
      </SheetFooter>
    </>
  );
}
