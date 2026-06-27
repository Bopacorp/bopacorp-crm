import type { DocumentState } from '@bopacorp/shared/documents';
import { ChangeDocumentStateRequestSchema } from '@bopacorp/shared/documents';
import { V, vk } from '@bopacorp/shared/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field.js';
import { Textarea } from '@/components/ui/textarea.js';
import { queryKeys } from '@/lib/query-keys.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog, FormAlert } from '@/shared/ui';
import { changeDocumentState } from '../documentation.service.js';

function createRejectFormSchema() {
  return ChangeDocumentStateRequestSchema.omit({ state: true }).extend({
    coordinatorMessage: z
      .string()
      .min(1, V.REQUIRED)
      .max(1000, vk(V.MAX_CHARS, { max: 1000 })),
  });
}

type RejectFormValues = z.input<ReturnType<typeof createRejectFormSchema>>;

interface RejectDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  currentState: DocumentState;
  onSuccess?: () => void;
}

export function RejectDocumentDialog({
  open,
  onOpenChange,
  documentId,
  currentState,
  onSuccess,
}: RejectDocumentDialogProps) {
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
    mutationFn: (data: RejectFormValues) =>
      changeDocumentState(documentId, {
        state: 'REJECTED',
        coordinatorMessage: data.coordinatorMessage || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      toast.success(t('documentation.documentRejected'));
      dirtyRef.current = false;
      forceClose();
      onSuccess?.();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const onSubmit = (values: RejectFormValues) => {
    setError('');
    mutation.mutate(values);
  };

  const isRejected = currentState === 'REJECTED';

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) {
            guardedAction('close');
          } else {
            onOpenChange(true);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRejected
                ? t('documentation.changeDocumentState')
                : t('documentation.rejectDocument')}
            </DialogTitle>
          </DialogHeader>
          <RejectForm
            key={key}
            onSubmit={onSubmit}
            isPending={mutation.isPending}
            error={error}
            isRejected={isRejected}
            onDirtyChange={handleDirtyChange}
            onCancel={() => guardedAction('close')}
          />
        </DialogContent>
      </Dialog>
      <DiscardChangesDialog
        open={showDiscard}
        onCancel={cancelDiscard}
        onDiscard={() => {
          dirtyRef.current = false;
          handleDiscard();
        }}
      />
    </>
  );
}

interface RejectFormProps {
  onSubmit: (values: RejectFormValues) => void;
  isPending: boolean;
  error: string;
  isRejected: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onCancel: () => void;
}

function RejectForm({
  onSubmit,
  isPending,
  error,
  isRejected,
  onDirtyChange,
  onCancel,
}: RejectFormProps) {
  const { t } = useTranslation();
  const rejectFormSchema = useMemo(() => createRejectFormSchema(), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitted, isSubmitting, isValid },
  } = useForm<RejectFormValues>({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: { coordinatorMessage: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {error && <FormAlert message={error} />}

      <FieldGroup>
        <Field data-invalid={errors.coordinatorMessage ? true : undefined}>
          <FieldLabel htmlFor="coordinatorMessage">
            {t('documentation.coordinatorNotes')}
          </FieldLabel>
          <Textarea
            id="coordinatorMessage"
            placeholder={
              isRejected
                ? t('documentation.changeReasonPlaceholder')
                : t('documentation.rejectReasonPlaceholder')
            }
            disabled={isPending}
            {...register('coordinatorMessage')}
          />
          {errors.coordinatorMessage && (
            <FieldError>{errors.coordinatorMessage.message}</FieldError>
          )}
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isPending || isSubmitting || (isSubmitted && !isValid)}>
          {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {isRejected ? t('common.save') : t('common.reject')}
        </Button>
      </DialogFooter>
    </form>
  );
}
