import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { queryKeys } from '@/lib/query-keys.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { removeVacancy } from '../employability.service.js';

interface DeleteVacancyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyId: string;
  vacancyTitle: string;
  onSuccess: () => void;
}

export function DeleteVacancyDialog({
  open,
  onOpenChange,
  vacancyId,
  vacancyTitle,
  onSuccess,
}: DeleteVacancyDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => removeVacancy(vacancyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employability.vacancies.all });
      toast.success('Vacante eliminada');
      onOpenChange(false);
      onSuccess();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar vacante?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará {vacancyTitle}. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Eliminando…
              </>
            ) : (
              'Eliminar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
