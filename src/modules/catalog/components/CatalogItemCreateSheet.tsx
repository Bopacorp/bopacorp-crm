import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
import { createCatalogItem } from '../catalog.service.js';
import { CatalogItemForm, EMPTY_FORM_VALUES, mapFormToRequest } from './CatalogItemForm.js';

interface CatalogItemCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

export function CatalogItemCreateSheet({
  open,
  onOpenChange,
  onCreated,
}: CatalogItemCreateSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formKey, setFormKey] = useState(0);
  const [error, setError] = useState('');

  const forceClose = useCallback(() => {
    onOpenChange(false);
    setFormKey((key) => key + 1);
    setError('');
  }, [onOpenChange]);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose: forceClose });

  useEffect(() => {
    if (!open) {
      dirtyRef.current = false;
      setError('');
    }
  }, [open, dirtyRef]);

  const mutation = useMutation({
    mutationFn: createCatalogItem,
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.items.all });
      toast.success(t('catalog.productCreated'));
      dirtyRef.current = false;
      forceClose();
      onCreated?.(item.id);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      guardedAction('close');
      return;
    }
    onOpenChange(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent showCloseButton={false} className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>{t('catalog.newProduct')}</SheetTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => handleOpenChange(false)}>
                <XIcon />
              </Button>
            </div>
            <SheetDescription className="sr-only">{t('catalog.newProduct')}</SheetDescription>
          </SheetHeader>

          <div className="p-4">
            <CatalogItemForm
              key={formKey}
              defaultValues={EMPTY_FORM_VALUES}
              onSubmit={(values, code) => {
                setError('');
                mutation.mutate(mapFormToRequest(values, code));
              }}
              isPending={mutation.isPending}
              error={error}
              submitLabel={t('common.create')}
              onDirtyChange={handleDirtyChange}
              onCancel={() => guardedAction('close')}
              mode="create"
            />
          </div>
        </SheetContent>
      </Sheet>

      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />
    </>
  );
}
