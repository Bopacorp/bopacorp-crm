import { FolderTree, Plus } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Can } from '@/modules/auth/components/Can.js';
import { DiscardChangesDialog, EmptyState, ErrorState } from '@/shared/ui';
import { useCategoryTree } from '../hooks/useCategoryTree.js';
import { CategoryDetailPanel } from './CategoryDetailPanel.js';
import { CategoryTreeNode } from './CategoryTreeNode.js';
import { CreateCategoryDialog } from './CreateCategoryDialog.js';

export function CategoryManager() {
  const { t } = useTranslation();
  const { tree, loading, error, refetch } = useCategoryTree();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [pendingSelectedId, setPendingSelectedId] = useState<string | null>(null);
  const detailDirtyRef = useRef(false);

  const handleSelect = useCallback(
    (id: string) => {
      if (id === selectedId) return;
      if (detailDirtyRef.current) {
        setPendingSelectedId(id);
        setShowDiscard(true);
        return;
      }
      detailDirtyRef.current = false;
      setSelectedId(id);
    },
    [selectedId],
  );

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <>
      <div className="flex gap-6 min-h-[500px]">
        {/* Left panel — tree */}
        <div className="w-72 shrink-0 flex flex-col gap-3 border-r border-border pr-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {t('common.structure')}
            </span>
            <Can permission="categories.create">
              <Button variant="ghost" size="icon-sm" onClick={() => setCreateOpen(true)}>
                <Plus />
              </Button>
            </Can>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={`sk-${String(i)}`} className="h-7 w-full" />
              ))}
            </div>
          ) : tree.length === 0 ? (
            <EmptyState
              title={t('catalog.noCategories')}
              description={t('catalog.noCategoriesDesc')}
              icon={FolderTree}
              action={{
                label: t('catalog.createFirstCategory'),
                onClick: () => setCreateOpen(true),
              }}
            />
          ) : (
            <ScrollArea className="flex-1">
              <div role="tree">
                {tree.map((node) => (
                  <CategoryTreeNode
                    key={node.id}
                    category={node}
                    depth={0}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Right panel — detail */}
        <div className="flex-1 min-w-0">
          {selectedId ? (
            <CategoryDetailPanel
              categoryId={selectedId}
              tree={tree}
              dirtyRef={detailDirtyRef}
              onUpdated={() => refetch()}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <EmptyState
                title={t('catalog.selectCategory')}
                description={t('catalog.selectCategoryDesc')}
                icon={FolderTree}
              />
            </div>
          )}
        </div>
      </div>

      <CreateCategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(newId) => {
          refetch();
          setSelectedId(newId);
        }}
      />

      <DiscardChangesDialog
        open={showDiscard}
        onCancel={() => {
          setShowDiscard(false);
          setPendingSelectedId(null);
        }}
        onDiscard={() => {
          detailDirtyRef.current = false;
          setShowDiscard(false);
          if (pendingSelectedId) {
            setSelectedId(pendingSelectedId);
            setPendingSelectedId(null);
          }
        }}
      />
    </>
  );
}
