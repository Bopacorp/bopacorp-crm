import { Download, FileText, Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalle de aplicación</SheetTitle>
          </SheetHeader>

          {loading ? (
            <SheetDetailSkeleton sections={[{ rows: ['w-24', 'w-40', 'w-56', 'w-16', 'w-28'] }]} />
          ) : error || !application ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : (
            <div className="flex flex-col gap-6 overflow-y-auto p-4">
              <div className="flex items-center justify-between">
                <StateBadge
                  state={application.state}
                  label={applicationStateLabel(application.state)}
                  variant={applicationStateVariant(application.state)}
                />
                <Can permission="job_applications.update">
                  <Button size="sm" variant="outline" onClick={() => setChangeStateOpen(true)}>
                    <Pencil data-icon="inline-start" className="size-4" />
                    Cambiar estado
                  </Button>
                </Can>
              </div>

              <Card>
                <CardHeader>
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Candidato
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <DetailRow label="Nombre">
                    {application.candidate.firstName} {application.candidate.lastName}
                  </DetailRow>
                  <DetailRow label="Email">{application.candidate.email}</DetailRow>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Vacante
                  </span>
                </CardHeader>
                <CardContent>
                  <DetailRow label="Título">{application.vacancy.title}</DetailRow>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Aplicación
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <DetailRow label="Fecha de aplicación">
                    {application.appliedAt ? formatDateTime(application.appliedAt) : '—'}
                  </DetailRow>
                  <DetailRow label="Revisor">
                    {application.reviewer ? application.reviewer.username : '—'}
                  </DetailRow>
                  <DetailRow label="Fecha de revisión">
                    {application.reviewDate ? formatDateTime(application.reviewDate) : '—'}
                  </DetailRow>
                  {application.reviewNotes && (
                    <DetailRow label="Notas de revisión">{application.reviewNotes}</DetailRow>
                  )}
                  {application.coverLetter && (
                    <DetailRow label="Carta de presentación">{application.coverLetter}</DetailRow>
                  )}
                </CardContent>
              </Card>

              {application.resume ? (
                <Card>
                  <CardHeader>
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Hoja de vida
                    </span>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <DetailRow label="Archivo">{application.resume.filename}</DetailRow>
                    <DetailRow label="Tamaño">
                      {application.resume.fileSizeMb.toFixed(2)} MB
                    </DetailRow>
                    <Can permission="candidate_resumes.read">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-fit"
                        onClick={handleDownload}
                        disabled={downloading}
                      >
                        <Download data-icon="inline-start" className="size-4" />
                        {downloading ? 'Descargando...' : 'Descargar CV'}
                      </Button>
                    </Can>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center gap-2 py-6 text-muted-foreground">
                    <FileText className="size-4" />
                    <span className="text-sm">Sin hoja de vida adjunta</span>
                  </CardContent>
                </Card>
              )}
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

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-2 py-1.5">
      <span className="w-32 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-sm text-foreground">{children}</span>
    </div>
  );
}
