import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  icon?: React.ComponentType<{ className?: string }>;
}

export function KpiCard({ title, value, subtitle, trend, icon: Icon }: KpiCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {Icon && <Icon className="size-5 text-muted-foreground" />}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-3xl font-semibold tracking-tight text-foreground">{value}</span>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2">
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  trend.isPositive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="size-4" />
                ) : (
                  <TrendingDown className="size-4" />
                )}
                <span>
                  {trend.value > 0 ? '+' : ''}
                  {trend.value}%
                </span>
              </div>
            )}
            {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}
