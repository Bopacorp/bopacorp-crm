import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { formatCurrency } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { listCatalogItems } from '@/modules/catalog/catalog.service.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert, SearchSelect } from '@/shared/ui';
import { createLineItem } from '../matrices.service.js';

interface AddLineItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matrixId: string;
}

export function AddLineItemDialog({ open, onOpenChange, matrixId }: AddLineItemDialogProps) {
  const queryClient = useQueryClient();
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [error, setError] = useState('');

  const { data: catalogData } = useQuery({
    queryKey: queryKeys.catalog.items.list(1, { isActive: true, limit: 100 }),
    queryFn: () => listCatalogItems({ isActive: true, limit: 100, page: 1, sortOrder: 'asc' }),
    enabled: open,
  });

  const items = catalogData?.data ?? [];

  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        value: item.id,
        label: `${item.name} — ${item.category.name} — ${formatCurrency(item.price)}`,
      })),
    [items],
  );

  const selectedItem = items.find((i) => i.id === itemId);

  const total = quantity * unitPrice;

  useEffect(() => {
    if (open) {
      setItemId('');
      setQuantity(1);
      setUnitPrice(0);
      setError('');
    }
  }, [open]);

  const handleItemChange = (id: string) => {
    setItemId(id);
    const item = items.find((i) => i.id === id);
    if (item) setUnitPrice(item.price);
  };

  const mutation = useMutation({
    mutationFn: () =>
      createLineItem(matrixId, {
        matrixId,
        itemId,
        quantity,
        unitPrice,
        total,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.lineItems(matrixId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.detail(matrixId) });
      toast.success('Línea agregada');
      onOpenChange(false);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) return;
    setError('');
    mutation.mutate();
  };

  const canSubmit = itemId && quantity >= 1 && unitPrice >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar línea de oferta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <FormAlert message={error} />}

          <FieldGroup>
            <Field>
              <FieldLabel>Producto</FieldLabel>
              <SearchSelect
                options={itemOptions}
                value={itemId}
                onValueChange={handleItemChange}
                placeholder="Seleccionar producto"
                searchPlaceholder="Buscar producto..."
                emptyMessage="Sin productos"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Cantidad</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number.parseInt(e.target.value, 10) || 1)}
                />
              </Field>
              <Field>
                <FieldLabel>Precio unitario</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number.parseFloat(e.target.value) || 0)}
                />
              </Field>
            </div>

            {selectedItem && (
              <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-sm font-semibold">{formatCurrency(total)}</span>
              </div>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || !canSubmit}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
