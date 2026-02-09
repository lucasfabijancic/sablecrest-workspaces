import { cn } from '@/lib/utils';
import type { RequestStatus, ShortlistStatus, TimelineUrgency, SensitivityLevel } from '@/types/database';
import type { BriefStatus } from '@/types/brief';

interface StatusBadgeProps {
  status: RequestStatus | ShortlistStatus | TimelineUrgency | SensitivityLevel | BriefStatus;
  variant?: 'request' | 'shortlist' | 'urgency' | 'sensitivity' | 'brief';
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

const briefStatusStyles: Record<BriefStatus, string> = {
  'Draft': 'bg-muted text-muted-foreground dark:bg-muted/40 dark:text-muted-foreground',
  'Advisor Draft': 'bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300',
  'Client Review': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  'In Review': 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  'Locked': 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  'Matching': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  'Shortlisted': 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  'Selected': 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  'In Execution': 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  'Completed': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'Cancelled': 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
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
    case 'brief':
      styles = briefStatusStyles[status as BriefStatus] || 'bg-muted text-muted-foreground dark:bg-muted/40 dark:text-muted-foreground';
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
