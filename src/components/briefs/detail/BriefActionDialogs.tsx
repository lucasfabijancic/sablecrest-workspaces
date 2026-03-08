import { Loader2 } from 'lucide-react';
import type { ActionKey } from '@/lib/briefUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BriefActionDialogsProps {
  selectedProviderName?: string;
  selectionOpen: boolean;
  onSelectionOpenChange: (open: boolean) => void;
  onConfirmSelection: () => void;
  deleteDialogOpen: boolean;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onDelete: () => void;
  actionInProgress: ActionKey | null;
}

export default function BriefActionDialogs({
  selectedProviderName,
  selectionOpen,
  onSelectionOpenChange,
  onConfirmSelection,
  deleteDialogOpen,
  onDeleteDialogOpenChange,
  onDelete,
  actionInProgress,
}: BriefActionDialogsProps) {
  return (
    <>
      <AlertDialog open={selectionOpen} onOpenChange={onSelectionOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select {selectedProviderName ?? 'this provider'} for this brief?</AlertDialogTitle>
            <AlertDialogDescription>This will update the brief status to Selected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionInProgress === 'selectProvider'}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmSelection} disabled={actionInProgress === 'selectProvider'}>
              {actionInProgress === 'selectProvider' ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : null}
              Confirm Selection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={onDeleteDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete advisor draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This action permanently deletes the brief and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionInProgress === 'delete'}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionInProgress === 'delete'}
            >
              {actionInProgress === 'delete' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
