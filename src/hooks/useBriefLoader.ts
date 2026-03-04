import { useCallback, useEffect, useState } from 'react';
import { aecProviders } from '@/data/aecProviders';
import { mockBriefs } from '@/data/mockBriefs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  type BriefRow,
  type ProfileRow,
  CLIENT_SHORTLIST_STATUSES,
  mapRowToBrief,
  MATCHING_RESULT_META_KEY,
  SHORTLIST_META_KEY,
  SHORTLIST_PREFERENCES_META_KEY,
  toClientPreferenceMap,
  toMatchingResult,
  toShortlistEntries,
} from '@/lib/briefUtils';
import { generateMatches } from '@/lib/matching';
import type { ImplementationBrief } from '@/types/brief';
import type { MatchingResult, ShortlistEntry } from '@/types/matching';
import type { ClientPreference } from '@/components/matching/ClientShortlistView';

export function useBriefLoader(briefId: string | undefined) {
  const { user, loading: authLoading, hasRole, isOpsOrAdmin, isUiShellMode, currentWorkspace } = useAuth();
  useToast();

  const isAdmin = isOpsOrAdmin || hasRole(['admin', 'ops']);
  const isClient = hasRole(['client']) && !isAdmin;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [brief, setBrief] = useState<ImplementationBrief | null>(null);
  const [advisorName, setAdvisorName] = useState<string>('Unassigned');
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null);
  const [shortlist, setShortlist] = useState<ShortlistEntry[]>([]);
  const [clientShortlistPreferences, setClientShortlistPreferences] = useState<
    Record<string, ClientPreference>
  >({});

  useEffect(() => {
    if (authLoading) return;

    if (!briefId) {
      setLoading(false);
      setNotFound(true);
      setLoadError('Brief id is missing from the URL.');
      return;
    }

    let cancelled = false;

    const fetchBrief = async () => {
      setLoading(true);
      setLoadError(null);
      setNotFound(false);

      try {
        if (isUiShellMode) {
          const shellBrief = mockBriefs.find((candidate) => candidate.id === briefId);

          if (!shellBrief) {
            if (!cancelled) {
              setNotFound(true);
              setLoadError('Brief not found.');
              setBrief(null);
            }
            return;
          }

          if (isClient && currentWorkspace && shellBrief.workspaceId !== currentWorkspace.id) {
            if (!cancelled) {
              setNotFound(true);
              setLoadError('You do not have access to this brief.');
              setBrief(null);
            }
            return;
          }

          if (!cancelled) {
            setBrief(shellBrief);
          }
          return;
        }

        const { data, error } = await supabase
          .from('implementation_briefs')
          .select('*')
          .eq('id', briefId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          if (!cancelled) {
            setNotFound(true);
            setLoadError('Brief not found.');
            setBrief(null);
          }
          return;
        }

        const mappedBrief = mapRowToBrief(data as BriefRow);

        if (isClient) {
          if (!currentWorkspace || mappedBrief.workspaceId !== currentWorkspace.id) {
            if (!cancelled) {
              setNotFound(true);
              setLoadError('You do not have access to this brief.');
              setBrief(null);
            }
            return;
          }

          if (mappedBrief.status === 'Advisor Draft') {
            if (!cancelled) {
              setNotFound(true);
              setLoadError('This brief has not been shared with you yet.');
              setBrief(null);
            }
            return;
          }
        }

        if (!cancelled) {
          setBrief(mappedBrief);
        }
      } catch (error: any) {
        if (!cancelled) {
          setLoadError(error?.message ?? 'Unable to load the implementation brief.');
          setBrief(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchBrief();

    return () => {
      cancelled = true;
    };
  }, [authLoading, briefId, currentWorkspace, isClient, isUiShellMode, user?.id]);

  useEffect(() => {
    if (!brief) {
      setAdvisorName('Unassigned');
      return;
    }

    if (isUiShellMode) {
      const mockAdvisorNameMap: Record<string, string> = {
        'mock-advisor-001': 'Alex Carter',
        'mock-advisor-002': 'Jordan Lee',
      };

      setAdvisorName(
        brief.advisorId ? mockAdvisorNameMap[brief.advisorId] ?? brief.advisorId : 'Unassigned'
      );
      return;
    }

    if (!brief.advisorId) {
      setAdvisorName('Unassigned');
      return;
    }

    let cancelled = false;

    const fetchAdvisorName = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', brief.advisorId!)
        .maybeSingle();

      if (cancelled) return;

      const advisorProfile = profileData as Pick<ProfileRow, 'id' | 'full_name' | 'email'> | null;
      const displayName =
        advisorProfile?.full_name?.trim() ||
        advisorProfile?.email?.trim() ||
        brief.advisorId ||
        'Unassigned';

      setAdvisorName(displayName);
    };

    void fetchAdvisorName();

    return () => {
      cancelled = true;
    };
  }, [brief?.advisorId, brief?.id, isUiShellMode]);

  useEffect(() => {
    setMatchingResult(null);

    if (!brief) return;

    const storedMatchingResult = toMatchingResult(
      brief.intakeResponses?.[MATCHING_RESULT_META_KEY]
    );

    if (storedMatchingResult) {
      setMatchingResult(storedMatchingResult);
    }
  }, [brief?.id]);

  useEffect(() => {
    if (!brief) {
      setShortlist([]);
      setClientShortlistPreferences({});
      return;
    }

    const storedShortlist = toShortlistEntries(brief.intakeResponses?.[SHORTLIST_META_KEY]);
    const storedPreferences = toClientPreferenceMap(
      brief.intakeResponses?.[SHORTLIST_PREFERENCES_META_KEY]
    );

    if (storedShortlist.length > 0) {
      setShortlist(storedShortlist);
      setClientShortlistPreferences(storedPreferences);
      return;
    }

    if (CLIENT_SHORTLIST_STATUSES.includes(brief.status)) {
      const fallbackMatches = generateMatches(brief, aecProviders, { maxResults: 3 });
      const generatedShortlist: ShortlistEntry[] = fallbackMatches.matches.map((match) => ({
        id: `shortlist-${match.providerId}`,
        briefId: brief.id,
        providerId: match.providerId,
        matchScore: match,
        status: 'Proposed',
        addedAt: brief.updatedAt,
        addedBy: brief.advisorId ?? brief.ownerId,
      }));

      setShortlist(generatedShortlist);
      setClientShortlistPreferences(storedPreferences);
      return;
    }

    setShortlist([]);
    setClientShortlistPreferences({});
  }, [brief?.id]);

  const applyLocalBriefUpdates = useCallback((updates: Partial<ImplementationBrief>) => {
    setBrief((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  return {
    brief,
    setBrief,
    loading,
    loadError,
    notFound,
    advisorName,
    matchingResult,
    setMatchingResult,
    shortlist,
    setShortlist,
    clientShortlistPreferences,
    setClientShortlistPreferences,
    applyLocalBriefUpdates,
  };
}
