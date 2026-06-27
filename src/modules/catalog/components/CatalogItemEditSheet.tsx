import type { CatalogItemResponse } from '@bopacorp/shared/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { queryKeys } from '@/lib/query-keys.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog } from '@/shared/ui';
import { updateCatalogItem } from '../catalog.service.js';
import { CatalogItemForm, mapFormToRequest, mapResponseToFormValues } from './CatalogItemForm.js';

interface CatalogItemEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CatalogItemResponse;
  onSuccess: () => void;
}

export function CatalogItemEditSheet({
  open,
  onOpenChange,
  item,
  onSuccess,
}: CatalogItemEditSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [key, setKey] = useState(0);
  const [error, setError] = useState('');

  const forceClose = useCallback(() => {
    onOpenChange(false);
    setKey((k) => k + 1);
    setError('');
  }, [onOpenChange]);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose: forceClose });

  const mutation = useMutation({
    mutationFn: (data: ReturnType<typeof mapFormToRequest>) => updateCatalogItem(item.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.items.detail(item.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.items.all });
      toast.success(t('catalog.productUpdated'));
      dirtyRef.current = false;
      forceClose();
      onSuccess();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      guardedAction('close');
    } else {
      onOpenChange(true);
    }
  };

  const defaultValues = mapResponseToFormValues(item);

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          showCloseButton={false}
          className="data-[side=right]:sm:max-w-3xl overflow-y-auto"
        >
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>{t('catalog.editProduct')}</SheetTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => handleOpenChange(false)}>
                <XIcon />
              </Button>
            </div>
            <SheetDescription className="sr-only">{t('catalog.editProductDesc')}</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <CatalogItemForm
              key={key}
              defaultValues={defaultValues}
              onSubmit={(values, code) => {
                setError('');
                mutation.mutate(mapFormToRequest(values, code));
              }}
              isPending={mutation.isPending}
              error={error}
              submitLabel={t('common.save')}
              onDirtyChange={handleDirtyChange}
              onCancel={() => guardedAction('close')}
              mode="edit"
            />
          </div>
        </SheetContent>
      </Sheet>
      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />
    </>
  );
}
