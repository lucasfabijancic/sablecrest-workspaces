import { useCallback, useEffect, useState } from 'react';
import { aecProviders } from '@/data/aecProviders';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {
  type ActionKey,
  type BriefRow,
  buildIntakeResponsesWithShortlist,
  mapRowToBrief,
} from '@/lib/briefUtils';
import type { ImplementationBrief } from '@/types/brief';
import type { MatchingResult, ShortlistEntry } from '@/types/matching';
import type { ProviderProfile } from '@/types/provider';
import type { ClientPreference } from '@/components/matching/ClientShortlistView';

interface UseShortlistParams {
  brief: ImplementationBrief | null;
  isAdmin: boolean;
  isUiShellMode: boolean;
  shortlist: ShortlistEntry[];
  setShortlist: (entries: ShortlistEntry[]) => void;
  clientShortlistPreferences: Record<string, ClientPreference>;
  setClientShortlistPreferences: (prefs: Record<string, ClientPreference>) => void;
  matchingResult: MatchingResult | null;
  applyLocalBriefUpdates: (updates: Partial<ImplementationBrief>) => void;
  persistBriefUpdate: (
    actionKey: ActionKey,
    dbUpdates: Database['public']['Tables']['implementation_briefs']['Update'],
    localUpdates: Partial<ImplementationBrief>,
    successTitle: string,
    successDescription: string
  ) => Promise<boolean>;
}

