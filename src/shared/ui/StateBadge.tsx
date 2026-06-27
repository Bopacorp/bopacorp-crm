import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StateBadgeProps {
  state: string;
  label?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

const stateVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  // Negotiation states
  prospecting: 'secondary',
  initial_contact: 'secondary',
  negotiation: 'default',
  closing: 'default',
  post_sale: 'outline',
  // Visit types (prospecting, closing, post_sale shared with negotiation states)
  presentation: 'default',
  follow_up: 'secondary',
  // Document + Matrix states
  PENDING_APPROVAL: 'secondary',
  ACCEPTED: 'default',
  REJECTED: 'destructive',
  DRAFT: 'secondary',
  APPROVED: 'default',
  approved: 'default',
  rejected: 'destructive',
  draft: 'secondary',
  inactive: 'outline',
  published: 'default',
  // Document types
  mandatory: 'default',
  optional: 'outline',
  // General
  active: 'default',
  completed: 'default',
  in_progress: 'secondary',
  cancelled: 'destructive',
  denied: 'destructive',
};

export function StateBadge({ state, label, variant, className }: StateBadgeProps) {
  const badgeVariant = variant || stateVariants[state] || 'secondary';

  return (
    <Badge variant={badgeVariant} className={cn(className)}>
      {label ?? state}
    </Badge>
  );
}
