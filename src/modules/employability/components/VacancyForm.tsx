import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SheetFooter } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FormAlert } from '@/shared/ui';

export interface VacancyFormValues {
  title: string;
  description: string;
  requirements: string;
  isActive: boolean;
  isPublished: boolean;
  publicationDate: string | undefined;
  closingDate: string | undefined;
}

interface VacancyFormProps {
  defaultValues: VacancyFormValues;
  onSubmit: (values: VacancyFormValues) => void;
  isPending: boolean;
  error?: string;
  submitLabel: string;
  onDirtyChange?: (dirty: boolean) => void;
  showPublicationControls?: boolean;
}

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

function datetimeLocalToIso(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

export function VacancyForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  submitLabel,
  onDirtyChange,
  showPublicationControls,
}: VacancyFormProps) {
  const [title, setTitle] = useState(defaultValues.title);
  const [description, setDescription] = useState(defaultValues.description);
  const [requirements, setRequirements] = useState(defaultValues.requirements);
  const [isActive, setIsActive] = useState(defaultValues.isActive);
  const [isPublished, setIsPublished] = useState(defaultValues.isPublished);
  const [publicationDate, setPublicationDate] = useState(
    isoToDatetimeLocal(defaultValues.publicationDate),
  );
  const [closingDate, setClosingDate] = useState(isoToDatetimeLocal(defaultValues.closingDate));
  const [dateError, setDateError] = useState('');

  const isDirty =
    title !== defaultValues.title ||
    description !== defaultValues.description ||
    requirements !== defaultValues.requirements ||
    isActive !== defaultValues.isActive ||
    isPublished !== defaultValues.isPublished ||
    publicationDate !== isoToDatetimeLocal(defaultValues.publicationDate) ||
    closingDate !== isoToDatetimeLocal(defaultValues.closingDate);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDateError('');

    if (publicationDate && closingDate && new Date(closingDate) < new Date(publicationDate)) {
      setDateError('La fecha de cierre debe ser posterior o igual a la fecha de publicación');
      return;
    }

    if (!title.trim() || !description.trim() || !requirements.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      requirements: requirements.trim(),
      isActive,
      isPublished,
      publicationDate: datetimeLocalToIso(publicationDate),
      closingDate: datetimeLocalToIso(closingDate),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {(error || dateError) && <FormAlert message={error || dateError} />}

        <FieldGroup>
          <Field>
            <FieldLabel>Título</FieldLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la vacante"
              maxLength={255}
            />
          </Field>

          <Field>
            <FieldLabel>Descripción</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción general de la vacante"
              rows={4}
            />
          </Field>

          <Field>
            <FieldLabel>Requisitos</FieldLabel>
            <Textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Requisitos del cargo"
              rows={4}
            />
          </Field>

          <Field>
            <FieldLabel>Fecha de publicación</FieldLabel>
            <Input
              type="datetime-local"
              value={publicationDate}
              onChange={(e) => setPublicationDate(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel>Fecha de cierre</FieldLabel>
            <Input
              type="datetime-local"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
            />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel>Activa</FieldLabel>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </Field>

          {showPublicationControls && (
            <Field orientation="horizontal">
              <FieldLabel>Publicada</FieldLabel>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </Field>
          )}
        </FieldGroup>
      </div>

      <SheetFooter>
        <Button
          type="submit"
          disabled={isPending || !title.trim() || !description.trim() || !requirements.trim()}
        >
          {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  );
}
