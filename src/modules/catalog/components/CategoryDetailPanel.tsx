import type { CategoryTreeResponse } from '@bopacorp/shared/catalog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { formatRelativeTime } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog, ErrorState, StateBadge } from '@/shared/ui';
import { disableCategory, getCategory, updateCategory } from '../catalog.service.js';
import { useCategoryOptions } from '../hooks/useCategoryOptions.js';

interface CategoryDetailPanelProps {
  categoryId: string;
  tree: CategoryTreeResponse[];
  onUpdated: () => void;
  dirtyRef?: React.MutableRefObject<boolean>;
}

function getDescendantIds(tree: CategoryTreeResponse[], targetId: string): string[] {
  const ids: string[] = [];
  function find(nodes: CategoryTreeResponse[]): boolean {
    for (const node of nodes) {
      if (node.id === targetId) {
        collectAll(node.children);
        return true;
      }
      if (find(node.children)) return true;
    }
    return false;
  }
  function collectAll(nodes: CategoryTreeResponse[]) {
    for (const node of nodes) {
      ids.push(node.id);
      collectAll(node.children);
    }
  }
  find(tree);
  return ids;
}

function findCategoryName(tree: CategoryTreeResponse[], id: string): string | null {
  for (const node of tree) {
    if (node.id === id) return node.name;
    const found = findCategoryName(node.children, id);
    if (found) return found;
  }
  return null;
}

export function CategoryDetailPanel({
  categoryId,
  tree,
  onUpdated,
  dirtyRef: externalDirtyRef,
}: CategoryDetailPanelProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const prevCategoryIdRef = useRef(categoryId);

  const onClose = useCallback(() => setEditing(false), []);
  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose });

  useEffect(() => {
    if (externalDirtyRef) {
      externalDirtyRef.current = dirtyRef.current;
    }
  });

  const {
    data: entity,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...queryKeys.catalog.categories.all, 'detail', categoryId],
    queryFn: () => getCategory(categoryId),
    enabled: !!categoryId,
  });

  if (prevCategoryIdRef.current !== categoryId) {
    prevCategoryIdRef.current = categoryId;
    if (editing) {
      setEditing(false);
      dirtyRef.current = false;
      if (externalDirtyRef) externalDirtyRef.current = false;
    }
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.catalog.categories.all });
  };

  const disableMutation = useMutation({
    mutationFn: () => disableCategory(categoryId),
    onSuccess: () => {
      toast.success(entity?.isActive ? 'Categoría desactivada' : 'Categoría activada');
      invalidate();
      onUpdated();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={`sk-${String(i)}`} className="flex items-start gap-3 px-2 py-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !entity) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  if (editing) {
    return (
      <>
        <EditForm
          entity={entity}
          tree={tree}
          onDirtyChange={(dirty) => {
            handleDirtyChange(dirty);
            if (externalDirtyRef) externalDirtyRef.current = dirty;
          }}
          onSaved={() => {
            setEditing(false);
            if (externalDirtyRef) externalDirtyRef.current = false;
            invalidate();
            onUpdated();
          }}
          onCancel={() => guardedAction('close')}
        />
        <DiscardChangesDialog
          open={showDiscard}
          onCancel={cancelDiscard}
          onDiscard={() => {
            handleDiscard();
            if (externalDirtyRef) externalDirtyRef.current = false;
          }}
        />
      </>
    );
  }

  const parentName = entity.parentId ? findCategoryName(tree, entity.parentId) : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">{entity.name}</h3>
        <Can permission="categories.update">
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
            <Pencil />
          </Button>
        </Can>
      </div>

      <div className="flex flex-col gap-3">
        <DetailRow label="Nombre">{entity.name}</DetailRow>
        <DetailRow label="Categoría padre">{parentName ?? '— (raíz)'}</DetailRow>
        <DetailRow label="Descripción">{entity.description || '—'}</DetailRow>
        <DetailRow label="Orden">{entity.sortOrder}</DetailRow>
        <DetailRow label="Estado">
          <StateBadge
            state={entity.isActive ? 'active' : 'inactive'}
            label={entity.isActive ? 'Activo' : 'Inactivo'}
          />
        </DetailRow>
        <DetailRow label="Creado">{formatRelativeTime(entity.createdAt)}</DetailRow>
        <DetailRow label="Actualizado">{formatRelativeTime(entity.updatedAt)}</DetailRow>
      </div>

      <Can permission="categories.delete">
        <div className="pt-2">
          <Button
            variant={entity.isActive ? 'destructive' : 'secondary'}
            size="sm"
            onClick={() => disableMutation.mutate()}
            disabled={disableMutation.isPending}
          >
            {disableMutation.isPending && <Loader2 className="animate-spin" />}
            {entity.isActive ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      </Can>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-2 py-1.5">
      <span className="w-32 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-sm text-foreground">{children}</span>
    </div>
  );
}

// ─── Edit Form ──────────────────────────────────────────────────────────────

interface EditFormProps {
  entity: {
    id: string;
    parentId: string | null;
    name: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
  };
  tree: CategoryTreeResponse[];
  onDirtyChange: (dirty: boolean) => void;
  onSaved: () => void;
  onCancel: () => void;
}

function EditForm({ entity, tree, onDirtyChange, onSaved, onCancel }: EditFormProps) {
  const [name, setName] = useState(entity.name);
  const [parentId, setParentId] = useState(entity.parentId ?? '');
  const [description, setDescription] = useState(entity.description ?? '');
  const [sortOrder, setSortOrder] = useState(String(entity.sortOrder));
  const [isActive, setIsActive] = useState(entity.isActive);
  const [formError, setFormError] = useState('');

  const excludeIds = useMemo(
    () => [entity.id, ...getDescendantIds(tree, entity.id)],
    [tree, entity.id],
  );
  const { options } = useCategoryOptions(excludeIds);

  const isDirty =
    name !== entity.name ||
    parentId !== (entity.parentId ?? '') ||
    description !== (entity.description ?? '') ||
    sortOrder !== String(entity.sortOrder) ||
    isActive !== entity.isActive;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: () =>
      updateCategory(entity.id, {
        name,
        parentId: parentId || null,
        description: description || undefined,
        sortOrder: Number(sortOrder),
        isActive,
      }),
    onSuccess: () => {
      toast.success('Categoría actualizada');
      onSaved();
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const canSubmit = name.trim() !== '' && isDirty;

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-base font-medium">Editar categoría</h3>
      <FieldGroup>
        {formError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {formError}
          </div>
        )}
        <Field>
          <FieldLabel>Nombre</FieldLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
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
                <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
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
      <div className="flex items-center gap-2">
        <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
          {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          Guardar
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
