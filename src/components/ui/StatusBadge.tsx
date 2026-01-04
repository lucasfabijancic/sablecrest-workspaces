import { cn } from '@/lib/utils';
import type { RequestStatus, ShortlistStatus, TimelineUrgency, SensitivityLevel } from '@/types/database';

interface StatusBadgeProps {
  status: RequestStatus | ShortlistStatus | TimelineUrgency | SensitivityLevel;
  variant?: 'request' | 'shortlist' | 'urgency' | 'sensitivity';
  className?: string;
}

const requestStatusStyles: Record<RequestStatus, string> = {
  'Draft': 'bg-muted text-muted-foreground',
  'Submitted': 'bg-status-submitted/15 text-status-submitted',
  'Scoping': 'bg-status-scoping/15 text-status-scoping',
  'Shortlisting': 'bg-status-shortlisting/15 text-status-shortlisting',
  'In Execution': 'bg-status-execution/15 text-status-execution',
  'Delivered': 'bg-status-delivered/15 text-status-delivered',
  'Closed': 'bg-muted text-muted-foreground',
};

const shortlistStatusStyles: Record<ShortlistStatus, string> = {
  'Proposed': 'bg-muted text-muted-foreground',
  'Contacted': 'bg-status-submitted/15 text-status-submitted',
  'Interested': 'bg-status-shortlisting/15 text-status-shortlisting',
  'Declined': 'bg-destructive/15 text-destructive',
  'Selected': 'bg-success/15 text-success',
};

const urgencyStyles: Record<TimelineUrgency, string> = {
  'Immediate': 'bg-urgency-immediate/15 text-urgency-immediate',
  'Within 2 weeks': 'bg-urgency-2weeks/15 text-urgency-2weeks',
  'Within 1 month': 'bg-urgency-1month/15 text-urgency-1month',
  'Within 3 months': 'bg-urgency-3months/15 text-urgency-3months',
  'Flexible': 'bg-urgency-flexible/15 text-urgency-flexible',
};

const sensitivityStyles: Record<SensitivityLevel, string> = {
  'Standard': 'bg-muted text-muted-foreground',
  'Confidential': 'bg-warning/15 text-warning',
  'Highly Confidential': 'bg-destructive/15 text-destructive',
};

export function StatusBadge({ status, variant = 'request', className }: StatusBadgeProps) {
  let styles = '';
  
  switch (variant) {
    case 'request':
      styles = requestStatusStyles[status as RequestStatus] || 'bg-muted text-muted-foreground';
      break;
    case 'shortlist':
      styles = shortlistStatusStyles[status as ShortlistStatus] || 'bg-muted text-muted-foreground';
      break;
    case 'urgency':
      styles = urgencyStyles[status as TimelineUrgency] || 'bg-muted text-muted-foreground';
      break;
    case 'sensitivity':
      styles = sensitivityStyles[status as SensitivityLevel] || 'bg-muted text-muted-foreground';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium',
        styles,
        className
      )}
    >
      {status}
    </span>
  );
}
