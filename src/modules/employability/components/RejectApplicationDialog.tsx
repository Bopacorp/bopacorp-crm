import { V, vk } from '@bopacorp/shared/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { FormAlert } from '@/shared/ui';
import { updateJobApplication } from '../employability.service.js';

const RejectApplicationFormSchema = z.object({
  reviewNotes: z
    .string()
    .min(1, V.REQUIRED)
    .max(1000, vk(V.MAX_CHARS, { max: 1000 })),
});

type RejectApplicationFormValues = z.input<typeof RejectApplicationFormSchema>;

interface RejectApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  onSuccess?: () => void;
}

export function RejectApplicationDialog({
  open,
  onOpenChange,
  applicationId,
  onSuccess,
}: RejectApplicationDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const form = useForm<RejectApplicationFormValues>({
    resolver: zodResolver(RejectApplicationFormSchema),
    defaultValues: { reviewNotes: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      form.reset({ reviewNotes: '' });
      setError('');
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (data: RejectApplicationFormValues) =>
      updateJobApplication(applicationId, { state: 'REJECTED', reviewNotes: data.reviewNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employability.applications.all });
      toast.success(t('employability.applicationRejected'));
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const onSubmit = (values: RejectApplicationFormValues) => {
    setError('');
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('employability.rejectApplication')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {error && <FormAlert message={error} />}

          <FieldGroup>
            <Field data-invalid={form.formState.errors.reviewNotes ? true : undefined}>
              <FieldLabel>{t('employability.rejectReason')}</FieldLabel>
              <Textarea
                placeholder={t('employability.reviewNotesPlaceholder')}
                disabled={mutation.isPending}
                {...form.register('reviewNotes')}
              />
              {form.formState.errors.reviewNotes && (
                <FieldError>{form.formState.errors.reviewNotes.message}</FieldError>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {t('common.reject')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
