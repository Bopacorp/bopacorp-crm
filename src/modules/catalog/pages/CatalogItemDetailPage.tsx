import type { CatalogItemResponse } from '@bopacorp/shared/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ImageMinus, Loader2, Pencil, Trash2, Upload } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useBreadcrumbTitle } from '@/app/BreadcrumbTitleContext.js';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as DialogTitlePrimitive,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { DetailSkeleton, EmptyState, ErrorState, StateBadge } from '@/shared/ui';
import {
  deleteCatalogItem,
  deleteCatalogItemImage,
  uploadCatalogItemImage,
} from '../catalog.service.js';
import { CatalogItemEditSheet } from '../components/CatalogItemEditSheet.js';
import { useCatalogItem } from '../hooks/useCatalogItem.js';

function getTechnicalDetails(
  item: CatalogItemResponse,
): { title: string; fields: { label: string; value: ReactNode }[] } | null {
  if (item.voiceDetails) {
    const d = item.voiceDetails;
    return {
      title: 'Detalle de voz',
      fields: [
        { label: 'Gigas estructurales', value: `${d.gigasStructural} GB` },
        { label: 'Gigas fidelización', value: `${d.gigasLoyalty} GB` },
        {
          label: 'Minutos nacionales',
          value: d.hasUnlimitedMinutes ? 'Ilimitados' : String(d.minutesNational ?? '—'),
        },
        { label: 'Minutos LDI', value: String(d.minutesLdi) },
        { label: 'SMS', value: String(d.sms) },
        { label: 'WhatsApp ilimitado', value: d.hasUnlimitedWhatsapp ? 'Sí' : 'No' },
        { label: 'Redes sociales', value: d.hasSocialNetworks ? 'Sí' : 'No' },
        { label: 'Roaming incluido', value: `${d.includedRoamingGb} GB` },
      ],
    };
  }

  if (item.connectivityDetails) {
    return {
      title: 'Detalle de conectividad',
      fields: [
        { label: 'Ancho de banda', value: `${item.connectivityDetails.bandwidthMbps} Mbps` },
      ],
    };
  }

  if (item.digitalDetails) {
    return {
      title: 'Detalle digital',
      fields: [{ label: 'Proveedor', value: item.digitalDetails.provider }],
    };
  }

  if (item.roamingDetails) {
    const d = item.roamingDetails;
    return {
      title: 'Detalle de roaming',
      fields: [
        { label: 'Datos', value: `${d.dataMb} MB` },
        { label: 'Duración', value: `${d.durationDays} días` },
        { label: 'Throttle', value: d.hasThrottle ? 'Sí' : 'No' },
      ],
    };
  }

  if (item.deviceDetails) {
    const d = item.deviceDetails;
    return {
      title: 'Detalle de dispositivo',
      fields: [
        { label: 'Marca', value: d.brand },
        { label: 'Modelo', value: d.model },
        { label: 'Almacenamiento', value: d.storageGb ? `${d.storageGb} GB` : null },
        { label: 'Financiamiento', value: d.financingMonths ? `${d.financingMonths} meses` : null },
        {
          label: 'Cuota mensual',
          value: d.financingMonthly ? formatCurrency(d.financingMonthly) : null,
        },
      ],
    };
  }

  return null;
}

