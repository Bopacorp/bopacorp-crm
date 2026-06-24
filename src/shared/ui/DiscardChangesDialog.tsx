import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface DiscardChangesDialogProps {
  open: boolean;
  onDiscard: () => void;
  onCancel: () => void;
}

export function DiscardChangesDialog({ open, onDiscard, onCancel }: DiscardChangesDialogProps) {
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel();
  };

  const handleDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDiscard();
  };

  return (
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogContent onEscapeKeyDown={onCancel}>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
          <AlertDialogDescription>Los cambios no guardados se perderán.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Seguir editando
          </Button>
          <Button type="button" variant="destructive" onClick={handleDiscard}>
            Descartar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
