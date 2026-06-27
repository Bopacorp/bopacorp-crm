import type { EmployeeResponse } from '@bopacorp/shared/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Settings,
  Trash2,
  User,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { formatDate, formatRelativeTime } from '@/lib/format.js';
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
import { useOrgRoleOptions } from '../hooks/useOrgRoleOptions.js';
import {
  getEmployee,
  listAdvisors,
  listSupervisors,
  removeEmployee,
  updateEmployee,
} from '../org.service.js';

interface EmployeeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

function getInitials(firstName: string | null, lastName: string | null, username: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

function displayName(user: EmployeeResponse['user']): string {
  if (user.profile) return `${user.profile.firstName} ${user.profile.lastName}`;
  return user.username;
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

const SKELETON_SECTIONS = [
  { rows: ['w-28', 'w-40', 'w-16'] },
  { labelWidth: 'w-16', rows: ['w-36', 'w-24', 'w-44'] },
  { labelWidth: 'w-16', rows: ['w-20', 'w-36', 'w-28', 'w-16'] },
];

export function EmployeeSheet({ open, onOpenChange, userId }: EmployeeSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const onClose = useCallback(() => onOpenChange(false), [onOpenChange]);
  const onBack = useCallback(() => setEditing(false), []);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose, onBack });

  const {
    data: employee,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.employees.detail(userId ?? ''),
    queryFn: () => getEmployee(userId as string),
    enabled: !!userId && open,
  });

  const { data: supervisorsData } = useQuery({
    queryKey: queryKeys.employees.supervisors(userId ?? ''),
    queryFn: () => listSupervisors(userId as string, { page: 1, limit: 100, sortOrder: 'asc' }),
    enabled: !!userId && open && employee?.orgRole.code === 'advisor',
  });

  const { data: advisorsData } = useQuery({
    queryKey: queryKeys.employees.advisors(userId ?? ''),
    queryFn: () => listAdvisors(userId as string, { page: 1, limit: 100, sortOrder: 'asc' }),
    enabled:
      !!userId &&
      open &&
      (employee?.orgRole.code === 'supervisor' || employee?.orgRole.code === 'manager'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => removeEmployee(userId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      toast.success(t('org.employeeDeleted'));
      setShowDelete(false);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setShowDelete(false);
    },
  });

  useEffect(() => {
    if (!open) {
      setEditing(false);
      dirtyRef.current = false;
    }
  }, [open, dirtyRef]);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      guardedAction('close');
    } else {
      onOpenChange(true);
    }
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(userId) });
    }
  };

  const showViewHeader = !loading && !error && employee && !editing;

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
              {loading && <SheetTitle className="sr-only">{t('common.loading')}</SheetTitle>}
              {!showViewHeader && !loading && (
                <SheetTitle>{editing ? t('org.editEmployee') : t('org.employee')}</SheetTitle>
              )}
            </div>
            <div className="flex items-center gap-1">
              {showViewHeader && (
                <>
                  <Can permission="employees.update">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
                      <Pencil />
                    </Button>
                  </Can>
                  <Can permission="employees.delete">
                    <Button variant="ghost" size="icon-sm" onClick={() => setShowDelete(true)}>
                      <Trash2 />
                    </Button>
                  </Can>
                </>
              )}
              <Button variant="ghost" size="icon-sm" onClick={() => guardedAction('close')}>
                <XIcon />
              </Button>
            </div>
          </div>
          {loading && (
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          )}
          {showViewHeader && (
            <div className="flex items-center gap-3">
              <Avatar size="lg" className="after:content-none">
                <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
                  {getInitials(
                    employee.user.profile?.firstName ?? null,
                    employee.user.profile?.lastName ?? null,
                    employee.user.username,
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <SheetTitle className="text-lg">{displayName(employee.user)}</SheetTitle>
                <span className="text-xs text-muted-foreground">{employee.orgRole.name}</span>
              </div>
            </div>
          )}
        </SheetHeader>

        {loading ? (
          <SheetDetailSkeleton sections={SKELETON_SECTIONS} />
        ) : error || !employee ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : editing ? (
          <EditForm
            employee={employee}
            onSaved={() => {
              setEditing(false);
              invalidate();
            }}
            onDirtyChange={handleDirtyChange}
          />
        ) : (
          <ViewMode
            employee={employee}
            supervisors={supervisorsData?.data}
            advisees={advisorsData?.data}
          />
        )}
      </SheetContent>

      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />

      <AlertDialog open={showDelete} onOpenChange={(v) => !v && setShowDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('org.deleteEmployee')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('org.deleteEmployeeDesc', {
                name: employee ? displayName(employee.user) : t('org.employee'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t('common.deleting')}
                </>
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

// ─── View Mode ───────────────────────────────────────────────────────────────

interface RelatedPerson {
  id: string;
  username: string;
  email: string;
  profile: { firstName: string; lastName: string } | null;
  orgRole: { id: string; name: string };
}

interface AdvisorSupervisorItem {
  advisor: RelatedPerson;
  supervisor: RelatedPerson;
}

function ViewMode({
  employee,
  supervisors,
  advisees,
}: {
  employee: EmployeeResponse;
  supervisors?: AdvisorSupervisorItem[];
  advisees?: AdvisorSupervisorItem[];
}) {
  const { t } = useTranslation();
  const personName = (u: RelatedPerson) =>
    u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.username;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>{t('org.accountSection')}</SectionLabel>
          <DetailField icon={User} label={t('org.user')}>
            {employee.user.username}
          </DetailField>
          <DetailField icon={Mail} label={t('common.email')}>
            <a href={`mailto:${employee.user.email}`} className="text-primary hover:underline">
              {employee.user.email}
            </a>
          </DetailField>
          <DetailField icon={Settings} label={t('common.status')}>
            <StateBadge
              state={employee.isActive ? 'active' : 'inactive'}
              label={employee.isActive ? t('common.active') : t('common.inactive')}
            />
          </DetailField>
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel>{t('org.orgSection')}</SectionLabel>
          <DetailField icon={Briefcase} label={t('org.orgRole')}>
            {employee.orgRole.name}
          </DetailField>
          <DetailField icon={Building2} label={t('org.department')}>
            {employee.orgRole.department?.name ?? t('org.noDepartment')}
          </DetailField>
          <DetailField icon={MapPin} label={t('org.territory')}>
            {employee.territory ?? '—'}
          </DetailField>
          <DetailField icon={Calendar} label={t('org.hireDate')}>
            {employee.hiredAt ? formatDate(employee.hiredAt) : '—'}
          </DetailField>
        </div>

        {supervisors && supervisors.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionLabel>{t('org.supervisorsSection')}</SectionLabel>
            <div className="flex flex-wrap gap-1.5 px-2">
              {supervisors.map((s) => (
                <Badge key={s.supervisor.id} variant="secondary">
                  {personName(s.supervisor)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {advisees && advisees.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionLabel>{t('org.advisorsInCharge')}</SectionLabel>
            <div className="flex flex-wrap gap-1.5 px-2">
              {advisees.map((a) => (
                <Badge key={a.advisor.id} variant="secondary">
                  {personName(a.advisor)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <SectionLabel>{t('common.dates')}</SectionLabel>
          <DetailField icon={Calendar} label={t('common.created')}>
            {formatRelativeTime(employee.createdAt)}
          </DetailField>
          <DetailField icon={Calendar} label={t('common.updated')}>
            {formatRelativeTime(employee.updatedAt)}
          </DetailField>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Form ───────────────────────────────────────────────────────────────

function EditForm({
  employee,
  onSaved,
  onDirtyChange,
}: {
  employee: EmployeeResponse;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useTranslation();
  const { orgRoleOptions } = useOrgRoleOptions();
  const [orgRoleId, setOrgRoleId] = useState(employee.orgRole.id);
  const [territory, setTerritory] = useState(employee.territory ?? '');
  const [hiredAt, setHiredAt] = useState(employee.hiredAt?.split('T')[0] ?? '');
  const [isActive, setIsActive] = useState(employee.isActive);
  const [formError, setFormError] = useState('');

  const isDirty =
    orgRoleId !== employee.orgRole.id ||
    territory !== (employee.territory ?? '') ||
    hiredAt !== (employee.hiredAt?.split('T')[0] ?? '') ||
    isActive !== employee.isActive;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: () =>
      updateEmployee(employee.userId, {
        orgRoleId,
        territory: territory || null,
        hiredAt: hiredAt || null,
        isActive,
      }),
    onSuccess: () => {
      toast.success(t('org.employeeUpdated'));
      onSaved();
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <FieldGroup>
          {formError && <FormAlert message={formError} />}
          <Field>
            <FieldLabel>{t('org.orgRole')}</FieldLabel>
            <Select value={orgRoleId} onValueChange={setOrgRoleId}>
              <SelectTrigger>
                <SelectValue placeholder={t('org.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                {orgRoleOptions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>{t('org.territory')}</FieldLabel>
            <Input
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              placeholder={t('org.territoryPlaceholder')}
              maxLength={50}
            />
          </Field>
          <Field>
            <FieldLabel>{t('org.hireDate')}</FieldLabel>
            <Input type="date" value={hiredAt} onChange={(e) => setHiredAt(e.target.value)} />
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
          disabled={!isDirty || mutation.isPending}
        >
          {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {t('common.save')}
        </Button>
      </SheetFooter>
    </>
  );
}
