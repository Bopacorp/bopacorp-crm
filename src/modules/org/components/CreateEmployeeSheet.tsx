import type { EmployeeListItemResponse } from '@bopacorp/shared/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
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
import { queryKeys } from '@/lib/query-keys.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog, FormAlert, SearchSelect } from '@/shared/ui';
import { useRoles } from '../hooks/useRoles.js';
import { assignSupervisors, createEmployee, listEmployees, listOrgRoles } from '../org.service.js';
import { createUser } from '../users.service.js';

interface CreateEmployeeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NONE_VALUE = '__none__';

export function CreateEmployeeSheet({ open, onOpenChange }: CreateEmployeeSheetProps) {
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>Nuevo miembro del equipo</SheetTitle>
        </SheetHeader>
        <CreateForm
          key={formKey}
          onSuccess={() => {
            dirtyRef.current = false;
            onOpenChange(false);
          }}
          onDirtyChange={handleDirtyChange}
        />
      </SheetContent>
      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />
    </Sheet>
  );
}

function CreateForm({
  onSuccess,
  onDirtyChange,
}: {
  onSuccess: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { roles } = useRoles();

  const { data: orgRolesData } = useQuery({
    queryKey: [...queryKeys.orgRoles.all, 'create-options'],
    queryFn: () => listOrgRoles({ page: 1, limit: 100, sortOrder: 'asc', isActive: true }),
    staleTime: 5 * 60_000,
  });
  const orgRoles = orgRolesData?.data ?? [];

  // Account
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState<string>(NONE_VALUE);

  // Personal
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [secondLastName, setSecondLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Org
  const [orgRoleId, setOrgRoleId] = useState<string>(NONE_VALUE);
  const [territory, setTerritory] = useState('');
  const [hiredAt, setHiredAt] = useState('');

  // Supervisors
  const [supervisorIds, setSupervisorIds] = useState<string[]>([]);

  const selectedOrgRole = orgRoles.find((r) => r.id === orgRoleId);
  const isAdvisorRole = selectedOrgRole?.code === 'advisor';

  const { data: supervisorCandidates } = useQuery({
    queryKey: [...queryKeys.employees.all, 'supervisor-candidates'],
    queryFn: () => listEmployees({ page: 1, limit: 100, sortOrder: 'asc', isActive: true }),
    staleTime: 5 * 60_000,
    enabled: isAdvisorRole,
  });

  const supervisorOptions = useMemo(() => {
    if (!supervisorCandidates?.data) return [];
    return supervisorCandidates.data
      .filter(
        (e: EmployeeListItemResponse) =>
          e.orgRole.name.toLowerCase().includes('supervisor') ||
          e.orgRole.name.toLowerCase().includes('gerente'),
      )
      .map((e: EmployeeListItemResponse) => ({
        value: e.userId,
        label: employeeName(e),
      }));
  }, [supervisorCandidates]);

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isDirty =
    username !== '' ||
    email !== '' ||
    password !== '' ||
    firstName !== '' ||
    lastName !== '' ||
    nationalId !== '' ||
    orgRoleId !== NONE_VALUE;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const canSubmit =
    username.trim() !== '' &&
    email.trim() !== '' &&
    password.trim() !== '' &&
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    nationalId.trim() !== '' &&
    roleId !== NONE_VALUE &&
    orgRoleId !== NONE_VALUE;

  const handleSubmit = async () => {
    setFormError('');
    setSubmitting(true);
    try {
      const userResult = await createUser({
        username,
        email,
        password,
        isActive: true,
        profile: {
          firstName,
          lastName,
          secondName: secondName || undefined,
          secondLastName: secondLastName || undefined,
          nationalId,
          phone: phone || undefined,
          address: address || undefined,
        },
        roleIds: [roleId],
      });

      await createEmployee({
        userId: userResult.id,
        orgRoleId,
        territory: territory || undefined,
        hiredAt: hiredAt || undefined,
        isActive: true,
      });

      if (isAdvisorRole && supervisorIds.length > 0) {
        await assignSupervisors(userResult.id, { supervisorIds });
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('Miembro del equipo creado');
      onSuccess();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const addSupervisor = (id: string) => {
    if (id && id !== NONE_VALUE && !supervisorIds.includes(id)) {
      setSupervisorIds((prev) => [...prev, id]);
    }
  };

  const removeSupervisor = (id: string) => {
    setSupervisorIds((prev) => prev.filter((s) => s !== id));
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-6">
          {formError && <FormAlert message={formError} />}

          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Cuenta de usuario
            </span>
            <FieldGroup>
              <Field>
                <FieldLabel>Nombre de usuario *</FieldLabel>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="jdoe"
                  maxLength={50}
                />
              </Field>
              <Field>
                <FieldLabel>Email *</FieldLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                />
              </Field>
              <Field>
                <FieldLabel>Contraseña *</FieldLabel>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-1/2 right-1 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </Field>
              <Field>
                <FieldLabel>Rol de acceso *</FieldLabel>
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE} disabled>
                      Seleccionar rol
                    </SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Información personal
            </span>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Primer nombre *</FieldLabel>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={50}
                  />
                </Field>
                <Field>
                  <FieldLabel>Segundo nombre</FieldLabel>
                  <Input
                    value={secondName}
                    onChange={(e) => setSecondName(e.target.value)}
                    maxLength={50}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Primer apellido *</FieldLabel>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={50}
                  />
                </Field>
                <Field>
                  <FieldLabel>Segundo apellido</FieldLabel>
                  <Input
                    value={secondLastName}
                    onChange={(e) => setSecondLastName(e.target.value)}
                    maxLength={50}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel>Cédula / ID nacional *</FieldLabel>
                <Input
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="0900000000"
                  maxLength={20}
                />
              </Field>
              <Field>
                <FieldLabel>Teléfono</FieldLabel>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+593 9XX XXX XXXX"
                  maxLength={20}
                />
              </Field>
              <Field>
                <FieldLabel>Dirección</FieldLabel>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={200}
                />
              </Field>
            </FieldGroup>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Datos organizacionales
            </span>
            <FieldGroup>
              <Field>
                <FieldLabel>Rol organizacional *</FieldLabel>
                <Select value={orgRoleId} onValueChange={setOrgRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE} disabled>
                      Seleccionar rol
                    </SelectItem>
                    {orgRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                        {r.department ? ` — ${r.department.name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {selectedOrgRole?.department && (
                <Field>
                  <FieldLabel>Departamento</FieldLabel>
                  <Input value={selectedOrgRole.department.name} disabled />
                </Field>
              )}
              <Field>
                <FieldLabel>Territorio</FieldLabel>
                <Input
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  placeholder="Zona o territorio asignado"
                  maxLength={100}
                />
              </Field>
              <Field>
                <FieldLabel>Fecha de contratación</FieldLabel>
                <Input type="date" value={hiredAt} onChange={(e) => setHiredAt(e.target.value)} />
              </Field>
            </FieldGroup>
          </div>

          {isAdvisorRole && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Supervisores
              </span>
              <FieldGroup>
                <Field>
                  <FieldLabel>Asignar supervisores</FieldLabel>
                  <SearchSelect
                    options={supervisorOptions.filter((o) => !supervisorIds.includes(o.value))}
                    value=""
                    onValueChange={addSupervisor}
                    placeholder="Seleccionar supervisor"
                    searchPlaceholder="Buscar supervisor..."
                    emptyMessage="Sin supervisores disponibles"
                  />
                </Field>
                {supervisorIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {supervisorIds.map((id) => {
                      const opt = supervisorOptions.find((o) => o.value === id);
                      return (
                        <Badge key={id} variant="secondary" className="gap-1 pr-1">
                          {opt?.label ?? id}
                          <button
                            type="button"
                            onClick={() => removeSupervisor(id)}
                            className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </FieldGroup>
            </div>
          )}
        </div>
      </div>
      <SheetFooter>
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting}>
          {submitting && <Loader2 data-icon="inline-start" className="animate-spin" />}
          Crear miembro
        </Button>
      </SheetFooter>
    </>
  );
}

function employeeName(emp: EmployeeListItemResponse) {
  const { firstName, lastName, username } = emp.user;
  return firstName && lastName ? `${firstName} ${lastName}` : username;
}
