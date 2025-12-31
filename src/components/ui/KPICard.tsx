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
    <div className={cn("kpi-card", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="kpi-value">{value}</p>
          <p className="kpi-label">{label}</p>
        </div>
        {Icon && (
          <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
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