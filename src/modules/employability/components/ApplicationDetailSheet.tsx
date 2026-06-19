import {
  Briefcase,
  Calendar,
  Download,
  FileText,
  Mail,
  Pencil,
  Settings,
  User,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/format.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { ErrorState, SheetDetailSkeleton, StateBadge } from '@/shared/ui';
import { downloadCandidateResume } from '../employability.service.js';
import { useJobApplication } from '../hooks/useJobApplication.js';
import { applicationStateLabel, applicationStateVariant } from '../lib/state.js';
import { ChangeApplicationStateDialog } from './ChangeApplicationStateDialog.js';

interface ApplicationDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string | null;
  onSuccess: () => void;
}

const SKELETON_SECTIONS = [
  { rows: ['w-28', 'w-40'] },
  { rows: ['w-36'] },
  { rows: ['w-24', 'w-32', 'w-28', 'w-40'] },
  { rows: ['w-24', 'w-16'] },
];

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

export function ApplicationDetailSheet({
  open,
  onOpenChange,
  applicationId,
  onSuccess,
}: ApplicationDetailSheetProps) {
  const { application, loading, error, refetch } = useJobApplication(applicationId);
  const [changeStateOpen, setChangeStateOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!application?.resume) return;
    setDownloading(true);
    try {
      await downloadCandidateResume(application.resume.id, application.resume.filename);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const candidateName = application
    ? `${application.candidate.firstName} ${application.candidate.lastName}`
    : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent showCloseButton={false}>
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>{loading ? 'Aplicación' : (candidateName ?? 'Aplicación')}</SheetTitle>
              <div className="flex items-center gap-1">
                {!loading && application && (
                  <Can permission="job_applications.update">
                    <Button variant="ghost" size="icon-sm" onClick={() => setChangeStateOpen(true)}>
                      <Pencil />
                    </Button>
                  </Can>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
                  <XIcon />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {loading ? (
            <SheetDetailSkeleton sections={SKELETON_SECTIONS} />
          ) : error || !application ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <SectionLabel>Candidato</SectionLabel>
                  <DetailField icon={User} label="Nombre">
                    {application.candidate.firstName} {application.candidate.lastName}
                  </DetailField>
                  <DetailField icon={Mail} label="Email">
                    <a
                      href={`mailto:${application.candidate.email}`}
                      className="text-primary hover:underline"
                    >
                      {application.candidate.email}
                    </a>
                  </DetailField>
                </div>

                <div className="flex flex-col gap-1">
                  <SectionLabel>Vacante</SectionLabel>
                  <DetailField icon={Briefcase} label="Título">
                    {application.vacancy.title}
                  </DetailField>
                </div>

                <div className="flex flex-col gap-1">
                  <SectionLabel>Aplicación</SectionLabel>
                  <DetailField icon={Settings} label="Estado">
                    <StateBadge
                      state={application.state}
                      label={applicationStateLabel(application.state)}
                      variant={applicationStateVariant(application.state)}
                    />
                  </DetailField>
                  <DetailField icon={Calendar} label="Fecha">
                    {application.appliedAt ? formatDateTime(application.appliedAt) : '—'}
                  </DetailField>
                  <DetailField icon={User} label="Revisor">
                    {application.reviewer ? application.reviewer.username : '—'}
                  </DetailField>
                  <DetailField icon={Calendar} label="Revisión">
                    {application.reviewDate ? formatDateTime(application.reviewDate) : '—'}
                  </DetailField>
                  {application.reviewNotes && (
                    <div className="flex flex-col gap-1 px-2 py-1.5">
                      <span className="text-sm text-muted-foreground">Notas de revisión</span>
                      <span className="whitespace-pre-wrap break-words text-sm text-foreground">
                        {application.reviewNotes}
                      </span>
                    </div>
                  )}
                  {application.coverLetter && (
                    <div className="flex flex-col gap-1 px-2 py-1.5">
                      <span className="text-sm text-muted-foreground">Carta de presentación</span>
                      <span className="whitespace-pre-wrap break-words text-sm text-foreground">
                        {application.coverLetter}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <SectionLabel>Hoja de vida</SectionLabel>
                  {application.resume ? (
                    <>
                      <DetailField icon={FileText} label="Archivo">
                        {application.resume.filename}
                      </DetailField>
                      <DetailField icon={FileText} label="Tamaño">
                        {application.resume.fileSizeMb.toFixed(2)} MB
                      </DetailField>
                      <Can permission="candidate_resumes.read">
                        <div className="px-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            disabled={downloading}
                          >
                            <Download data-icon="inline-start" />
                            {downloading ? 'Descargando...' : 'Descargar CV'}
                          </Button>
                        </div>
                      </Can>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
                      <FileText className="size-4" />
                      <span className="text-sm">Sin hoja de vida adjunta</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {application && (
        <ChangeApplicationStateDialog
          open={changeStateOpen}
          onOpenChange={setChangeStateOpen}
          applicationId={application.id}
          currentState={application.state}
          onSuccess={() => {
            refetch();
            onSuccess();
          }}
        />
      )}
    </>
  );
}
