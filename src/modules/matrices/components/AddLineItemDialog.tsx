import { CreateMatrixLineItemRequestSchema } from '@bopacorp/shared/matrices';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { listCatalogItems } from '@/modules/catalog/catalog.service.js';
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert, SearchSelect } from '@/shared/ui';
import { createLineItem } from '../matrices.service.js';

type FormValues = z.input<typeof CreateMatrixLineItemRequestSchema>;

interface AddLineItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matrixId: string;
}

export function AddLineItemDialog({ open, onOpenChange, matrixId }: AddLineItemDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateMatrixLineItemRequestSchema),
    defaultValues: { matrixId, itemId: '', quantity: 1, unitPrice: 0, total: 0 },
    mode: 'onTouched',
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = form;

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

  const watchedItemId = watch('itemId');
  const watchedQuantity = watch('quantity');
  const watchedUnitPrice = watch('unitPrice');
  const total = watchedQuantity * watchedUnitPrice;
  const selectedItem = items.find((i) => i.id === watchedItemId);

  useEffect(() => {
    if (open) {
      reset({ matrixId, itemId: '', quantity: 1, unitPrice: 0, total: 0 });
    }
  }, [open, matrixId, reset]);

  const handleItemChange = (id: string) => {
    setValue('itemId', id, { shouldValidate: true });
    const item = items.find((i) => i.id === id);
    if (item) setValue('unitPrice', item.price);
  };

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      createLineItem(matrixId, { ...data, total: data.quantity * data.unitPrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.lineItems(matrixId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.detail(matrixId) });
      toast.success('Línea agregada');
      onOpenChange(false);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details?.length) {
        for (const d of err.details) {
          setError(d.field as keyof FormValues, { type: 'server', message: d.message });
        }
        return;
      }
      setError('root', { type: 'server', message: getErrorMessage(err) });
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar línea de oferta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errors.root && <FormAlert message={errors.root.message ?? ''} />}

          <FieldGroup>
            <Field data-invalid={errors.itemId ? true : undefined}>
              <FieldLabel>Producto</FieldLabel>
              <Controller
                control={control}
                name="itemId"
                render={({ field }) => (
                  <SearchSelect
                    options={itemOptions}
                    value={field.value}
                    onValueChange={handleItemChange}
                    placeholder="Seleccionar producto"
                    searchPlaceholder="Buscar producto..."
                    emptyMessage="Sin productos"
                  />
                )}
              />
              <FieldError>{errors.itemId?.message}</FieldError>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={errors.quantity ? true : undefined}>
                <FieldLabel>Cantidad</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  {...register('quantity', { valueAsNumber: true })}
                />
                <FieldError>{errors.quantity?.message}</FieldError>
              </Field>
              <Field data-invalid={errors.unitPrice ? true : undefined}>
                <FieldLabel>Precio unitario</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  {...register('unitPrice', { valueAsNumber: true })}
                />
                <FieldError>{errors.unitPrice?.message}</FieldError>
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
