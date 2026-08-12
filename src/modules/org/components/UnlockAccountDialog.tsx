import { UnlockUserRequestSchema } from '@bopacorp/shared/auth';
import { V, vk } from '@bopacorp/shared/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { z } from 'zod';
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
import { unlockUser } from '../users.service.js';

const UnlockAccountFormSchema = UnlockUserRequestSchema.extend({
  reason: UnlockUserRequestSchema.shape.reason
    .trim()
    .min(10, vk(V.MIN_CHARS, { min: 10 }))
    .max(500, vk(V.MAX_CHARS, { max: 500 })),
});

type UnlockAccountFormValues = z.input<typeof UnlockAccountFormSchema>;

interface UnlockAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

export function UnlockAccountDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: UnlockAccountDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const form = useForm<UnlockAccountFormValues>({
    resolver: zodResolver(UnlockAccountFormSchema),
    defaultValues: { reason: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      form.reset({ reason: '' });
      setError('');
    }
  }, [form, open]);

  const mutation = useMutation({
    mutationFn: (data: UnlockAccountFormValues) => unlockUser(userId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lockStatus(userId) });
      toast.success(t(response.unlocked ? 'org.accountUnlocked' : 'org.accountAlreadyUnlocked'));
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => setError(getErrorMessage(err, { CONFLICT: 'org.unlockAccountInactive' })),
  });

  const onSubmit = (values: UnlockAccountFormValues) => {
    setError('');
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('org.unlockAccount')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {error && <FormAlert message={error} />}
          <FieldGroup>
            <Field data-invalid={form.formState.errors.reason ? true : undefined}>
              <FieldLabel htmlFor="unlock-reason">{t('org.unlockReason')}</FieldLabel>
              <Textarea
                id="unlock-reason"
                placeholder={t('org.unlockReasonPlaceholder')}
                disabled={mutation.isPending}
                maxLength={500}
                {...form.register('reason')}
              />
              <FieldError>{form.formState.errors.reason?.message}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {t('org.unlockAccount')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
