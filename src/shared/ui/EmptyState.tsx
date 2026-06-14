import type { ComponentType, SVGProps } from 'react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <Empty>
        <EmptyHeader>
          {Icon && <Icon className="size-12 text-muted-foreground" />}
          <EmptyTitle>{title}</EmptyTitle>
          {description && <EmptyDescription>{description}</EmptyDescription>}
        </EmptyHeader>
        {action && <Button onClick={action.onClick}>{action.label}</Button>}
      </Empty>
    </div>
  );
}
