import type { VisitListItemResponse } from '@bopacorp/shared/crm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/lib/query-keys.js';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { deleteVisit, verifyVisit } from '../negotiations.service.js';

interface VisitActionsProps {
  visit: VisitListItemResponse;
  onSuccess?: () => void;
}

type ActionState = 'idle' | 'loading' | 'success';

export function VisitActions({ visit, onSuccess }: VisitActionsProps) {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const [menuOpen, setMenuOpen] = useState(false);
  const [verifyState, setVerifyState] = useState<ActionState>('idle');
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [supervisorComment, setSupervisorComment] = useState('');

  const canVerify = hasPermission('visits.verify') && !visit.isVerified;
  const canDelete = hasPermission('visits.delete');

  const verifyMutation = useMutation({
    mutationFn: () =>
      verifyVisit(visit.id, {
        isVerified: true,
        supervisorComment: supervisorComment || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
      setVerifyOpen(false);
      setSupervisorComment('');
      setVerifyState('success');
      setTimeout(() => setVerifyState('idle'), 1500);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setVerifyState('idle');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVisit(visit.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
      toast.success('Visita eliminada');
      setDeleteOpen(false);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setDeleteOpen(false);
    },
  });

  const handleVerifyClick = () => {
    setMenuOpen(false);
    setVerifyOpen(true);
  };

  const handleDeleteClick = () => {
    setMenuOpen(false);
    setDeleteOpen(true);
  };

  const hasActions = canVerify || canDelete;

  if (!hasActions && verifyState === 'idle') return null;

  return (
    <div role="none" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {verifyState === 'loading' || verifyState === 'success' ? (
        <Button size="sm" variant="outline" disabled>
          {verifyState === 'loading' && (
            <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
          )}
          {verifyState === 'success' && (
            <CheckCircle data-icon="inline-start" className="size-4 text-green-600" />
          )}
          {verifyState === 'success' ? 'Verificada' : 'Verificando'}
        </Button>
      ) : (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <MoreHorizontal data-icon="inline-start" className="size-4" />
              Acciones
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canVerify && (
              <DropdownMenuItem onClick={handleVerifyClick}>
                <CheckCircle className="size-4" />
                Verificar
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem onClick={handleDeleteClick} variant="destructive">
                <Trash2 className="size-4" />
                Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <AlertDialog
        open={verifyOpen}
        onOpenChange={(v) => {
          if (!v) {
            setVerifyOpen(false);
            setSupervisorComment('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verificar visita</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma que esta visita fue realizada correctamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              value={supervisorComment}
              onChange={(e) => setSupervisorComment(e.target.value)}
              placeholder="Comentario del supervisor (opcional)"
              maxLength={1000}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={verifyMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setVerifyState('loading');
                verifyMutation.mutate();
              }}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Verificando…
                </>
              ) : (
                'Verificar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={(v) => !v && setDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar visita?</AlertDialogTitle>
            <AlertDialogDescription>
              La visita será eliminada permanentemente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
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
    </div>
  );
}
