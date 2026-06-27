import { ChangeNegotiationStateRequestSchema } from '@bopacorp/shared/crm';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileUp, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/lib/query-keys.js';
import { listDocuments } from '@/modules/documentation/documentation.service.js';
import { useActiveDocumentTypes } from '@/modules/documentation/hooks/useDocumentTypes.js';
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { useNegotiationStates } from '../hooks/useNegotiationStates.js';
import { changeNegotiationState, closeWithDocuments } from '../negotiations.service.js';

type FormValues = z.input<typeof ChangeNegotiationStateRequestSchema>;

interface ChangeStateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiationId: string;
  currentStateId: string;
  targetStateId?: string;
  onSuccess: () => void;
}

const MAX_FILE_SIZE_MB = 50;
const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

export function ChangeStateDialog({
  open,
  onOpenChange,
  negotiationId,
  currentStateId,
  targetStateId,
  onSuccess,
}: ChangeStateDialogProps) {
  const { t } = useTranslation();
  const { states } = useNegotiationStates();
  const queryClient = useQueryClient();
  const availableStates = states.filter((s) => s.id !== currentStateId);

  const suggestedId = useMemo(() => {
    const current = states.find((s) => s.id === currentStateId);
    return states.find((s) => s.position === (current?.position ?? 0) + 1)?.id ?? '';
  }, [states, currentStateId]);

  const effectiveStateId = targetStateId ?? suggestedId;
  const isLocked = !!targetStateId;
  const targetStateName = states.find((s) => s.id === targetStateId)?.name;

  const deniedId = useMemo(() => states.find((s) => s.code === 'denied')?.id, [states]);
  const closingId = useMemo(() => states.find((s) => s.code === 'closing')?.id, [states]);

  const stateAwareSchema = useMemo(() => {
    return ChangeNegotiationStateRequestSchema.superRefine((data, ctx) => {
      if (data.stateId === deniedId && !data.notes?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['notes'],
          message: t('negotiations.notesRequiredForDenied'),
        });
      }
    });
  }, [deniedId, t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(stateAwareSchema),
    defaultValues: { stateId: effectiveStateId, notes: '' },
    mode: 'onTouched',
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitted, isValid },
  } = form;

  const selectedStateId = watch('stateId');
  const isDenied = selectedStateId === deniedId;
  const isClosing = selectedStateId === closingId;

  // --- Mandatory document upload for closing ---
  const allDocTypes = useActiveDocumentTypes();
  const mandatoryDocTypes = useMemo(
    () => allDocTypes.filter((dt) => dt.isMandatory),
    [allDocTypes],
  );

  const { data: existingDocs } = useQuery({
    queryKey: [...queryKeys.documents.all, negotiationId],
    queryFn: () => listDocuments({ negotiationId, page: 1, limit: 100, sortOrder: 'desc' }),
    enabled: isClosing,
  });

  const existingDocTypeIds = useMemo(
    () => new Set(existingDocs?.data.map((d) => d.documentType.id) ?? []),
    [existingDocs],
  );

  const missingDocTypes = useMemo(
    () => mandatoryDocTypes.filter((dt) => !existingDocTypeIds.has(dt.id)),
    [mandatoryDocTypes, existingDocTypeIds],
  );

  const [docFiles, setDocFiles] = useState<Map<string, File>>(new Map());

  const setFileForType = useCallback((docTypeId: string, file: File | undefined) => {
    setDocFiles((prev) => {
      const next = new Map(prev);
      if (file) {
        next.set(docTypeId, file);
      } else {
        next.delete(docTypeId);
      }
      return next;
    });
  }, []);

  const allMandatoryDocsCovered = !isClosing || missingDocTypes.every((dt) => docFiles.has(dt.id));

  useEffect(() => {
    if (open) {
      reset({ stateId: effectiveStateId, notes: '' });
      setDocFiles(new Map());
    }
  }, [open, effectiveStateId, reset]);

  const handleMutationSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.negotiations.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    toast.success(t('negotiations.stateUpdated'));
    onOpenChange(false);
    onSuccess();
  }, [queryClient, t, onOpenChange, onSuccess]);

  const handleMutationError = useCallback(
    (err: Error) => {
      if (err instanceof ApiError && err.details?.length) {
        for (const d of err.details) {
          setError(d.field as keyof FormValues, { type: 'server', message: d.message });
        }
        return;
      }
      setError('root', { type: 'server', message: getErrorMessage(err) });
    },
    [setError],
  );

  const stateMutation = useMutation({
    mutationFn: (data: FormValues) => changeNegotiationState(negotiationId, data),
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  const closeMutation = useMutation({
    mutationFn: ({ notes }: { notes?: string }) =>
      closeWithDocuments(negotiationId, docFiles, notes),
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  const onSubmit = (data: FormValues) => {
    if (isClosing && docFiles.size > 0) {
      closeMutation.mutate({ notes: data.notes || undefined });
      return;
    }

    stateMutation.mutate({ stateId: data.stateId, notes: data.notes || undefined });
  };

  const isBusy = stateMutation.isPending || closeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isLocked ? t('negotiations.confirmStateChange') : t('negotiations.changeState')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errors.root && <FormAlert message={errors.root.message ?? ''} />}

          <FieldGroup>
            <Field data-invalid={errors.stateId ? true : undefined}>
              <FieldLabel htmlFor="change-state-id">{t('negotiations.newState')}</FieldLabel>
              {isLocked ? (
                <Input
                  id="change-state-id"
                  value={targetStateName ?? ''}
                  readOnly
                  className="bg-muted"
                />
              ) : (
                <Controller
                  control={control}
                  name="stateId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="change-state-id">
                        <SelectValue placeholder={t('negotiations.selectState')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStates.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              <FieldError>{errors.stateId?.message}</FieldError>
            </Field>

            <Field data-invalid={errors.notes ? true : undefined}>
              <FieldLabel htmlFor="change-state-notes">
                {isDenied ? t('negotiations.changeNotesRequired') : t('negotiations.changeNotes')}
              </FieldLabel>
              <Textarea
                id="change-state-notes"
                {...register('notes', {
                  setValueAs: (value) => (value === '' || value == null ? undefined : value),
                })}
                placeholder={t('negotiations.changeNotesPlaceholder')}
              />
              <FieldError>{errors.notes?.message}</FieldError>
            </Field>

            {isClosing && mandatoryDocTypes.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">{t('negotiations.mandatoryDocuments')}</p>
                {missingDocTypes.length > 0 ? (
                  <>
                    <p className="text-muted-foreground text-xs">
                      {t('negotiations.mandatoryDocsRequired')}
                    </p>
                    {missingDocTypes.map((docType) => (
                      <DocFileInput
                        key={docType.id}
                        label={docType.name}
                        file={docFiles.get(docType.id)}
                        onFileChange={(file) => setFileForType(docType.id, file)}
                        disabled={isBusy}
                      />
                    ))}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t('negotiations.allDocsUploaded')}
                  </p>
                )}
              </div>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isBusy || (isSubmitted && !isValid) || !allMandatoryDocsCovered}
            >
              {isBusy && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {closeMutation.isPending
                ? t('negotiations.uploadingDocuments')
                : isLocked
                  ? t('common.confirm')
                  : t('negotiations.change')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DocFileInput({
  label,
  file,
  onFileChange,
  disabled,
}: {
  label: string;
  file: File | undefined;
  onFileChange: (file: File | undefined) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const inputId = `doc-file-${label.replace(/\s+/g, '-').toLowerCase()}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size / (1024 * 1024) > MAX_FILE_SIZE_MB) {
      return;
    }
    onFileChange(selected);
  };

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      {!file ? (
        <div className="rounded-lg border border-dashed border-border p-4">
          <label htmlFor={inputId} className="flex cursor-pointer flex-col items-center gap-1">
            <FileUp className="size-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t('documentation.fileSelect')}</span>
          </label>
          <Input
            id={inputId}
            type="file"
            className="hidden"
            accept={ACCEPTED_FILE_TYPES}
            disabled={disabled}
            onChange={handleChange}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border p-2">
          <span className="truncate text-sm">{file.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onFileChange(undefined)}
            disabled={disabled}
            aria-label={t('documentation.removeFile')}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
    </Field>
  );
}
