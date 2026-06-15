import type { CategoryResponse } from '@bopacorp/shared/catalog';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog } from '@/shared/ui';
import { createCategory } from '../catalog.service.js';
import { useCategoryOptions } from '../hooks/useCategoryOptions.js';

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}

export function CreateCategoryDialog({ open, onOpenChange, onCreated }: CreateCategoryDialogProps) {
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
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
          </DialogHeader>
          <CreateForm
            key={formKey}
            onDirtyChange={handleDirtyChange}
            onSuccess={(id) => {
              dirtyRef.current = false;
              onCreated(id);
              onOpenChange(false);
            }}
          />
        </DialogContent>
      </Dialog>
      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />
    </>
  );
}

function CreateForm({
  onDirtyChange,
  onSuccess,
}: {
  onDirtyChange: (dirty: boolean) => void;
  onSuccess: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const { options } = useCategoryOptions();

  const isDirty = name !== '' || parentId !== '' || description !== '' || sortOrder !== '0';

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: () =>
      createCategory({
        name,
        parentId: parentId || undefined,
        description: description || undefined,
        sortOrder: Number(sortOrder),
        isActive,
      }),
    onSuccess: (data: CategoryResponse) => {
      toast.success('Categoría creada');
      onSuccess(data.id);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const canSubmit = name.trim() !== '';

  return (
    <>
      <div className="flex flex-col gap-4 px-4">
        <FieldGroup>
          {formError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}
          <Field>
            <FieldLabel>Nombre</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la categoría"
              maxLength={100}
            />
          </Field>
          <Field>
            <FieldLabel>Categoría padre</FieldLabel>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin padre (raíz)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin padre (raíz)</SelectItem>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Descripción</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional"
              maxLength={255}
              rows={3}
            />
          </Field>
          <Field>
            <FieldLabel>Orden</FieldLabel>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              min={0}
            />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel>Activo</FieldLabel>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </Field>
        </FieldGroup>
      </div>
      <DialogFooter>
        <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
          {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          Crear
        </Button>
      </DialogFooter>
    </>
  );
}