export function useShortlist(params: UseShortlistParams) {
  const {
    brief,
    isAdmin,
    isUiShellMode,
    shortlist,
    setShortlist,
    clientShortlistPreferences,
    setClientShortlistPreferences,
    matchingResult,
    applyLocalBriefUpdates,
    persistBriefUpdate,
  } = params;

  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedProviderForDossier, setSelectedProviderForDossier] = useState<ProviderProfile | null>(
    null
  );
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedProviderForSelection, setSelectedProviderForSelection] =
    useState<ProviderProfile | null>(null);

  useEffect(() => {
    setSelectedProviderForDossier(null);
    setIsDossierOpen(false);
    setIsComparing(false);
    setSelectedProviderForSelection(null);
  }, [brief?.id]);

  const persistShortlistMetadata = useCallback(
    async (
      nextShortlist: ShortlistEntry[],
      nextPreferences: Record<string, ClientPreference>,
      options?: { silentError?: boolean }
    ) => {
      if (!brief) return;

      const nextIntakeResponses = buildIntakeResponsesWithShortlist(
        brief.intakeResponses,
        nextShortlist,
        nextPreferences
      );

      applyLocalBriefUpdates({ intakeResponses: nextIntakeResponses });

      if (isUiShellMode) return;

      const { error } = await supabase
        .from('implementation_briefs')
        .update({ intake_responses: nextIntakeResponses })
        .eq('id', brief.id);

      if (error && !options?.silentError) {
        toast({
          title: 'Unable to persist shortlist changes',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
    [applyLocalBriefUpdates, brief, isUiShellMode, toast]
  );

  const handleAddToShortlist = useCallback(
    (providerId: string) => {
      if (!matchingResult) return;

      if (shortlist.some((entry) => entry.providerId === providerId)) {
        return;
      }

      const matchScore = matchingResult.matches.find((match) => match.providerId === providerId);

      if (!matchScore) {
        toast({
          title: 'Unable to add provider',
          description: 'Match score data for this provider is unavailable.',
          variant: 'destructive',
        });
        return;
      }

      const entry: ShortlistEntry = {
        id: `shortlist-${providerId}-${Date.now()}`,
        briefId: brief?.id ?? matchScore.briefId,
        providerId,
        matchScore,
        status: 'Proposed',
        addedAt: new Date().toISOString(),
        addedBy: user?.id ?? 'system',
      };

      const nextShortlist = [...shortlist, entry];
      setShortlist(nextShortlist);
      void persistShortlistMetadata(nextShortlist, clientShortlistPreferences, { silentError: true });

      toast({
        title: 'Provider added to shortlist.',
      });
    },
    [
      brief?.id,
      clientShortlistPreferences,
      matchingResult,
      persistShortlistMetadata,
      shortlist,
      toast,
      user?.id,
      setShortlist,
    ]
  );

  const handleRemoveFromShortlist = useCallback(
    (providerId: string) => {
      const nextShortlist = shortlist.filter((entry) => entry.providerId !== providerId);
      setShortlist(nextShortlist);
      if (nextShortlist.length < 2) {
        setIsComparing(false);
      }
      void persistShortlistMetadata(nextShortlist, clientShortlistPreferences, { silentError: true });
    },
    [clientShortlistPreferences, persistShortlistMetadata, shortlist, setShortlist]
  );

  const handleClientPreferenceSelect = useCallback(
    (providerId: string, preference: ClientPreference) => {
      const nextPreferences = {
        ...clientShortlistPreferences,
        [providerId]: preference,
      };

      const nextShortlist: ShortlistEntry[] = shortlist.map((entry) => {
        if (entry.providerId !== providerId) return entry;

        const status: ShortlistEntry['status'] =
          preference === 'Interested'
            ? 'Interested'
            : preference === 'Not Interested'
            ? 'Declined'
            : entry.status;

        return {
          ...entry,
          status,
          fitNotes: preference === 'Questions' ? 'Client has follow-up questions.' : entry.fitNotes,
          responseAt: new Date().toISOString(),
        };
      });

      setClientShortlistPreferences(nextPreferences);
      setShortlist(nextShortlist);
      void persistShortlistMetadata(nextShortlist, nextPreferences, { silentError: true });
    },
    [
      clientShortlistPreferences,
      persistShortlistMetadata,
      shortlist,
      setClientShortlistPreferences,
      setShortlist,
    ]
  );

  const handlePresentToClient = useCallback(async () => {
    if (!brief || shortlist.length === 0) {
      toast({
        title: 'Shortlist is empty',
        description: 'Add at least one provider before presenting to the client.',
        variant: 'destructive',
      });
      return;
    }

    const nextIntakeResponses = buildIntakeResponsesWithShortlist(
      brief.intakeResponses,
      shortlist,
      clientShortlistPreferences
    );

    await persistBriefUpdate(
      'presentShortlist',
      {
        status: 'Shortlisted',
        intake_responses: nextIntakeResponses,
      },
      {
        status: 'Shortlisted',
        intakeResponses: nextIntakeResponses,
      },
      'Shortlist presented',
      'The curated shortlist is now visible to the client.'
    );
  }, [brief, clientShortlistPreferences, persistBriefUpdate, shortlist, toast]);

  const handleViewDossier = useCallback(
    (providerId: string) => {
      const provider = aecProviders.find((candidate) => candidate.id === providerId);

      if (!provider) {
        toast({
          title: 'Provider not found',
          description: 'Unable to locate this provider dossier.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedProviderForDossier(provider);
      setIsDossierOpen(true);
    },
    [toast]
  );

  const handleCloseDossier = useCallback(() => {
    setIsDossierOpen(false);
    setSelectedProviderForDossier(null);
  }, []);

  const handleCompareShortlist = useCallback(() => {
    setIsComparing(true);
  }, []);

  const handleOpenSelectProvider = useCallback(
    (providerId: string) => {
      if (!isAdmin) return;

      const provider = aecProviders.find((candidate) => candidate.id === providerId);
      if (!provider) {
        toast({
          title: 'Provider not found',
          description: 'Unable to locate this provider in the shortlist.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedProviderForSelection(provider);
    },
    [isAdmin, toast]
  );

  const handleConfirmSelectProvider = useCallback(async () => {
    if (!brief || !selectedProviderForSelection) return;

    const selectedProviderId = selectedProviderForSelection.id;
    const selectedProviderName = selectedProviderForSelection.name;
    const selectedAt = new Date().toISOString();
    const nextShortlist: ShortlistEntry[] = shortlist.map((entry) =>
      entry.providerId === selectedProviderId
        ? {
            ...entry,
            status: 'Selected' as const,
            responseAt: selectedAt,
          }
        : entry
    );

    const nextIntakeResponses = buildIntakeResponsesWithShortlist(
      brief.intakeResponses,
      nextShortlist,
      clientShortlistPreferences
    );

    const updated = await persistBriefUpdate(
      'selectProvider',
      {
        status: 'Selected',
        intake_responses: nextIntakeResponses,
      },
      {
        status: 'Selected',
        intakeResponses: nextIntakeResponses,
      },
      `${selectedProviderName} selected.`,
      'The brief is now marked as selected.'
    );

    if (!updated) return;

    setShortlist(nextShortlist);
    setSelectedProviderForSelection(null);
    setIsComparing(false);

    if (!isUiShellMode) {
      const { data, error } = await supabase
        .from('implementation_briefs')
        .select('*')
        .eq('id', brief.id)
        .maybeSingle();

      if (error) {
        toast({
          title: 'Selection saved, refresh failed',
          description: error.message,
          variant: 'destructive',
        });
      } else if (data) {
        applyLocalBriefUpdates(mapRowToBrief(data as BriefRow));
      }
    }
  }, [
    applyLocalBriefUpdates,
    brief,
    clientShortlistPreferences,
    isUiShellMode,
    persistBriefUpdate,
    selectedProviderForSelection,
    shortlist,
    toast,
    setShortlist,
  ]);

  return {
    selectedProviderForDossier,
    isDossierOpen,
    isComparing,
    selectedProviderForSelection,
    setSelectedProviderForSelection,
    setIsComparing,
    handleAddToShortlist,
    handleRemoveFromShortlist,
    handleClientPreferenceSelect,
    handlePresentToClient,
    handleViewDossier,
    handleCloseDossier,
    handleCompareShortlist,
    handleOpenSelectProvider,
    handleConfirmSelectProvider,
  };
}
