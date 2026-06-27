import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { getErrorMessage } from '@/shared/errors/index.js';

interface ErrorStateProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();

  const displayMessage = error ? getErrorMessage(error) : (message ?? t('error.generic'));

  return (
    <div className="flex items-center justify-center py-20">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{t('error.loadFailed')}</EmptyTitle>
          <EmptyDescription>{displayMessage}</EmptyDescription>
        </EmptyHeader>
        {onRetry && <Button onClick={onRetry}>{t('error.retry')}</Button>}
      </Empty>
    </div>
  );
}