export default function CatalogItemDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { item, loading, error, refetch } = useCatalogItem(id);

  useBreadcrumbTitle(item?.name ?? null);

  const [showDelete, setShowDelete] = useState(false);
  const [imageViewOpen, setImageViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const deleteItemMutation = useMutation({
    mutationFn: () => deleteCatalogItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.items.all });
      toast.success('Producto eliminado');
      navigate('/catalogo');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => uploadCatalogItemImage(id, file),
    onSuccess: () => {
      refetch();
      toast.success('Imagen cargada');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteImageMutation = useMutation({
    mutationFn: () => deleteCatalogItemImage(id),
    onSuccess: () => {
      refetch();
      toast.success('Imagen eliminada');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (loading) return <DetailSkeleton fields={8} tabs={0} />;
  if (error || !item) return <ErrorState error={error} onRetry={refetch} />;

  const technicalDetails = getTechnicalDetails(item);
  const hasConditions = item.ageConditions || item.legalConditions || item.temporalConditions;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/catalogo')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">{item.name}</h1>
        <StateBadge
          state={item.isActive ? 'active' : 'inactive'}
          label={item.isActive ? 'Activo' : 'Inactivo'}
        />
        {item.isPublished && <Badge variant="outline">Publicado</Badge>}
        {item.imagePath && (
          <button type="button" onClick={() => setImageViewOpen(true)}>
            <img src={item.imagePath} alt={item.name} className="size-10 rounded-md object-cover" />
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Can permission="catalog_items.update">
            <Button
              variant="outline"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadImageMutation.isPending}
            >
              {uploadImageMutation.isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Upload data-icon="inline-start" />
              )}
              Subir imagen
            </Button>
            {item.imagePath && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteImageMutation.mutate()}
                disabled={deleteImageMutation.isPending}
              >
                {deleteImageMutation.isPending ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <ImageMinus data-icon="inline-start" />
                )}
                Eliminar imagen
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil data-icon="inline-start" />
              Editar
            </Button>
          </Can>
          <Can permission="catalog_items.delete">
            <Button variant="outline" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 data-icon="inline-start" />
              Eliminar
            </Button>
          </Can>
        </div>
      </div>

      {/* Section 1: General Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoField label="Nombre">{item.name}</InfoField>
            <InfoField label="Descripción">{item.description}</InfoField>
            <InfoField label="Precio">{formatCurrency(item.price)}</InfoField>
            <InfoField label="Código de activación">{item.activationCode}</InfoField>
            <InfoField label="Permanencia">
              {item.permanenceMonths === 0 ? 'Sin permanencia' : `${item.permanenceMonths} meses`}
            </InfoField>
            <InfoField label="Categoría">{item.category.name}</InfoField>
            <InfoField label="Tipo de ítem">{item.itemType.name}</InfoField>
            <InfoField label="Tipo de contrato">{item.contractType.name}</InfoField>
            <InfoField label="Segmento">{item.segment.name}</InfoField>
            <InfoField label="Nivel">{item.tier.name}</InfoField>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Technical Details (conditional) */}
      {technicalDetails && (
        <Card>
          <CardHeader>
            <CardTitle>{technicalDetails.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {technicalDetails.fields.map((f) => (
                <InfoField key={f.label} label={f.label}>
                  {f.value}
                </InfoField>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3: Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Beneficios</CardTitle>
        </CardHeader>
        <CardContent>
          {item.benefits.length === 0 ? (
            <EmptyState title="Sin beneficios" description="Sin beneficios configurados" />
          ) : (
            <div className="divide-y divide-border">
              {item.benefits.map((b) => (
                <div key={b.id} className="grid gap-4 py-3 md:grid-cols-3">
                  <InfoField label="Nombre">{b.name}</InfoField>
                  <InfoField label="Descripción">{b.description}</InfoField>
                  <InfoField label="Duración">
                    {b.durationDays ? `${b.durationDays} días` : 'Permanente'}
                  </InfoField>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Conditions (conditional) */}
      {hasConditions && (
        <Card>
          <CardHeader>
            <CardTitle>Condiciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              {item.ageConditions && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Edad
                  </span>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoField label="Edad mínima">{item.ageConditions.minAge} años</InfoField>
                    <InfoField label="Edad máxima">
                      {item.ageConditions.maxAge
                        ? `${item.ageConditions.maxAge} años`
                        : 'Sin límite'}
                    </InfoField>
                  </div>
                </div>
              )}

              {item.legalConditions && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Legales
                  </span>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoField label="Requisito">{item.legalConditions.legalRequirement}</InfoField>
                    <InfoField label="Descripción">{item.legalConditions.description}</InfoField>
                  </div>
                </div>
              )}

              {item.temporalConditions && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Temporales
                  </span>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoField label="Vigencia desde">
                      {formatDate(item.temporalConditions.effectiveDate)}
                    </InfoField>
                    <InfoField label="Vencimiento">
                      {item.temporalConditions.expirationDate
                        ? formatDate(item.temporalConditions.expirationDate)
                        : 'Sin vencimiento'}
                    </InfoField>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input for image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImageMutation.mutate(file);
          e.target.value = '';
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{item.name}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteItemMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteItemMutation.mutate();
              }}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image viewer dialog */}
      <Dialog open={imageViewOpen} onOpenChange={setImageViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitlePrimitive>{item.name}</DialogTitlePrimitive>
          </DialogHeader>
          {item.imagePath && (
            <img
              src={item.imagePath}
              alt={item.name}
              className="w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit sheet */}
      {item && (
        <CatalogItemEditSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          item={item}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}

function InfoField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{children ?? '—'}</span>
    </div>
  );
}
