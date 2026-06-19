import type { UpdateJobVacancyRequest } from '@bopacorp/shared/employability';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, XIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog, ErrorState, SheetDetailSkeleton } from '@/shared/ui';
import { updateVacancy } from '../employability.service.js';
import { useVacancy } from '../hooks/useVacancy.js';
import { DeleteVacancyDialog } from './DeleteVacancyDialog.js';
import type { VacancyFormValues } from './VacancyForm.js';
import { VacancyForm } from './VacancyForm.js';

interface EditVacancySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyId: string | null;
  onSuccess: () => void;
}

export function EditVacancySheet({
  open,
  onOpenChange,
  vacancyId,
  onSuccess,
}: EditVacancySheetProps) {
  const queryClient = useQueryClient();
  const { vacancy, loading, error: queryError, refetch } = useVacancy(vacancyId);
  const [key, setKey] = useState(0);
  const [formError, setFormError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const forceClose = useCallback(() => {
    setKey((k) => k + 1);
    setFormError('');
    onOpenChange(false);
  }, [onOpenChange]);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose: forceClose });

  const mutation = useMutation({
    mutationFn: (data: UpdateJobVacancyRequest) => updateVacancy(vacancyId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employability.vacancies.all });
      toast.success('Vacante actualizada');
      dirtyRef.current = false;
      forceClose();
      onSuccess();
    },
    onError: (err: unknown) => setFormError(getErrorMessage(err)),
  });

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      guardedAction('close');
    } else {
      onOpenChange(true);
    }
  };

  const handleSubmit = (values: VacancyFormValues) => {
    if (!vacancy) return;
    setFormError('');

    const data: UpdateJobVacancyRequest = {};
    if (values.title !== vacancy.title) data.title = values.title;
    if (values.description !== vacancy.description) data.description = values.description;
    if (values.requirements !== vacancy.requirements) data.requirements = values.requirements;
    if (values.isActive !== vacancy.isActive) data.isActive = values.isActive;
    if (values.isPublished !== vacancy.isPublished) data.isPublished = values.isPublished;

    const defaultPublication = vacancy.publicationDate ?? '';
    const defaultClosing = vacancy.closingDate ?? '';
    if (values.publicationDate !== defaultPublication) {
      data.publicationDate = values.publicationDate || undefined;
    }
    if (values.closingDate !== defaultClosing) {
      data.closingDate = values.closingDate || undefined;
    }

    if (values.isPublished && !data.publicationDate && !vacancy.publicationDate) {
      data.publicationDate = new Date().toISOString();
    }

    mutation.mutate(data);
  };

  const defaultValues: VacancyFormValues | null = vacancy
    ? {
        title: vacancy.title,
        description: vacancy.description,
        requirements: vacancy.requirements,
        isActive: vacancy.isActive,
        isPublished: vacancy.isPublished,
        publicationDate: vacancy.publicationDate ?? undefined,
        closingDate: vacancy.closingDate ?? undefined,
      }
    : null;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent showCloseButton={false}>
          <SheetHeader className="flex flex-row items-center justify-between gap-4">
            <SheetTitle className="flex-1 truncate">
              {vacancy ? vacancy.title : 'Editar vacante'}
            </SheetTitle>
            <div className="flex items-center gap-2">
              {vacancy && (
                <Can permission="job_vacancies.delete">
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </Can>
              )}
              <Button variant="ghost" size="icon-sm" onClick={() => guardedAction('close')}>
                <XIcon />
              </Button>
            </div>
          </SheetHeader>

          {loading ? (
            <SheetDetailSkeleton sections={[{ rows: ['w-24', 'w-40', 'w-56', 'w-16', 'w-28'] }]} />
          ) : queryError || !vacancy || !defaultValues ? (
            <ErrorState error={queryError} onRetry={refetch} />
          ) : (
            <VacancyForm
              key={key}
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              isPending={mutation.isPending}
              error={formError}
              submitLabel="Guardar"
              onDirtyChange={handleDirtyChange}
            />
          )}
        </SheetContent>

        <DiscardChangesDialog
          open={showDiscard}
          onCancel={cancelDiscard}
          onDiscard={handleDiscard}
        />
      </Sheet>

      {vacancy && (
        <DeleteVacancyDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          vacancyId={vacancy.id}
          vacancyTitle={vacancy.title}
          onSuccess={() => {
            forceClose();
            onSuccess();
          }}
        />
      )}
    </>
  );
}
