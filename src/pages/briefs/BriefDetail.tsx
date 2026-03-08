import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { aecProviders } from '@/data/aecProviders';
import { aecProjectTypes } from '@/data/aecProjectTypes';
import { useAuth } from '@/contexts/AuthContext';
import { useBriefActions } from '@/hooks/useBriefActions';
import { useMatching } from '@/hooks/useMatching';
import { useBriefLoader } from '@/hooks/useBriefLoader';
import { useShortlist } from '@/hooks/useShortlist';
import {
  type AuditRow,
  type BriefTabKey,
  CLIENT_SHORTLIST_STATUSES,
  formatRelativeTime,
  getValueAtPath,
  isMeaningfulValue,
  makeFieldLabel,
} from '@/lib/briefUtils';
import { cn } from '@/lib/utils';
import BriefActionDialogs from '@/components/briefs/detail/BriefActionDialogs';
import BriefAdminSidebar from '@/components/briefs/detail/BriefAdminSidebar';
import BriefAuditTab from '@/components/briefs/detail/BriefAuditTab';
import BriefConstraintsTab from '@/components/briefs/detail/BriefConstraintsTab';
import BriefDetailFallback from '@/components/briefs/detail/BriefDetailFallback';
import BriefHeaderActions from '@/components/briefs/detail/BriefHeaderActions';
import BriefHistoryTab from '@/components/briefs/detail/BriefHistoryTab';
import BriefMatchesTab from '@/components/briefs/detail/BriefMatchesTab';
import BriefOverviewTab from '@/components/briefs/detail/BriefOverviewTab';
import BriefRequirementsTab from '@/components/briefs/detail/BriefRequirementsTab';
import BriefShortlistTab from '@/components/briefs/detail/BriefShortlistTab';
import BriefStatusMeta from '@/components/briefs/detail/BriefStatusMeta';
import BriefSuccessTab from '@/components/briefs/detail/BriefSuccessTab';
import ProviderDossier from '@/components/providers/ProviderDossier';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RiskFactor } from '@/types/brief';
import type { ShortlistEntry } from '@/types/matching';
import type { ProviderProfile } from '@/types/provider';

