import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar vacante</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          ¿Eliminar la vacante <span className="font-medium text-foreground">{vacancyTitle}</span>?
          Esta acción no se puede deshacer.
        </DialogDescription>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
