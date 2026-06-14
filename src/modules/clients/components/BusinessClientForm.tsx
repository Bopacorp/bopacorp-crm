import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SheetFooter } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { useAdvisors } from '@/modules/org/hooks/useAdvisors.js';
import { FormAlert, SearchSelect } from '@/shared/ui';

export interface BusinessClientFormValues {
  ruc: string;
  businessName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  advisorId: string;
  activeServicesCount: number;
  currentMonthlyBilling: number;
  isActive: boolean;
}

interface BusinessClientFormProps {
  defaultValues: BusinessClientFormValues;
  onSubmit: (values: BusinessClientFormValues) => void;
  isPending: boolean;
  error?: string;
  submitLabel: string;
  rucReadOnly?: boolean;
  showIsActive?: boolean;
}

function employeeName(emp: {
  user: { firstName: string | null; lastName: string | null; username: string };
}) {
  return emp.user.firstName && emp.user.lastName
    ? `${emp.user.firstName} ${emp.user.lastName}`
    : emp.user.username;
}

export function BusinessClientForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  submitLabel,
  rucReadOnly,
  showIsActive,
}: BusinessClientFormProps) {
  const { hasRole } = useAuth();
  const canAssignAdvisor = !hasRole('advisor');
  const { advisors } = useAdvisors();

  const [ruc, setRuc] = useState(defaultValues.ruc);
  const [businessName, setBusinessName] = useState(defaultValues.businessName);
  const [contactName, setContactName] = useState(defaultValues.contactName);
  const [contactPhone, setContactPhone] = useState(defaultValues.contactPhone);
  const [contactEmail, setContactEmail] = useState(defaultValues.contactEmail);
  const [address, setAddress] = useState(defaultValues.address);
  const [advisorId, setAdvisorId] = useState(defaultValues.advisorId);
  const [activeServicesCount, setActiveServicesCount] = useState(defaultValues.activeServicesCount);
  const [currentMonthlyBilling, setCurrentMonthlyBilling] = useState(
    defaultValues.currentMonthlyBilling,
  );
  const [isActive, setIsActive] = useState(defaultValues.isActive);

  const advisorOptions = useMemo(
    () => advisors.map((emp) => ({ value: emp.userId, label: employeeName(emp) })),
    [advisors],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !contactName) return;
    if (!rucReadOnly && !ruc) return;
    onSubmit({
      ruc,
      businessName,
      contactName,
      contactPhone,
      contactEmail,
      address,
      advisorId,
      activeServicesCount,
      currentMonthlyBilling,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {error && <FormAlert message={error} />}

        <FieldGroup>
          <Field>
            <FieldLabel>RUC</FieldLabel>
            {rucReadOnly ? (
              <Input value={ruc} readOnly className="bg-muted" />
            ) : (
              <Input
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                placeholder="0991234567001"
                maxLength={13}
                required
              />
            )}
          </Field>

          <Field>
            <FieldLabel>Nombre comercial</FieldLabel>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </Field>

          <Field>
            <FieldLabel>Contacto</FieldLabel>
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} required />
          </Field>

          <Field>
            <FieldLabel>Teléfono</FieldLabel>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </Field>

          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel>Dirección</FieldLabel>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>

          {canAssignAdvisor && (
            <Field>
              <FieldLabel>Asesor</FieldLabel>
              <SearchSelect
                options={advisorOptions}
                value={advisorId}
                onValueChange={setAdvisorId}
                placeholder="Seleccionar asesor"
                searchPlaceholder="Buscar asesor..."
                emptyMessage="Sin asesores"
              />
            </Field>
          )}

          <Field>
            <FieldLabel>Servicios activos</FieldLabel>
            <Input
              type="number"
              min={0}
              value={activeServicesCount}
              onChange={(e) => setActiveServicesCount(Number(e.target.value))}
            />
          </Field>

          <Field>
            <FieldLabel>Facturación mensual</FieldLabel>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={currentMonthlyBilling}
              onChange={(e) => setCurrentMonthlyBilling(Number(e.target.value))}
            />
          </Field>

          {showIsActive && (
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Activo</FieldLabel>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </Field>
          )}
        </FieldGroup>
      </div>

      <SheetFooter>
        <Button
          type="submit"
          disabled={isPending || !businessName || !contactName || (!rucReadOnly && !ruc)}
        >
          {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  );
}
