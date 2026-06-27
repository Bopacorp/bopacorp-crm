import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { queryKeys } from '@/lib/query-keys.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { createCatalogItem } from '../catalog.service.js';
import {
  CatalogItemForm,
  EMPTY_FORM_VALUES,
  mapFormToRequest,
} from '../components/CatalogItemForm.js';

export default function CatalogItemCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: createCatalogItem,
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.items.all });
      toast.success(t('catalog.productCreated'));
      navigate(`/catalogo/${item.id}`);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/catalogo')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">{t('catalog.newProduct')}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <CatalogItemForm
            defaultValues={EMPTY_FORM_VALUES}
            onSubmit={(values, code) => {
              setError('');
              mutation.mutate(mapFormToRequest(values, code));
            }}
            isPending={mutation.isPending}
            error={error}
            submitLabel={t('common.create')}
            onCancel={() => navigate('/catalogo')}
            mode="create"
          />
        </CardContent>
      </Card>
    </div>
  );
}
