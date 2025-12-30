import { cn } from '@/lib/utils';
import type { RequestStatus, ShortlistStatus, TimelineUrgency, SensitivityLevel } from '@/types/database';

interface StatusBadgeProps {
  status: RequestStatus | ShortlistStatus | TimelineUrgency | SensitivityLevel;
  variant?: 'request' | 'shortlist' | 'urgency' | 'sensitivity';
  className?: string;
}

const requestStatusStyles: Record<RequestStatus, string> = {
  'Draft': 'bg-status-draft text-foreground',
  'Submitted': 'bg-status-submitted text-primary-foreground',
  'Scoping': 'bg-status-scoping text-foreground',
  'Shortlisting': 'bg-status-shortlisting text-primary-foreground',
  'In Execution': 'bg-status-execution text-foreground',
  'Delivered': 'bg-status-delivered text-foreground',
  'Closed': 'bg-status-closed text-foreground',
};

const shortlistStatusStyles: Record<ShortlistStatus, string> = {
  'Proposed': 'bg-muted text-muted-foreground',
  'Contacted': 'bg-status-submitted text-primary-foreground',
  'Interested': 'bg-status-shortlisting text-primary-foreground',
  'Declined': 'bg-destructive text-destructive-foreground',
  'Selected': 'bg-success text-success-foreground',
};

const urgencyStyles: Record<TimelineUrgency, string> = {
  'Immediate': 'bg-urgency-immediate text-foreground',
  'Within 2 weeks': 'bg-urgency-2weeks text-primary-foreground',
  'Within 1 month': 'bg-urgency-1month text-primary-foreground',
  'Within 3 months': 'bg-urgency-3months text-foreground',
  'Flexible': 'bg-urgency-flexible text-foreground',
};

const sensitivityStyles: Record<SensitivityLevel, string> = {
  'Standard': 'bg-muted text-muted-foreground',
  'Confidential': 'bg-status-shortlisting text-primary-foreground',
  'Highly Confidential': 'bg-destructive text-destructive-foreground',
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
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        styles,
        className
      )}
    >
      {status}
    </span>
  );
}
