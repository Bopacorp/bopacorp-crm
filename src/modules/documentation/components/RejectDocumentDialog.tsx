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
  const [error, setError] = useState('');
  const rejectFormSchema = useMemo(() => createRejectFormSchema(), []);

  const form = useForm<RejectFormValues>({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: { coordinatorMessage: '' },
    mode: 'onTouched',
  });

  const forceClose = useCallback(() => {
    form.reset({ coordinatorMessage: '' });
    setError('');
    onOpenChange(false);
  }, [form, onOpenChange]);

  const { dirtyRef, showDiscard, guardedAction, handleDiscard, cancelDiscard } = useUnsavedGuard({
    onClose: forceClose,
  });

  useEffect(() => {
    if (open) {
      form.reset({ coordinatorMessage: '' });
      setError('');
    } else {
      form.reset({ coordinatorMessage: '' });
      setError('');
      dirtyRef.current = false;
    }
  }, [open, form, dirtyRef]);

  const mutation = useMutation({
    mutationFn: (data: RejectFormValues) =>
      changeDocumentState(documentId, {
        state: 'REJECTED',
        coordinatorMessage: data.coordinatorMessage || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      toast.success(t('documentation.documentRejected'));
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {error && <FormAlert message={error} />}

            <FieldGroup>
              <Field data-invalid={form.formState.errors.coordinatorMessage ? true : undefined}>
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
                  disabled={mutation.isPending}
                  {...form.register('coordinatorMessage')}
                />
                {form.formState.errors.coordinatorMessage && (
                  <FieldError>{form.formState.errors.coordinatorMessage.message}</FieldError>
                )}
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => guardedAction('close')}>
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={
                  mutation.isPending ||
                  form.formState.isSubmitting ||
                  (form.formState.isSubmitted && !form.formState.isValid)
                }
              >
                {mutation.isPending && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                {isRejected ? t('common.save') : t('common.reject')}
              </Button>
            </DialogFooter>
          </form>
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
