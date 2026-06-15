import type { CategoryTreeResponse } from '@bopacorp/shared/catalog';
import { useMemo } from 'react';
import { useCategoryTree } from './useCategoryTree.js';

export interface CategoryOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function useCategoryOptions(excludeIds?: string[]) {
  const { tree, loading } = useCategoryTree();

  const options = useMemo(() => {
    const result: CategoryOption[] = [];
    const excludeSet = new Set(excludeIds ?? []);

    function flatten(nodes: CategoryTreeResponse[], depth: number) {
      for (const node of nodes) {
        const indent = '  '.repeat(depth);
        const prefix = depth > 0 ? `${indent}└ ` : '';
        result.push({
          value: node.id,
          label: `${prefix}${node.name}`,
          disabled: excludeSet.has(node.id),
        });
        if (node.children.length > 0) {
          flatten(node.children, depth + 1);
        }
      }
    }

    flatten(tree, 0);
    return result;
  }, [tree, excludeIds]);

  return { options, loading };
}
