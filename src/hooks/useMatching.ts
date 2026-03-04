import { useCallback, useEffect, useState } from 'react';
import { aecProviders } from '@/data/aecProviders';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { buildIntakeResponsesWithMatchingResult } from '@/lib/briefUtils';
import { generateMatches } from '@/lib/matching';
import type { ImplementationBrief } from '@/types/brief';
import type { MatchingResult } from '@/types/matching';

interface UseMatchingParams {
  brief: ImplementationBrief | null;
  isAdmin: boolean;
  isUiShellMode: boolean;
  matchingResult: MatchingResult | null;
  setMatchingResult: (result: MatchingResult | null) => void;
  applyLocalBriefUpdates: (updates: Partial<ImplementationBrief>) => void;
}

export function useMatching(params: UseMatchingParams) {
  const { brief, isAdmin, isUiShellMode, matchingResult, setMatchingResult, applyLocalBriefUpdates } =
    params;
  const { toast } = useToast();

  const [isGeneratingMatches, setIsGeneratingMatches] = useState(false);

  useEffect(() => {
    setIsGeneratingMatches(false);
  }, [brief?.id, matchingResult]);

  const persistMatchingResultMetadata = useCallback(
    async (result: MatchingResult, options?: { silentError?: boolean }) => {
      if (!brief) return;

      const nextIntakeResponses = buildIntakeResponsesWithMatchingResult(
        brief.intakeResponses,
        result
      );

      applyLocalBriefUpdates({ intakeResponses: nextIntakeResponses });

      if (isUiShellMode) return;

      const { error } = await supabase
        .from('implementation_briefs')
        .update({ intake_responses: nextIntakeResponses })
        .eq('id', brief.id);

      if (error && !options?.silentError) {
        toast({
          title: 'Unable to persist match results',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
    [applyLocalBriefUpdates, brief, isUiShellMode, toast]
  );

  const runMatchGeneration = useCallback(
    async (options: { resetFirst?: boolean } = {}) => {
      if (!brief || !isAdmin) return;

      if (options.resetFirst) {
        setMatchingResult(null);
      }

      setIsGeneratingMatches(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const result = generateMatches(brief, aecProviders);
        setMatchingResult(result);
        void persistMatchingResultMetadata(result, { silentError: true });
      } catch (error: any) {
        toast({
          title: 'Matching failed',
          description: error?.message ?? 'Unable to generate provider matches right now.',
          variant: 'destructive',
        });
      } finally {
        setIsGeneratingMatches(false);
      }
    },
    [brief, isAdmin, persistMatchingResultMetadata, setMatchingResult, toast]
  );

  const handleGenerateMatches = useCallback(async () => {
    await runMatchGeneration();
  }, [runMatchGeneration]);

  const handleRegenerateMatches = useCallback(async () => {
    await runMatchGeneration({ resetFirst: true });
  }, [runMatchGeneration]);

  return {
    isGeneratingMatches,
    handleGenerateMatches,
    handleRegenerateMatches,
  };
}
