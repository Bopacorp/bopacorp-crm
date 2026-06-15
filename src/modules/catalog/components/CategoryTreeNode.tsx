import type { CategoryTreeResponse } from '@bopacorp/shared/catalog';
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CategoryTreeNodeProps {
  category: CategoryTreeResponse;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CategoryTreeNode({ category, depth, selectedId, onSelect }: CategoryTreeNodeProps) {
  const hasChildren = category.children.length > 0;

  return (
    <Collapsible defaultOpen>
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-md py-1.5 pr-2 text-sm cursor-pointer hover:bg-accent',
          selectedId === category.id && 'bg-accent text-accent-foreground',
        )}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
        onClick={() => onSelect(category.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect(category.id);
        }}
        role="treeitem"
        tabIndex={0}
      >
        {hasChildren ? (
          <CollapsibleTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <button type="button" className="size-4 shrink-0 flex items-center justify-center">
              <ChevronRight className="size-3.5 transition-transform duration-150 [[data-state=open]>&]:rotate-90" />
            </button>
          </CollapsibleTrigger>
        ) : (
          <span className="size-4 shrink-0" />
        )}
        <span className="truncate flex-1">{category.name}</span>
        <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
          {category.sortOrder}
        </span>
        <span
          className={cn(
            'size-2 shrink-0 rounded-full',
            category.isActive ? 'bg-primary' : 'bg-muted-foreground/30',
          )}
        />
      </div>

      {hasChildren && (
        <CollapsibleContent>
          {category.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
