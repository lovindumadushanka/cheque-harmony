import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'pending' | 'cleared' | 'bounced';
}

const variantStyles = {
  default: 'border-border',
  pending: 'border-l-4 border-l-[hsl(var(--status-pending))]',
  cleared: 'border-l-4 border-l-[hsl(var(--status-cleared))]',
  bounced: 'border-l-4 border-l-[hsl(var(--status-bounced))]',
};

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  pending: 'bg-[hsl(var(--status-pending-bg))] text-[hsl(var(--status-pending))]',
  cleared: 'bg-[hsl(var(--status-cleared-bg))] text-[hsl(var(--status-cleared))]',
  bounced: 'bg-[hsl(var(--status-bounced-bg))] text-[hsl(var(--status-bounced))]',
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn('stat-card', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              'text-sm font-medium',
              trend.isPositive ? 'text-[hsl(var(--status-cleared))]' : 'text-[hsl(var(--status-bounced))]'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last month
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-3', iconVariantStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
