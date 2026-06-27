import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Code,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { formatRelativeTime } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import {
  DiscardChangesDialog,
  ErrorState,
  FormAlert,
  SheetDetailSkeleton,
  StateBadge,
} from '@/shared/ui';
import { createOrgRole, getOrgRole, listDepartments, updateOrgRole } from '../org.service.js';

interface OrgRoleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string | null;
  mode: 'create' | 'view';
}

const SKELETON_SECTIONS = [{ rows: ['w-24', 'w-40', 'w-56', 'w-32', 'w-16', 'w-28'] }];
const NONE_VALUE = '__none__';

function useDepartmentOptions() {
  const { data } = useQuery({
    queryKey: [...queryKeys.departments.all, 'select-options'],
    queryFn: () => listDepartments({ page: 1, limit: 100, sortOrder: 'asc', isActive: true }),
    staleTime: 5 * 60_000,
  });
  return data?.data ?? [];
}

export function OrgRoleSheet({
  open,
  onOpenChange,
  entityId,
  mode: initialMode,
}: OrgRoleSheetProps) {
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
    queryKey: [...queryKeys.orgRoles.all, 'detail', entityId],
    queryFn: () => getOrgRole(entityId as string),
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
    queryClient.invalidateQueries({ queryKey: queryKeys.orgRoles.all });
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
                  ? t('org.newOrgRole')
                  : editing
                    ? t('org.editOrgRole')
                    : isLoading
                      ? t('org.orgRoleSingular')
                      : (entity?.name ?? t('org.orgRoleSingular'))}
              </SheetTitle>
            </div>
            <div className="flex items-center gap-1">
              {showViewHeader && (
                <Can permission="org_roles.update">
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
              setEditing(false);
              invalidate();
            }}
            onDirtyChange={handleDirtyChange}
          />
        ) : (
          <ViewMode entity={entity} />
        )}
      </SheetContent>

      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />
    </Sheet>
  );
}

// ─── View Mode ───────────────────────────────────────────────────────────────

interface OrgRoleEntity {
  id: string;
  code: string;
  name: string;
  department: { id: string; code: string; name: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

function ViewMode({ entity }: { entity: OrgRoleEntity }) {
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
          <DetailField icon={Building2} label={t('org.department')}>
            {entity.department?.name ?? '—'}
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

// ─── Create Form ─────────────────────────────────────────────────────────────

function CreateForm({
  onSuccess,
  onDirtyChange,
}: {
  onSuccess: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useTranslation();
  const departments = useDepartmentOptions();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<string>(NONE_VALUE);
  const [formError, setFormError] = useState('');

  const isDirty = code !== '' || name !== '' || departmentId !== NONE_VALUE;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: () =>
      createOrgRole({
        code,
        name,
        isActive: true,
        departmentId: departmentId === NONE_VALUE ? undefined : departmentId,
      }),
    onSuccess: () => {
      toast.success(t('org.orgRoleCreated'));
      onSuccess();
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const canSubmit = code.trim() !== '' && name.trim() !== '';

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <FieldGroup>
          {formError && <FormAlert message={formError} />}
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
              placeholder={t('org.roleName')}
              maxLength={30}
            />
          </Field>
          <Field>
            <FieldLabel>{t('org.department')}</FieldLabel>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder={t('org.noDepartment')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{t('org.noDepartment')}</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
  onSaved,
  onDirtyChange,
}: {
  entity: OrgRoleEntity;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useTranslation();
  const departments = useDepartmentOptions();
  const [name, setName] = useState(entity.name);
  const [departmentId, setDepartmentId] = useState<string>(entity.department?.id ?? NONE_VALUE);
  const [isActive, setIsActive] = useState(entity.isActive);
  const [formError, setFormError] = useState('');

  const isDirty =
    name !== entity.name ||
    departmentId !== (entity.department?.id ?? NONE_VALUE) ||
    isActive !== entity.isActive;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: () =>
      updateOrgRole(entity.id, {
        name,
        departmentId: departmentId === NONE_VALUE ? null : departmentId,
        isActive,
      }),
    onSuccess: () => {
      toast.success(t('org.orgRoleUpdated'));
      onSaved();
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const canSubmit = name.trim() !== '' && isDirty;

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <FieldGroup>
          {formError && <FormAlert message={formError} />}
          <Field>
            <FieldLabel>{t('common.code')}</FieldLabel>
            <Input value={entity.code} disabled className="font-mono" />
          </Field>
          <Field>
            <FieldLabel>{t('common.name')}</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
          </Field>
          <Field>
            <FieldLabel>{t('org.department')}</FieldLabel>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder={t('org.noDepartment')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{t('org.noDepartment')}</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
