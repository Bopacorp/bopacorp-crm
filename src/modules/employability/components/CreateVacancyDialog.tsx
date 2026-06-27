import type { CreateJobVacancyRequest } from '@bopacorp/shared/employability';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { queryKeys } from '@/lib/query-keys.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog } from '@/shared/ui';
import { createVacancy } from '../employability.service.js';
import type { VacancyFormValues } from './VacancyForm.js';
import { VacancyForm } from './VacancyForm.js';

interface CreateVacancyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EMPTY_VALUES: VacancyFormValues = {
  title: '',
  description: '',
  requirements: '',
  isActive: true,
  isPublished: false,
  publicationDate: undefined,
  closingDate: undefined,
};

export function CreateVacancyDialog({ open, onOpenChange, onSuccess }: CreateVacancyDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [key, setKey] = useState(0);
  const [error, setError] = useState('');

  const forceClose = useCallback(() => {
    setKey((k) => k + 1);
    setError('');
    onOpenChange(false);
  }, [onOpenChange]);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose: forceClose });

  const mutation = useMutation({
    mutationFn: (data: CreateJobVacancyRequest) => createVacancy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employability.vacancies.all });
      toast.success(t('employability.vacancyCreated'));
      dirtyRef.current = false;
      forceClose();
      onSuccess();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      guardedAction('close');
    } else {
      onOpenChange(true);
    }
  };

  const handleSubmit = (values: VacancyFormValues) => {
    setError('');
    mutation.mutate({
      title: values.title,
      description: values.description,
      requirements: values.requirements,
      isActive: values.isActive,
      isPublished: values.isPublished,
      publicationDate: values.publicationDate,
      closingDate: values.closingDate,
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('employability.newVacancy')}</SheetTitle>
        </SheetHeader>
        <VacancyForm
          key={key}
          defaultValues={EMPTY_VALUES}
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
          error={error}
          submitLabel={t('common.create')}
          onDirtyChange={handleDirtyChange}
        />
      </SheetContent>

      <DiscardChangesDialog open={showDiscard} onCancel={cancelDiscard} onDiscard={handleDiscard} />
    </Sheet>
  );
}
