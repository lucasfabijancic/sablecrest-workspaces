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
    <div className={cn(
      "bg-card border border-border p-4",
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-xl font-semibold text-foreground tabular-nums tracking-tight mt-1">{value}</p>
        </div>
        {Icon && (
          <div className="h-7 w-7 bg-muted/50 flex items-center justify-center shrink-0">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={cn(
            "text-[11px] font-medium tabular-nums",
            trend.isPositive ? "text-emerald-500" : "text-red-400"
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-[11px] text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
