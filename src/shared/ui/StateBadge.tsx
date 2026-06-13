import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StateBadgeProps {
  state: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

const stateVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  // Negotiation states
  active: 'default',
  pending: 'secondary',
  closed: 'outline',
  expired: 'destructive',
  // Document states
  approved: 'default',
  rejected: 'destructive',
  // Matrix states
  draft: 'secondary',
  // General
  completed: 'default',
  in_progress: 'secondary',
  cancelled: 'destructive',
};

const stateLabels: Record<string, string> = {
  // Negotiation states
  active: 'Activa',
  pending: 'Pendiente',
  closed: 'Cerrada',
  expired: 'Expirada',
  // Document states
  approved: 'Aprobado',
  rejected: 'Rechazado',
  // Matrix states
  draft: 'Borrador',
  // General
  completed: 'Completado',
  in_progress: 'En progreso',
  cancelled: 'Cancelado',
};

export function StateBadge({ state, variant, className }: StateBadgeProps) {
  const badgeVariant = variant || stateVariants[state] || 'secondary';
  const label = stateLabels[state] || state;

  return (
    <Badge variant={badgeVariant} className={cn(className)}>
      {label}
    </Badge>
  );
}
