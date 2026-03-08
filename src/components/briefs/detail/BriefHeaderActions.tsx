import { Loader2 } from 'lucide-react';
import type { ActionKey } from '@/lib/briefUtils';
import type { ImplementationBrief } from '@/types/brief';
import { Button } from '@/components/ui/button';

interface BriefHeaderActionsProps {
  brief: ImplementationBrief;
  isAdmin: boolean;
  actionInProgress: ActionKey | null;
  onContinueEditing: () => void;
  onOpenDeleteDialog: () => void;
  onShowClientProgress: () => void;
  onReviewChanges: () => void;
  onShowMatches: () => void;
  onShowHistory: () => void;
  onShowShortlist: () => void;
  onShowOverview: () => void;
  onContinueReview: () => void;
  onSendToClient: () => void;
  onRecallToDraft: () => void;
  onSendBackToClient: () => void;
  onLockBrief: () => void;
  onUnlockBrief: () => void;
  onGenerateMatches: () => void;
  onMarkInExecution: () => void;
  onMarkCompleted: () => void;
}

interface ActionButtonProps {
  actionInProgress: ActionKey | null;
  actionKey: ActionKey;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
}

function ActionButton({
  actionInProgress,
  actionKey,
  label,
  onClick,
  variant = 'default',
}: ActionButtonProps) {
  return (
    <Button size="sm" variant={variant} onClick={onClick} disabled={actionInProgress !== null}>
      {actionInProgress === actionKey ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
      {label}
    </Button>
  );
}

export default function BriefHeaderActions({
  brief,
  isAdmin,
  actionInProgress,
  onContinueEditing,
  onOpenDeleteDialog,
  onShowClientProgress,
  onReviewChanges,
  onShowMatches,
  onShowHistory,
  onShowShortlist,
  onShowOverview,
  onContinueReview,
  onSendToClient,
  onRecallToDraft,
  onSendBackToClient,
  onLockBrief,
  onUnlockBrief,
  onGenerateMatches,
  onMarkInExecution,
  onMarkCompleted,
}: BriefHeaderActionsProps) {
  const actions = isAdmin ? (
    (() => {
      switch (brief.status) {
        case 'Advisor Draft':
          return (
            <>
              <ActionButton
                actionInProgress={actionInProgress}
                actionKey="sendToClient"
                label="Send to Client"
                onClick={onSendToClient}
              />
              <Button size="sm" variant="outline" onClick={onContinueEditing} disabled={actionInProgress !== null}>
                Continue Editing
              </Button>
              <Button size="sm" variant="destructive" onClick={onOpenDeleteDialog} disabled={actionInProgress !== null}>
                Delete
              </Button>
            </>
          );
        case 'Client Review':
          return (
            <>
              <Button size="sm" variant="outline" onClick={onShowClientProgress} disabled={actionInProgress !== null}>
                View Client Progress
              </Button>
              <ActionButton
                actionInProgress={actionInProgress}
                actionKey="recall"
                label="Recall"
                onClick={onRecallToDraft}
                variant="secondary"
              />
            </>
          );
        case 'In Review':
          return (
            <>
              <Button size="sm" variant="outline" onClick={onReviewChanges} disabled={actionInProgress !== null}>
                Review Changes
              </Button>
              <ActionButton
                actionInProgress={actionInProgress}
                actionKey="lock"
                label="Lock Brief"
                onClick={onLockBrief}
              />
              <ActionButton
                actionInProgress={actionInProgress}
                actionKey="sendBack"
                label="Send Back to Client"
                onClick={onSendBackToClient}
                variant="secondary"
              />
            </>
          );
        case 'Locked':
          return (
            <>
              <ActionButton
                actionInProgress={actionInProgress}
                actionKey="generateMatches"
                label="Generate Matches"
                onClick={onGenerateMatches}
              />
              <ActionButton
                actionInProgress={actionInProgress}
                actionKey="unlock"
                label="Unlock"
                onClick={onUnlockBrief}
                variant="secondary"
              />
            </>
          );
        case 'Shortlisted':
          return (
            <Button size="sm" variant="outline" onClick={onShowMatches} disabled={actionInProgress !== null}>
              View Matches
            </Button>
          );
        case 'Selected':
          return (
            <>
              <Button size="sm" variant="outline" onClick={onShowMatches} disabled={actionInProgress !== null}>
                View Selection
              </Button>
              <ActionButton
                actionInProgress={actionInProgress}
                actionKey="markInExecution"
                label="Move to In Execution"
                onClick={onMarkInExecution}
              />
            </>
          );
        case 'In Execution':
          return (
            <>
              <Button size="sm" variant="outline" onClick={onShowHistory} disabled={actionInProgress !== null}>
                View Progress
              </Button>
              <ActionButton
                actionInProgress={actionInProgress}
                actionKey="markCompleted"
                label="Mark Completed"
                onClick={onMarkCompleted}
              />
            </>
          );
        case 'Completed':
          return (
            <Button size="sm" variant="outline" onClick={onShowHistory} disabled={actionInProgress !== null}>
              View History
            </Button>
          );
        default:
          return null;
      }
    })()
  ) : (
    (() => {
      switch (brief.status) {
        case 'Client Review':
          return (
            <Button size="sm" onClick={onContinueReview}>
              Continue Review
            </Button>
          );
        case 'Shortlisted':
          return (
            <Button size="sm" variant="outline" onClick={onShowShortlist}>
              View Your Shortlist
            </Button>
          );
        case 'Selected':
          return (
            <Button size="sm" variant="outline" onClick={onShowShortlist}>
              View Selection
            </Button>
          );
        case 'In Execution':
          return (
            <Button size="sm" variant="outline" onClick={onShowOverview}>
              View Progress
            </Button>
          );
        default:
          return null;
      }
    })()
  );

  if (!actions) return null;

  return <div className="flex items-center gap-2">{actions}</div>;
}
