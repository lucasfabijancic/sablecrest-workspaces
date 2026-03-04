import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {
  type ActionKey,
  type BriefRow,
  type StatusUpdateOptions,
  mapRowToBrief,
} from '@/lib/briefUtils';
import type { BriefStatus, ImplementationBrief } from '@/types/brief';

interface UseBriefActionsParams {
  brief: ImplementationBrief | null;
  isAdmin: boolean;
  isUiShellMode: boolean;
  applyLocalBriefUpdates: (updates: Partial<ImplementationBrief>) => void;
}

export function useBriefActions(params: UseBriefActionsParams) {
  const { brief, isAdmin, isUiShellMode, applyLocalBriefUpdates } = params;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [actionInProgress, setActionInProgress] = useState<ActionKey | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const persistBriefUpdate = useCallback(
    async (
      actionKey: ActionKey,
      dbUpdates: Database['public']['Tables']['implementation_briefs']['Update'],
      localUpdates: Partial<ImplementationBrief>,
      successTitle: string,
      successDescription: string
    ) => {
      if (!brief) return false;

      setActionInProgress(actionKey);

      try {
        if (isUiShellMode) {
          applyLocalBriefUpdates(localUpdates);
          toast({
            title: successTitle,
            description: successDescription,
          });
          return true;
        }

        const { data, error } = await supabase
          .from('implementation_briefs')
          .update(dbUpdates)
          .eq('id', brief.id)
          .select('*')
          .single();

        if (error) throw error;

        applyLocalBriefUpdates(mapRowToBrief(data as BriefRow));
        toast({
          title: successTitle,
          description: successDescription,
        });
        return true;
      } catch (error: any) {
        toast({
          title: 'Update failed',
          description: error?.message ?? 'Unable to update this brief right now.',
          variant: 'destructive',
        });
        return false;
      } finally {
        setActionInProgress(null);
      }
    },
    [applyLocalBriefUpdates, brief, isUiShellMode, toast]
  );

  const updateBriefStatus = useCallback(
    async (actionKey: ActionKey, status: BriefStatus, options: StatusUpdateOptions = {}) => {
      if (!isAdmin) return false;

      const dbUpdates: Database['public']['Tables']['implementation_briefs']['Update'] = {
        status,
      };

      const localUpdates: Partial<ImplementationBrief> = {
        status,
      };

      if ('clientReviewStartedAt' in options) {
        dbUpdates.client_review_started_at = options.clientReviewStartedAt ?? null;
        localUpdates.clientReviewStartedAt = options.clientReviewStartedAt ?? undefined;
      }

      if ('clientReviewCompletedAt' in options) {
        dbUpdates.client_review_completed_at = options.clientReviewCompletedAt ?? null;
        localUpdates.clientReviewCompletedAt = options.clientReviewCompletedAt ?? undefined;
      }

      if ('lockedAt' in options) {
        dbUpdates.locked_at = options.lockedAt ?? null;
        localUpdates.lockedAt = options.lockedAt ?? undefined;
      }

      if ('lockedBy' in options) {
        dbUpdates.locked_by = options.lockedBy ?? null;
        localUpdates.lockedBy = options.lockedBy ?? undefined;
      }

      const successTitle = options.successTitle ?? 'Brief updated';
      const successDescription = options.successDescription ?? `Status changed to ${status}.`;

      const updated = await persistBriefUpdate(
        actionKey,
        dbUpdates,
        localUpdates,
        successTitle,
        successDescription
      );

      return updated;
    },
    [isAdmin, persistBriefUpdate]
  );

  const handleDelete = useCallback(async () => {
    if (!brief || !isAdmin) return;

    setActionInProgress('delete');

    try {
      if (!isUiShellMode) {
        const { error } = await supabase.from('implementation_briefs').delete().eq('id', brief.id);
        if (error) throw error;
      }

      toast({
        title: 'Brief deleted',
        description: 'The advisor draft has been deleted.',
      });

      setDeleteDialogOpen(false);
      navigate('/briefs');
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error?.message ?? 'Unable to delete this brief.',
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(null);
    }
  }, [brief, isAdmin, isUiShellMode, navigate, toast]);

  const handleSendToClient = useCallback(async () => {
    const now = new Date().toISOString();
    await updateBriefStatus('sendToClient', 'Client Review', {
      clientReviewStartedAt: now,
      clientReviewCompletedAt: null,
      successTitle: 'Sent to client',
      successDescription: 'The brief is now visible to the client for guided review.',
    });
  }, [updateBriefStatus]);

  const handleRecallToDraft = useCallback(async () => {
    await updateBriefStatus('recall', 'Advisor Draft', {
      clientReviewStartedAt: null,
      clientReviewCompletedAt: null,
      successTitle: 'Brief recalled',
      successDescription: 'This brief is back in advisor draft mode.',
    });
  }, [updateBriefStatus]);

  const handleSendBackToClient = useCallback(async () => {
    await updateBriefStatus('sendBack', 'Client Review', {
      clientReviewCompletedAt: null,
      successTitle: 'Sent back to client',
      successDescription: 'The client can continue reviewing the brief.',
    });
  }, [updateBriefStatus]);

  const handleLockBrief = useCallback(async () => {
    const now = new Date().toISOString();
    await updateBriefStatus('lock', 'Locked', {
      lockedAt: now,
      lockedBy: user?.id ?? null,
      successTitle: 'Brief locked',
      successDescription: 'The brief is locked and ready for matching.',
    });
  }, [updateBriefStatus, user?.id]);

  const handleUnlockBrief = useCallback(async () => {
    await updateBriefStatus('unlock', 'In Review', {
      lockedAt: null,
      lockedBy: null,
      successTitle: 'Brief unlocked',
      successDescription: 'The brief is now editable for additional review changes.',
    });
  }, [updateBriefStatus]);

  const handleMarkInExecution = useCallback(async () => {
    await updateBriefStatus('markInExecution', 'In Execution', {
      successTitle: 'Moved to execution',
      successDescription: 'This engagement is now in execution tracking.',
    });
  }, [updateBriefStatus]);

  const handleMarkCompleted = useCallback(async () => {
    await updateBriefStatus('markCompleted', 'Completed', {
      successTitle: 'Brief completed',
      successDescription: 'The implementation lifecycle is now marked completed.',
    });
  }, [updateBriefStatus]);

  return {
    actionInProgress,
    deleteDialogOpen,
    setDeleteDialogOpen,
    persistBriefUpdate,
    updateBriefStatus,
    handleDelete,
    handleSendToClient,
    handleRecallToDraft,
    handleSendBackToClient,
    handleLockBrief,
    handleUnlockBrief,
    handleMarkInExecution,
    handleMarkCompleted,
  };
}
