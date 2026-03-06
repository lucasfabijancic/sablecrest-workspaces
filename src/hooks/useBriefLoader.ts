import { useCallback, useEffect, useState } from 'react';
import { aecProviders } from '@/data/aecProviders';
import { useAuth } from '@/contexts/AuthContext';
import { loadAdvisorName, loadBrief } from '@/services/briefService';
import {
  CLIENT_SHORTLIST_STATUSES,
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
        const { brief: loadedBrief, error, notFound: wasNotFound } = await loadBrief(briefId, {
          isShellMode: isUiShellMode,
          workspaceId: isClient ? currentWorkspace?.id : undefined,
        });

        if (!loadedBrief) {
          if (!cancelled) {
            setNotFound(Boolean(wasNotFound));
            setLoadError(error ?? 'Brief not found.');
            setBrief(null);
          }
          return;
        }

        if (isClient && loadedBrief.status === 'Advisor Draft') {
          if (!cancelled) {
            setNotFound(true);
            setLoadError('This brief has not been shared with you yet.');
            setBrief(null);
          }
          return;
        }

        if (!cancelled) {
          setBrief(loadedBrief);
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

    let cancelled = false;

    const fetchAdvisorName = async () => {
      const displayName = await loadAdvisorName(brief.advisorId);

      if (cancelled) return;

      setAdvisorName(displayName);
    };

    void fetchAdvisorName();

    return () => {
      cancelled = true;
    };
  }, [brief?.advisorId, brief?.id]);

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
