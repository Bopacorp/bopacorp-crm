import type { CatalogItemResponse } from '@bopacorp/shared/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { formatCurrency, formatDate } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { DetailSkeleton, EmptyState, ErrorState, StateBadge } from '@/shared/ui';
import { deleteCatalogItem } from '../catalog.service.js';
import { CatalogItemEditSheet } from '../components/CatalogItemEditSheet.js';
import { useCatalogItem } from '../hooks/useCatalogItem.js';

function getTechnicalDetails(
  item: CatalogItemResponse,
  t: TFunction,
): { title: string; fields: { label: string; value: ReactNode }[] } | null {
  if (item.voiceDetails) {
    const d = item.voiceDetails;
    return {
      title: t('catalog.voiceDetail'),
      fields: [
        { label: t('catalog.gigasStructural'), value: `${d.gigasStructural} GB` },
        { label: t('catalog.gigasLoyalty'), value: `${d.gigasLoyalty} GB` },
        {
          label: t('catalog.minutesNational'),
          value: d.hasUnlimitedMinutes ? t('catalog.unlimited') : String(d.minutesNational ?? '—'),
        },
        { label: t('catalog.minutesLdi'), value: String(d.minutesLdi) },
        { label: t('catalog.sms'), value: String(d.sms) },
        {
          label: t('catalog.unlimitedWhatsapp'),
          value: d.hasUnlimitedWhatsapp ? t('common.yes') : t('common.no'),
        },
        {
          label: t('catalog.socialNetworks'),
          value: d.hasSocialNetworks ? t('common.yes') : t('common.no'),
        },
        { label: t('catalog.includedRoaming'), value: `${d.includedRoamingGb} GB` },
      ],
    };
  }

  if (item.connectivityDetails) {
    return {
      title: t('catalog.connectivityDetail'),
      fields: [
        {
          label: t('catalog.bandwidth'),
          value: `${item.connectivityDetails.bandwidthMbps} Mbps`,
        },
      ],
    };
  }

  if (item.digitalDetails) {
    return {
      title: t('catalog.digitalDetail'),
      fields: [{ label: t('catalog.provider'), value: item.digitalDetails.provider }],
    };
  }

  if (item.roamingDetails) {
    const d = item.roamingDetails;
    return {
      title: t('catalog.roamingDetail'),
      fields: [
        { label: t('catalog.data'), value: `${d.dataMb} MB` },
        { label: t('catalog.duration'), value: t('catalog.days', { count: d.durationDays }) },
        {
          label: t('catalog.throttle'),
          value: d.hasThrottle ? t('common.yes') : t('common.no'),
        },
      ],
    };
  }

  if (item.deviceDetails) {
    const d = item.deviceDetails;
    return {
      title: t('catalog.deviceDetail'),
      fields: [
        { label: t('catalog.brand'), value: d.brand },
        { label: t('catalog.model'), value: d.model },
        {
          label: t('catalog.storage'),
          value: d.storageGb ? `${d.storageGb} GB` : null,
        },
        {
          label: t('catalog.financing'),
          value: d.financingMonths ? t('catalog.months', { count: d.financingMonths }) : null,
        },
        {
          label: t('catalog.monthlyPayment'),
          value: d.financingMonthly ? formatCurrency(d.financingMonthly) : null,
        },
      ],
    };
  }

  return null;
}

export default function CatalogItemDetailPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { item, loading, error, refetch } = useCatalogItem(id);

  useBreadcrumbTitle(item?.name ?? null);

  const [showDelete, setShowDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const deleteItemMutation = useMutation({
    mutationFn: () => deleteCatalogItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.items.all });
      toast.success(t('catalog.productDeleted'));
      navigate('/catalogo');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (loading) return <DetailSkeleton fields={8} tabs={0} />;
  if (error || !item) return <ErrorState error={error} onRetry={refetch} />;

  const technicalDetails = getTechnicalDetails(item, t);
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
          label={item.isActive ? t('common.active') : t('common.inactive')}
        />
        {item.isPublished && <Badge variant="outline">{t('common.published')}</Badge>}

        <div className="ml-auto flex items-center gap-2">
          <Can permission="catalog_items.update">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil data-icon="inline-start" />
              {t('common.edit')}
            </Button>
          </Can>
          <Can permission="catalog_items.delete">
            <Button variant="outline" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 data-icon="inline-start" />
              {t('common.delete')}
            </Button>
          </Can>
        </div>
      </div>

      {/* Section 1: General Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('catalog.generalInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoField label={t('common.name')}>{item.name}</InfoField>
            <InfoField label={t('common.description')}>{item.description}</InfoField>
            <InfoField label={t('common.price')}>{formatCurrency(item.price)}</InfoField>
            <InfoField label={t('catalog.activationCode')}>{item.activationCode}</InfoField>
            <InfoField label={t('catalog.permanence')}>
              {item.permanenceMonths === 0
                ? t('catalog.noPermanence')
                : t('catalog.months', { count: item.permanenceMonths })}
            </InfoField>
            <InfoField label={t('common.category')}>{item.category.name}</InfoField>
            <InfoField label={t('catalog.itemType')}>{item.itemType.name}</InfoField>
            <InfoField label={t('catalog.contractType')}>{item.contractType.name}</InfoField>
            <InfoField label={t('catalog.segment')}>{item.segment.name}</InfoField>
            <InfoField label={t('catalog.level')}>{item.tier.name}</InfoField>
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
          <CardTitle>{t('catalog.benefits')}</CardTitle>
        </CardHeader>
        <CardContent>
          {item.benefits.length === 0 ? (
            <EmptyState title={t('catalog.noBenefits')} description={t('catalog.noBenefitsDesc')} />
          ) : (
            <div className="divide-y divide-border">
              {item.benefits.map((b) => (
                <div key={b.id} className="grid gap-4 py-3 md:grid-cols-3">
                  <InfoField label={t('common.name')}>{b.name}</InfoField>
                  <InfoField label={t('common.description')}>{b.description}</InfoField>
                  <InfoField label={t('catalog.duration')}>
                    {b.durationDays
                      ? t('catalog.days', { count: b.durationDays })
                      : t('catalog.permanent')}
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
            <CardTitle>{t('catalog.conditions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              {item.ageConditions && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t('catalog.age')}
                  </span>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoField label={t('catalog.minAge')}>
                      {t('catalog.years', { count: item.ageConditions.minAge })}
                    </InfoField>
                    <InfoField label={t('catalog.maxAge')}>
                      {item.ageConditions.maxAge
                        ? t('catalog.years', { count: item.ageConditions.maxAge })
                        : t('catalog.noLimit')}
                    </InfoField>
                  </div>
                </div>
              )}

              {item.legalConditions && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t('catalog.legal')}
                  </span>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoField label={t('catalog.legalRequirement')}>
                      {item.legalConditions.legalRequirement}
                    </InfoField>
                    <InfoField label={t('common.description')}>
                      {item.legalConditions.description}
                    </InfoField>
                  </div>
                </div>
              )}

              {item.temporalConditions && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t('catalog.temporal')}
                  </span>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoField label={t('catalog.effectiveFrom')}>
                      {formatDate(item.temporalConditions.effectiveDate)}
                    </InfoField>
                    <InfoField label={t('catalog.expiration')}>
                      {item.temporalConditions.expirationDate
                        ? formatDate(item.temporalConditions.expirationDate)
                        : t('catalog.noExpiration')}
                    </InfoField>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('catalog.deleteProduct')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.deleteEntityDesc', { name: item.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteItemMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
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
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
