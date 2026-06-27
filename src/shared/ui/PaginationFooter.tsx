import { useTranslation } from 'react-i18next';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PageSizeSelect } from './PageSizeSelect.js';
import { buildPageNumbers } from './pagination-utils.js';

interface PaginationFooterProps {
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  meta: { totalItems: number; totalPages: number } | null;
}

export function PaginationFooter({
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  meta,
}: PaginationFooterProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center justify-between">
        <PageSizeSelect value={pageSize} onChange={onPageSizeChange} />
        {meta && (
          <span className="text-sm text-muted-foreground">
            {t('common.totalResults', { count: meta.totalItems })}
          </span>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text={t('common.previous')}
                onClick={() => onPageChange(Math.max(1, page - 1))}
                aria-disabled={page === 1}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {buildPageNumbers(page, meta.totalPages).map((entry) =>
              entry.type === 'ellipsis' ? (
                <PaginationItem key={entry.key}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={entry.page}>
                  <PaginationLink
                    isActive={entry.page === page}
                    onClick={() => onPageChange(entry.page)}
                    className="cursor-pointer"
                  >
                    {entry.page}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                text={t('common.next')}
                onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
                aria-disabled={page === meta.totalPages}
                className={
                  page === meta.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
}
