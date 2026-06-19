import type { JobVacancyResponse, UpdateJobVacancyRequest } from '@bopacorp/shared/employability';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  FileText,
  Pencil,
  Settings,
  Trash2,
  User,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatDate, formatRelativeTime } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard.js';
import { DiscardChangesDialog, ErrorState, SheetDetailSkeleton, StateBadge } from '@/shared/ui';
import { updateVacancy } from '../employability.service.js';
import { useVacancy } from '../hooks/useVacancy.js';
import { DeleteVacancyDialog } from './DeleteVacancyDialog.js';
import type { VacancyFormValues } from './VacancyForm.js';
import { VacancyForm } from './VacancyForm.js';

interface VacancySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyId: string | null;
  onSuccess: () => void;
}

function DetailField({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md px-2 py-1.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="w-28 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-sm text-foreground">{children ?? '—'}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </span>
  );
}

const SKELETON_SECTIONS = [
  { rows: ['w-36', 'w-full', 'w-full'] },
  { rows: ['w-20', 'w-20'] },
  { rows: ['w-28', 'w-28'] },
  { rows: ['w-24', 'w-32', 'w-32'] },
];

function ViewMode({ vacancy }: { vacancy: JobVacancyResponse }) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>Información</SectionLabel>
          <DetailField icon={Briefcase} label="Título">
            {vacancy.title}
          </DetailField>
          <DetailField icon={FileText} label="Descripción">
            <span className="whitespace-pre-wrap">{vacancy.description}</span>
          </DetailField>
          <DetailField icon={FileText} label="Requisitos">
            <span className="whitespace-pre-wrap">{vacancy.requirements}</span>
          </DetailField>
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel>Estado</SectionLabel>
          <DetailField icon={Settings} label="Activa">
            <StateBadge
              state={vacancy.isActive ? 'active' : 'inactive'}
              label={vacancy.isActive ? 'Activa' : 'Inactiva'}
            />
          </DetailField>
          <DetailField icon={Settings} label="Publicada">
            <StateBadge
              state={vacancy.isPublished ? 'published' : 'draft'}
              label={vacancy.isPublished ? 'Publicada' : 'Borrador'}
            />
          </DetailField>
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel>Fechas</SectionLabel>
          <DetailField icon={Calendar} label="Publicación">
            {vacancy.publicationDate ? formatDate(vacancy.publicationDate) : '—'}
          </DetailField>
          <DetailField icon={Calendar} label="Cierre">
            {vacancy.closingDate ? formatDate(vacancy.closingDate) : '—'}
          </DetailField>
        </div>

        <div className="flex flex-col gap-1">
          <SectionLabel>Auditoría</SectionLabel>
          <DetailField icon={User} label="Creador">
            {vacancy.creator.username}
          </DetailField>
          <DetailField icon={Calendar} label="Creado">
            {formatRelativeTime(vacancy.createdAt)}
          </DetailField>
          <DetailField icon={Calendar} label="Actualizado">
            {formatRelativeTime(vacancy.updatedAt)}
          </DetailField>
        </div>
      </div>
    </div>
  );
}

export function VacancySheet({ open, onOpenChange, vacancyId, onSuccess }: VacancySheetProps) {
  const queryClient = useQueryClient();
  const { vacancy, loading, error: queryError, refetch } = useVacancy(vacancyId);
  const [editing, setEditing] = useState(false);
  const [key, setKey] = useState(0);
  const [formError, setFormError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const onClose = useCallback(() => {
    setKey((k) => k + 1);
    setFormError('');
    onOpenChange(false);
  }, [onOpenChange]);

  const onBack = useCallback(() => setEditing(false), []);

  const { dirtyRef, showDiscard, handleDirtyChange, guardedAction, handleDiscard, cancelDiscard } =
    useUnsavedGuard({ onClose, onBack });

  const mutation = useMutation({
    mutationFn: (data: UpdateJobVacancyRequest) => updateVacancy(vacancyId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employability.vacancies.all });
      toast.success('Vacante actualizada');
      dirtyRef.current = false;
      setEditing(false);
      refetch();
      onSuccess();
    },
    onError: (err: unknown) => setFormError(getErrorMessage(err)),
  });

  useEffect(() => {
    if (!open) {
      setEditing(false);
      dirtyRef.current = false;
    }
  }, [open, dirtyRef]);

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

  const showViewHeader = !loading && !queryError && vacancy && !editing;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent showCloseButton={false}>
          <SheetHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {editing && (
                <Button variant="ghost" size="icon-sm" onClick={() => guardedAction('back')}>
                  <ArrowLeft />
                </Button>
              )}
              {loading && <SheetTitle className="sr-only">Vacante</SheetTitle>}
              {showViewHeader && (
                <SheetTitle className="flex-1 truncate">{vacancy.title}</SheetTitle>
              )}
              {!showViewHeader && !loading && (
                <SheetTitle>{editing ? 'Editar vacante' : 'Vacante'}</SheetTitle>
              )}
            </div>
            <div className="flex items-center gap-1">
              {showViewHeader && (
                <>
                  <Can permission="job_vacancies.update">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
                      <Pencil />
                    </Button>
                  </Can>
                  <Can permission="job_vacancies.delete">
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteOpen(true)}>
                      <Trash2 />
                    </Button>
                  </Can>
                </>
              )}
              <Button variant="ghost" size="icon-sm" onClick={() => guardedAction('close')}>
                <XIcon />
              </Button>
            </div>
          </SheetHeader>

          {loading ? (
            <SheetDetailSkeleton sections={SKELETON_SECTIONS} />
          ) : queryError || !vacancy || (!editing && !vacancy) ? (
            <ErrorState error={queryError} onRetry={refetch} />
          ) : editing && defaultValues ? (
            <VacancyForm
              key={key}
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              isPending={mutation.isPending}
              error={formError}
              submitLabel="Guardar"
              onDirtyChange={handleDirtyChange}
            />
          ) : (
            <ViewMode vacancy={vacancy} />
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
            onClose();
            onSuccess();
          }}
        />
      )}
    </>
  );
}
