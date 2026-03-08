import { formatRelativeTime } from '@/lib/briefUtils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { BriefStatus } from '@/types/brief';

interface BriefStatusMetaProps {
  status: BriefStatus;
  updatedAt?: string;
  clientStatusMessage: string | null;
}

export default function BriefStatusMeta({ status, updatedAt, clientStatusMessage }: BriefStatusMetaProps) {
  return (
    <>
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/40">
        <StatusBadge status={status} variant="brief" />
        <span className="text-xs text-muted-foreground">Updated {formatRelativeTime(updatedAt)}</span>
      </div>

      {clientStatusMessage ? (
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">{clientStatusMessage}</p>
        </div>
      ) : null}
    </>
  );
}
