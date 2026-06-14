import type { BusinessClientResponse } from '@bopacorp/shared/crm';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { createBusinessClient } from '../clients.service.js';

interface CreateBusinessClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (client: BusinessClientResponse) => void;
}

export function CreateBusinessClientDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateBusinessClientDialogProps) {
  const { user } = useAuth();

  const [ruc, setRuc] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
  const [activeServicesCount, setActiveServicesCount] = useState(0);
  const [currentMonthlyBilling, setCurrentMonthlyBilling] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setRuc('');
    setBusinessName('');
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setAddress('');
    setActiveServicesCount(0);
    setCurrentMonthlyBilling(0);
    setError('');
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruc || !businessName || !contactName) return;

    setSubmitting(true);
    setError('');
    try {
      const client = await createBusinessClient({
        advisorId: user?.id,
        ruc,
        businessName,
        contactName,
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
        address: address || undefined,
        activeServicesCount,
        currentMonthlyBilling,
        isActive: true,
      });
      toast.success('Cliente creado');
      handleOpenChange(false);
      onSuccess(client);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <FormAlert message={error} />}

          <FieldGroup>
            <Field>
              <FieldLabel>RUC</FieldLabel>
              <Input
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                placeholder="0991234567001"
                maxLength={13}
                required
              />
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
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
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
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !ruc || !businessName || !contactName}>
              {submitting && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