export default function BriefDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { loading: authLoading, hasRole, isOpsOrAdmin, isUiShellMode } = useAuth();
  const isAdmin = isOpsOrAdmin || hasRole(['admin', 'ops']);
  const isClient = hasRole(['client']) && !isAdmin;
  const {
    brief, loading, loadError, notFound, advisorName, matchingResult, setMatchingResult, shortlist, setShortlist,
    clientShortlistPreferences, setClientShortlistPreferences, applyLocalBriefUpdates,
  } = useBriefLoader(id);
  const {
    actionInProgress, deleteDialogOpen, setDeleteDialogOpen, persistBriefUpdate, handleDelete, handleSendToClient,
    handleRecallToDraft, handleSendBackToClient, handleLockBrief, handleUnlockBrief, handleMarkInExecution,
    handleMarkCompleted,
  } = useBriefActions({ brief, isAdmin, isUiShellMode, applyLocalBriefUpdates });
  const [activeTab, setActiveTab] = useState<BriefTabKey>('overview');
  const [auditMode, setAuditMode] = useState<'all' | 'changes'>('all');
  const { isGeneratingMatches, handleGenerateMatches, handleRegenerateMatches } = useMatching({
    brief,
    isAdmin,
    isUiShellMode,
    matchingResult,
    setMatchingResult,
    applyLocalBriefUpdates,
  });
  const {
    selectedProviderForDossier, isDossierOpen, isComparing, selectedProviderForSelection,
    setSelectedProviderForSelection, setIsComparing, handleAddToShortlist, handleRemoveFromShortlist,
    handleClientPreferenceSelect, handlePresentToClient, handleViewDossier, handleCloseDossier,
    handleCompareShortlist, handleOpenSelectProvider, handleConfirmSelectProvider,
  } = useShortlist({
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
  });

  const projectType = useMemo(() => {
    if (!brief) return null;
    return aecProjectTypes.find((candidate) => candidate.id === brief.projectTypeId) ?? null;
  }, [brief]);

  const providerLookup = useMemo(() => {
    return aecProviders.reduce<Record<string, ProviderProfile>>((accumulator, provider) => {
      accumulator[provider.id] = provider;
      return accumulator;
    }, {});
  }, []);

  const isBeforeLockedStatus = useMemo(() => {
    if (!brief) return true;

    return ['Draft', 'Advisor Draft', 'Client Review', 'In Review'].includes(brief.status);
  }, [brief]);

  const isBeforeShortlistedStatus = useMemo(() => {
    if (!brief) return true;
    return !CLIENT_SHORTLIST_STATUSES.includes(brief.status);
  }, [brief]);

  const shortlistProviderIds = useMemo(() => shortlist.map((entry) => entry.providerId), [shortlist]);

  const shortlistMatches = useMemo(() => {
    return shortlist
      .map((entry) => {
        const provider = providerLookup[entry.providerId];
        if (!provider) return null;
        return { entry, provider };
      })
      .filter((value): value is { entry: ShortlistEntry; provider: ProviderProfile } => Boolean(value));
  }, [providerLookup, shortlist]);

  const selectedProviderMatchScore = useMemo(() => {
    if (!selectedProviderForDossier) return undefined;

    const shortlistEntry = shortlist.find((entry) => entry.providerId === selectedProviderForDossier.id);
    if (shortlistEntry) return shortlistEntry.matchScore;

    return matchingResult?.matches.find((match) => match.providerId === selectedProviderForDossier.id);
  }, [matchingResult, selectedProviderForDossier, shortlist]);

  const showClientShortlistTab = !isAdmin;

  const auditRows = useMemo<AuditRow[]>(() => {
    if (!brief || !isAdmin) return [];
    const fieldSources = brief.fieldSources ?? {};
    const clientNotes = brief.clientNotes ?? {};
    const allPaths = new Set<string>([...Object.keys(fieldSources), ...Object.keys(clientNotes)]);

    if (allPaths.size === 0) {
      Object.entries(brief.businessContext).forEach(([key, value]) => {
        if (isMeaningfulValue(value)) allPaths.add(`businessContext.${key}`);
      });
      Object.entries(brief.intakeResponses).forEach(([key, value]) => {
        if (isMeaningfulValue(value)) allPaths.add(`intakeResponses.${key}`);
      });
      allPaths.add('constraints.budget.min');
      allPaths.add('constraints.budget.max');
      allPaths.add('constraints.budget.flexibility');
      allPaths.add('constraints.timeline.urgency');
      allPaths.add('constraints.timeline.hardDeadline');
      allPaths.add('constraints.timeline.reason');
      allPaths.add('constraints.sensitivity.level');
      allPaths.add('constraints.sensitivity.concerns');
      allPaths.add('constraints.technical.mustIntegrate');
      allPaths.add('constraints.technical.cannotChange');
      allPaths.add('constraints.technical.preferences');
    }

    return Array.from(allPaths)
      .map((path) => {
        const sourceRecord = fieldSources[path];

        return {
          path,
          label: makeFieldLabel(path, projectType, brief),
          value: getValueAtPath(brief, path),
          source: sourceRecord?.source ?? 'advisor',
          confirmedByClient: sourceRecord?.confirmedByClient ?? false,
          markedForClientInput: sourceRecord?.markedForClientInput ?? false,
          clientNote: clientNotes[path] ?? sourceRecord?.clientNotes,
        } satisfies AuditRow;
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [brief, isAdmin, projectType]);

  const filteredAuditRows = useMemo(() => {
    if (auditMode === 'all') return auditRows;
    return auditRows.filter((row) => row.source === 'client' || Boolean(row.clientNote));
  }, [auditMode, auditRows]);

  const clientChangedCount = useMemo(
    () => auditRows.filter((row) => row.source === 'client' || Boolean(row.clientNote)).length,
    [auditRows]
  );

  const clientConfirmedCount = useMemo(
    () => auditRows.filter((row) => row.confirmedByClient).length,
    [auditRows]
  );

  const pendingClientInputCount = useMemo(
    () => auditRows.filter((row) => row.markedForClientInput && !row.confirmedByClient).length,
    [auditRows]
  );

  const highRiskFlags = useMemo(() => {
    if (!brief) return [] as RiskFactor[];
    return brief.riskFactors.filter((risk) => risk.likelihood === 'High' || risk.impact === 'High');
  }, [brief]);

  const intakeEntries = useMemo(() => {
    if (!brief) return [] as Array<{ id: string; label: string; value: unknown }>;

    return Object.entries(brief.intakeResponses ?? {})
      .filter(([questionId]) => !questionId.startsWith('__'))
      .map(([questionId, value]) => {
        const questionLabel =
          projectType?.intakeQuestions.find((question) => question.id === questionId)?.question ?? questionId;

        return {
          id: questionId,
          label: questionLabel,
          value,
        };
      });
  }, [brief, projectType]);

  useEffect(() => {
    if (!brief) return;

    const allowedTabs: BriefTabKey[] = isAdmin
      ? ['overview', 'requirements', 'success', 'constraints', 'audit', 'matches', 'history']
      : [
          'overview',
          'requirements',
          'success',
          'constraints',
          ...(showClientShortlistTab ? (['shortlist'] as const) : []),
        ];

    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('overview');
    }
  }, [activeTab, brief, isAdmin, showClientShortlistTab]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin && !isClient && !isUiShellMode) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAdmin, isClient, isUiShellMode, navigate]);
  const runAdminProgressView = () => { setAuditMode('all'); setActiveTab('audit'); };
  const runAdminReviewChanges = () => { setAuditMode('changes'); setActiveTab('audit'); };

  const projectSubtitle = useMemo(() => {
    if (!projectType) {
      if (!brief?.projectTypeId || brief?.projectTypeId === 'other') return 'Custom project type';
      return brief.projectTypeId;
    }

    return `${projectType.name} (${projectType.category})`;
  }, [brief?.projectTypeId, projectType]);

  const clientStatusMessage = useMemo(() => {
    if (!brief || isAdmin) return null;

    switch (brief.status) {
      case 'In Review':
        return 'Your advisor is reviewing your brief.';
      case 'Locked':
        return 'Your advisor is matching providers.';
      case 'Shortlisted':
        return 'Your shortlist is ready to review.';
      case 'Selected':
        return 'Your selected provider is now tracked in this brief.';
      case 'In Execution':
        return 'Your implementation is in execution.';
      case 'Completed':
        return 'This implementation brief is complete.';
      default:
        return null;
    }
  }, [brief, isAdmin]);

  if (loading || authLoading) {
    return (
      <BriefDetailFallback
        variant="loading"
        title="Implementation Brief"
        description="Loading brief details..."
      />
    );
  }

  if (notFound || !brief) {
    return (
      <BriefDetailFallback
        variant="empty"
        title="Brief not found"
        description={loadError ?? 'This brief may have been removed or you do not have access.'}
        onBack={() => navigate('/briefs')}
      />
    );
  }

  if (loadError && !notFound) {
    return (
      <BriefDetailFallback
        variant="empty"
        title="Unable to load brief"
        description={loadError}
        onBack={() => navigate('/briefs')}
      />
    );
  }

  const title = brief.title?.trim() || 'Untitled Brief';

  return (
    <div className="page-container">
      <PageHeader
        title={title}
        description={isAdmin ? `${projectSubtitle} • Advisor: ${advisorName}` : projectSubtitle}
        showBack
        actions={
          <BriefHeaderActions
            brief={brief}
            isAdmin={isAdmin}
            actionInProgress={actionInProgress}
            onContinueEditing={() => navigate(`/admin/briefs/create?briefId=${brief.id}`)}
            onOpenDeleteDialog={() => setDeleteDialogOpen(true)}
            onShowClientProgress={runAdminProgressView}
            onReviewChanges={runAdminReviewChanges}
            onShowMatches={() => setActiveTab('matches')}
            onShowHistory={() => setActiveTab('history')}
            onShowShortlist={() => setActiveTab('shortlist')}
            onShowOverview={() => setActiveTab('overview')}
            onContinueReview={() => navigate(`/briefs/${brief.id}/review`)}
            onSendToClient={handleSendToClient}
            onRecallToDraft={handleRecallToDraft}
            onSendBackToClient={handleSendBackToClient}
            onLockBrief={handleLockBrief}
            onUnlockBrief={handleUnlockBrief}
            onGenerateMatches={handleGenerateMatches}
            onMarkInExecution={handleMarkInExecution}
            onMarkCompleted={handleMarkCompleted}
          />
        }
      />

      <BriefStatusMeta status={brief.status} updatedAt={brief.updatedAt} clientStatusMessage={isAdmin ? null : clientStatusMessage} />

      <div className={cn('page-content', isAdmin ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6' : 'space-y-4')}>
        <div>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BriefTabKey)}>
            <TabsList className="mb-4 flex-wrap h-auto bg-muted/60 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="success">Success Criteria</TabsTrigger>
              <TabsTrigger value="constraints">Constraints</TabsTrigger>

              {isAdmin ? (
                <>
                  <TabsTrigger value="audit">Field Audit</TabsTrigger>
                  <TabsTrigger value="matches">Matches</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </>
            ) : (
                showClientShortlistTab && <TabsTrigger value="shortlist">Shortlist</TabsTrigger>
              )}
            </TabsList>

            <BriefOverviewTab
              brief={brief}
              projectType={projectType}
              advisorName={advisorName}
              isAdmin={isAdmin}
              isClient={isClient}
              formatRelativeTime={formatRelativeTime}
            />

            <BriefRequirementsTab intakeEntries={intakeEntries} />

            <BriefSuccessTab brief={brief} isAdmin={isAdmin} />

            <BriefConstraintsTab brief={brief} />

            {isAdmin ? (
              <BriefAuditTab
                auditMode={auditMode}
                setAuditMode={setAuditMode}
                filteredAuditRows={filteredAuditRows}
                clientChangedCount={clientChangedCount}
                clientConfirmedCount={clientConfirmedCount}
                pendingClientInputCount={pendingClientInputCount}
              />
            ) : null}

            {isAdmin ? (
              <BriefMatchesTab
                brief={brief}
                isAdmin={isAdmin}
                matchingResult={matchingResult}
                isGeneratingMatches={isGeneratingMatches}
                shortlist={shortlist}
                shortlistMatches={shortlistMatches}
                shortlistProviderIds={shortlistProviderIds}
                actionInProgress={actionInProgress}
                isComparing={isComparing}
                isBeforeLockedStatus={isBeforeLockedStatus}
                isBeforeShortlistedStatus={isBeforeShortlistedStatus}
                handleLockBrief={handleLockBrief}
                handleGenerateMatches={handleGenerateMatches}
                handleRegenerateMatches={handleRegenerateMatches}
                handleAddToShortlist={handleAddToShortlist}
                handleRemoveFromShortlist={handleRemoveFromShortlist}
                handleViewDossier={handleViewDossier}
                handleCompareShortlist={handleCompareShortlist}
                handlePresentToClient={handlePresentToClient}
                handleOpenSelectProvider={handleOpenSelectProvider}
                setIsComparing={setIsComparing}
              />
            ) : null}

            {isAdmin ? (
              <BriefHistoryTab brief={brief} formatRelativeTime={formatRelativeTime} />
            ) : null}

            {!isAdmin && showClientShortlistTab ? (
              <BriefShortlistTab
                isBeforeShortlistedStatus={isBeforeShortlistedStatus}
                shortlist={shortlist}
                shortlistMatchCount={shortlistMatches.length}
                onViewDossier={handleViewDossier}
                onSelectPreference={handleClientPreferenceSelect}
                selectedPreferences={clientShortlistPreferences}
                projectTypeName={projectType?.name}
              />
            ) : null}
          </Tabs>
        </div>

        {isAdmin ? <BriefAdminSidebar brief={brief} highRiskFlags={highRiskFlags} /> : null}
      </div>

      <ProviderDossier
        provider={selectedProviderForDossier}
        isOpen={isDossierOpen}
        onClose={handleCloseDossier}
        onAddToShortlist={isAdmin ? handleAddToShortlist : undefined}
        matchScore={selectedProviderMatchScore}
        showInternalData={isAdmin}
        isShortlisted={
          selectedProviderForDossier ? shortlistProviderIds.includes(selectedProviderForDossier.id) : false
        }
      />

      <BriefActionDialogs
        selectedProviderName={selectedProviderForSelection?.name}
        selectionOpen={Boolean(selectedProviderForSelection)}
        onSelectionOpenChange={(open) => {
          if (!open) {
            setSelectedProviderForSelection(null);
          }
        }}
        onConfirmSelection={handleConfirmSelectProvider}
        deleteDialogOpen={deleteDialogOpen}
        onDeleteDialogOpenChange={setDeleteDialogOpen}
        onDelete={handleDelete}
        actionInProgress={actionInProgress}
      />
    </div>
  );
}
