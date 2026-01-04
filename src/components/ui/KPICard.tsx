import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function KPICard({ label, value, icon: Icon, trend, className }: KPICardProps) {
  return (
    <div className={cn("bg-card border border-border p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-semibold text-foreground tabular-nums tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wider">{label}</p>
        </div>
        {Icon && (
          <div className="h-8 w-8 bg-muted flex items-center justify-center">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={cn(
            "text-xs font-medium",
            trend.isPositive ? "text-success" : "text-destructive"
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}