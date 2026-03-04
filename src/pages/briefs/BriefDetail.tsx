import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { aecProjectTypes } from '@/data/aecProjectTypes';
import { aecProviders } from '@/data/aecProviders';
import { useAuth } from '@/contexts/AuthContext';
import { useBriefActions } from '@/hooks/useBriefActions';
import { useMatching } from '@/hooks/useMatching';
import { useBriefLoader } from '@/hooks/useBriefLoader';
import { useShortlist } from '@/hooks/useShortlist';
import {
  type ActionKey,
  type AuditRow,
  type BriefTabKey,
  CLIENT_SHORTLIST_STATUSES,
  formatRelativeTime,
  formatValueForDisplay,
  getValueAtPath,
  isMeaningfulValue,
  makeFieldLabel,
  pluralize,
  sourceBadgeClass,
  sourceBadgeLabel,
} from '@/lib/briefUtils';
import { cn } from '@/lib/utils';
import ClientShortlistView from '@/components/matching/ClientShortlistView';
import MatchResults from '@/components/matching/MatchResults';
import FitScoreCard from '@/components/matching/FitScoreCard';
import ShortlistComparison from '@/components/matching/ShortlistComparison';
import ProviderDossier from '@/components/providers/ProviderDossier';
import TierBadge from '@/components/providers/TierBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    brief,
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
  } = useBriefLoader(id);

  const {
    actionInProgress,
    deleteDialogOpen,
    setDeleteDialogOpen,
    persistBriefUpdate,
    handleDelete,
    handleSendToClient,
    handleRecallToDraft,
    handleSendBackToClient,
    handleLockBrief,
    handleUnlockBrief,
    handleMarkInExecution,
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

  const showClientShortlistTab = useMemo(() => {
    return !isAdmin;
  }, [isAdmin]);

  const auditRows = useMemo<AuditRow[]>(() => {
    if (!brief || !isAdmin) return [];

    const fieldSources = brief.fieldSources ?? {};
    const clientNotes = brief.clientNotes ?? {};

    const allPaths = new Set<string>([
      ...Object.keys(fieldSources),
      ...Object.keys(clientNotes),
    ]);

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

  const runAdminProgressView = useCallback(() => {
    setAuditMode('all');
    setActiveTab('audit');
  }, []);

  const runAdminReviewChanges = useCallback(() => {
    setAuditMode('changes');
    setActiveTab('audit');
  }, []);

  const getProjectSubtitle = useMemo(() => {
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

  const renderActionButton = (
    key: ActionKey,
    label: string,
    onClick: () => void,
    variant: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' = 'default',
    disabled?: boolean
  ) => (
    <Button key={key} variant={variant} size="sm" onClick={onClick} disabled={disabled || actionInProgress !== null}>
      {actionInProgress === key && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
      {label}
    </Button>
  );

  const adminActions = useMemo(() => {
    if (!brief || !isAdmin) return null;

    switch (brief.status) {
      case 'Advisor Draft':
        return (
          <>
            {renderActionButton('sendToClient', 'Send to Client', handleSendToClient, 'default')}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/admin/briefs/create?briefId=${brief.id}`)}
              disabled={actionInProgress !== null}
            >
              Continue Editing
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={actionInProgress !== null}
            >
              Delete
            </Button>
          </>
        );

      case 'Client Review':
        return (
          <>
            <Button size="sm" variant="outline" onClick={runAdminProgressView} disabled={actionInProgress !== null}>
              View Client Progress
            </Button>
            {renderActionButton('recall', 'Recall', handleRecallToDraft, 'secondary')}
          </>
        );

      case 'In Review':
        return (
          <>
            <Button size="sm" variant="outline" onClick={runAdminReviewChanges} disabled={actionInProgress !== null}>
              Review Changes
            </Button>
            {renderActionButton('lock', 'Lock Brief', handleLockBrief, 'default')}
            {renderActionButton('sendBack', 'Send Back to Client', handleSendBackToClient, 'secondary')}
          </>
        );

      case 'Locked':
        return (
          <>
            {renderActionButton('generateMatches', 'Generate Matches', handleGenerateMatches, 'default')}
            {renderActionButton('unlock', 'Unlock', handleUnlockBrief, 'secondary')}
          </>
        );

      case 'Shortlisted':
        return (
          <Button size="sm" variant="outline" onClick={() => setActiveTab('matches')} disabled={actionInProgress !== null}>
            View Matches
          </Button>
        );

      case 'Selected':
        return (
          <>
            <Button size="sm" variant="outline" onClick={() => setActiveTab('matches')} disabled={actionInProgress !== null}>
              View Selection
            </Button>
            {renderActionButton('markInExecution', 'Move to In Execution', handleMarkInExecution, 'default')}
          </>
        );

      case 'In Execution':
        return (
          <>
            <Button size="sm" variant="outline" onClick={() => setActiveTab('history')} disabled={actionInProgress !== null}>
              View Progress
            </Button>
            {renderActionButton('markCompleted', 'Mark Completed', handleMarkCompleted, 'default')}
          </>
        );

      case 'Completed':
        return (
          <Button size="sm" variant="outline" onClick={() => setActiveTab('history')} disabled={actionInProgress !== null}>
            View History
          </Button>
        );

      default:
        return null;
    }
  }, [
    actionInProgress,
    brief,
    handleGenerateMatches,
    handleLockBrief,
    handleMarkCompleted,
    handleMarkInExecution,
    handleRecallToDraft,
    handleSendBackToClient,
    handleSendToClient,
    handleUnlockBrief,
    isAdmin,
    navigate,
    runAdminProgressView,
    runAdminReviewChanges,
  ]);

  const clientActions = useMemo(() => {
    if (!brief || isAdmin) return null;

    switch (brief.status) {
      case 'Client Review':
        return (
          <Button size="sm" onClick={() => navigate(`/briefs/${brief.id}/review`)}>
            Continue Review
          </Button>
        );
      case 'Shortlisted':
        return (
          <Button size="sm" variant="outline" onClick={() => setActiveTab('shortlist')}>
            View Your Shortlist
          </Button>
        );
      case 'Selected':
        return (
          <Button size="sm" variant="outline" onClick={() => setActiveTab('shortlist')}>
            View Selection
          </Button>
        );
      case 'In Execution':
        return (
          <Button size="sm" variant="outline" onClick={() => setActiveTab('overview')}>
            View Progress
          </Button>
        );
      default:
        return null;
    }
  }, [brief, isAdmin, navigate]);

  if (loading || authLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Implementation Brief" description="Loading brief details..." showBack />
        <div className="page-content">
          <Card>
            <CardContent className="py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading brief details...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (notFound || !brief) {
    return (
      <div className="page-content">
        <EmptyState
          icon={AlertCircle}
          title="Brief not found"
          description={loadError ?? 'This brief may have been removed or you do not have access.'}
          action={{ label: 'Back to Briefs', onClick: () => navigate('/briefs') }}
        />
      </div>
    );
  }

  if (loadError && !notFound) {
    return (
      <div className="page-content">
        <EmptyState
          icon={AlertCircle}
          title="Unable to load brief"
          description={loadError}
          action={{ label: 'Back to Briefs', onClick: () => navigate('/briefs') }}
        />
      </div>
    );
  }

  const title = brief.title?.trim() || 'Untitled Brief';

  return (
    <div className="page-container">
      <PageHeader
        title={title}
        description={isAdmin ? `${getProjectSubtitle} • Advisor: ${advisorName}` : getProjectSubtitle}
        showBack
        actions={
          <div className="flex items-center gap-2">
            {isAdmin ? adminActions : clientActions}
          </div>
        }
      />

      <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/40">
        <StatusBadge status={brief.status} variant="brief" />
        <span className="text-xs text-muted-foreground">Updated {formatRelativeTime(brief.updatedAt)}</span>
      </div>

      {!isAdmin && clientStatusMessage ? (
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">{clientStatusMessage}</p>
        </div>
      ) : null}

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

            <TabsContent value="overview" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Business Context</CardTitle>
                  <CardDescription>What Sablecrest understands about your current situation.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Company</p>
                    <p className="text-sm">{brief.businessContext.companyName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Size</p>
                    <p className="text-sm">{brief.businessContext.companySize || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Segment</p>
                    <p className="text-sm">{brief.businessContext.industry || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Decision Timeline</p>
                    <p className="text-sm">{brief.businessContext.decisionTimeline || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Current State</p>
                    <p className="text-sm whitespace-pre-wrap">{brief.businessContext.currentState || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Desired Outcome</p>
                    <p className="text-sm whitespace-pre-wrap">{brief.businessContext.desiredOutcome || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Key Stakeholders</p>
                    <p className="text-sm whitespace-pre-wrap">{brief.businessContext.keyStakeholders || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium">{projectType?.name ?? brief.projectTypeId}</p>
                  {projectType && (
                    <>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{projectType.category}</p>
                      <p className="text-sm text-muted-foreground">{projectType.description}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              {isAdmin ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Assessment</CardTitle>
                      <CardDescription>Advisor-only risk factors used for matching and planning.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {brief.riskFactors.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No risk factors captured yet.</p>
                      ) : (
                        brief.riskFactors.map((risk) => (
                          <div key={risk.id} className="rounded-md border border-border p-3 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{risk.category}</Badge>
                              <Badge variant="secondary">Likelihood: {risk.likelihood}</Badge>
                              <Badge variant="secondary">Impact: {risk.impact}</Badge>
                            </div>
                            <p className="text-sm">{risk.description}</p>
                            {risk.mitigation ? (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Mitigation:</span> {risk.mitigation}
                              </p>
                            ) : null}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Advisor Notes</CardTitle>
                      <CardDescription>Internal assessment and discovery context.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Discovery Notes</p>
                        <p className="text-sm whitespace-pre-wrap">{brief.discoveryNotes || 'No discovery notes recorded.'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Advisor Assessment</p>
                        <p className="text-sm whitespace-pre-wrap">{brief.advisorNotes || 'No advisor assessment recorded.'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Intake Responses</CardTitle>
                  <CardDescription>Detailed inputs collected for this implementation brief.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {intakeEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No intake responses have been captured yet.</p>
                  ) : (
                    intakeEntries.map((entry) => (
                      <div key={entry.id} className="rounded-md border border-border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{entry.label}</p>
                        <p className="text-sm whitespace-pre-wrap">{formatValueForDisplay(entry.value)}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="success" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Success Criteria</CardTitle>
                  <CardDescription>
                    {isAdmin
                      ? 'Criteria used to evaluate implementation outcomes and provider fit.'
                      : 'How success will be measured for your implementation.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {brief.successCriteria.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No success criteria are defined yet.</p>
                  ) : (
                    brief.successCriteria.map((criterion, index) => (
                      <div key={criterion.id || `criterion-${index}`} className="rounded-md border border-border p-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{criterion.metric || `Criterion ${index + 1}`}</p>
                          {isAdmin && criterion.source ? (
                            <Badge
                              variant="secondary"
                              className={
                                criterion.source === 'advisor'
                                  ? 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
                                  : criterion.source === 'client'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                              }
                            >
                              {criterion.source === 'advisor'
                                ? 'Suggested by Sablecrest'
                                : criterion.source === 'client'
                                ? 'Client Added'
                                : 'AI Suggested'}
                            </Badge>
                          ) : null}
                          {isAdmin && criterion.confirmedByClient ? (
                            <Badge variant="outline">Confirmed by client</Badge>
                          ) : null}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Baseline</p>
                            <p className="text-sm">{criterion.baseline || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Target</p>
                            <p className="text-sm">{criterion.target || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Measurement Method</p>
                            <p className="text-sm">{criterion.measurementMethod || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Timeframe</p>
                            <p className="text-sm">{criterion.timeframe || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Weight</p>
                            <p className="text-sm">{criterion.weight ?? 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="constraints" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Budget</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Minimum</p>
                    <p className="text-sm">
                      {typeof brief.constraints.budget.min === 'number'
                        ? `$${brief.constraints.budget.min.toLocaleString()}`
                        : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Maximum</p>
                    <p className="text-sm">
                      {typeof brief.constraints.budget.max === 'number'
                        ? `$${brief.constraints.budget.max.toLocaleString()}`
                        : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Flexibility</p>
                    <p className="text-sm">{brief.constraints.budget.flexibility}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Urgency</p>
                    <p className="text-sm">{brief.constraints.timeline.urgency || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Hard Deadline</p>
                    <p className="text-sm">{brief.constraints.timeline.hardDeadline || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Reason</p>
                    <p className="text-sm whitespace-pre-wrap">{brief.constraints.timeline.reason || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sensitivity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Level</p>
                    <p className="text-sm">{brief.constraints.sensitivity.level || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Concerns</p>
                    <p className="text-sm">
                      {brief.constraints.sensitivity.concerns?.length
                        ? brief.constraints.sensitivity.concerns.join(', ')
                        : 'None listed'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Constraints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Must Integrate</p>
                    <p className="text-sm">
                      {brief.constraints.technical.mustIntegrate?.length
                        ? brief.constraints.technical.mustIntegrate.join(', ')
                        : 'None listed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Cannot Change</p>
                    <p className="text-sm">
                      {brief.constraints.technical.cannotChange?.length
                        ? brief.constraints.technical.cannotChange.join(', ')
                        : 'None listed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Preferences</p>
                    <p className="text-sm">
                      {brief.constraints.technical.preferences?.length
                        ? brief.constraints.technical.preferences.join(', ')
                        : 'None listed'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {isAdmin ? (
              <TabsContent value="audit" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Field Audit</CardTitle>
                    <CardDescription>
                      Track field source, client confirmations, and client notes across this brief.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {clientConfirmedCount} confirmed by client
                      </Badge>
                      <Badge variant="secondary">
                        {clientChangedCount} changed by client
                      </Badge>
                      <Badge variant="secondary">
                        {pendingClientInputCount} pending {pluralize(pendingClientInputCount, 'field')}
                      </Badge>

                      <div className="ml-auto flex gap-2">
                        <Button
                          size="sm"
                          variant={auditMode === 'all' ? 'default' : 'outline'}
                          onClick={() => setAuditMode('all')}
                        >
                          All Fields
                        </Button>
                        <Button
                          size="sm"
                          variant={auditMode === 'changes' ? 'default' : 'outline'}
                          onClick={() => setAuditMode('changes')}
                        >
                          Client Changes
                        </Button>
                      </div>
                    </div>

                    {filteredAuditRows.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {auditMode === 'changes'
                          ? 'No client-originated field changes detected yet.'
                          : 'No field audit data available yet.'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {filteredAuditRows.map((row) => (
                          <div key={row.path} className="rounded-md border border-border p-3 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium">{row.label}</p>
                              <Badge variant="secondary" className={sourceBadgeClass(row.source)}>
                                {sourceBadgeLabel(row.source)}
                              </Badge>
                              {row.confirmedByClient ? (
                                <Badge variant="outline" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Confirmed
                                </Badge>
                              ) : null}
                              {row.markedForClientInput ? (
                                <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-700">
                                  Needs client input
                                </Badge>
                              ) : null}
                            </div>

                            <p className="text-sm whitespace-pre-wrap">{formatValueForDisplay(row.value)}</p>

                            {row.clientNote ? (
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                <span className="font-medium">Client note:</span> {row.clientNote}
                              </p>
                            ) : null}

                            <p className="text-[11px] text-muted-foreground">{row.path}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}

            {isAdmin ? (
              <TabsContent value="matches" className="space-y-4 mt-0">
                {/* Admin-only matching workflow. Route-level RoleRoute should also guard this path in production. */}
                {isBeforeLockedStatus ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Provider Matches</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Lock the brief to generate provider matches. Matching requires all criteria to be finalized.
                      </p>
                      <Button size="sm" onClick={handleLockBrief} disabled={actionInProgress !== null}>
                        {actionInProgress === 'lock' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                        Lock Brief
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {isGeneratingMatches ? (
                      <Card>
                        <CardContent className="py-8 flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing providers...
                        </CardContent>
                      </Card>
                    ) : null}

                    {!isGeneratingMatches && !matchingResult ? (
                      <Card>
                        <CardHeader>
                          <CardTitle>Run Matching</CardTitle>
                          <CardDescription>
                            Analyzes {aecProviders.length} providers against your brief requirements.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button size="lg" onClick={handleGenerateMatches} disabled={actionInProgress !== null}>
                            Generate Matches
                          </Button>
                        </CardContent>
                      </Card>
                    ) : null}

                    {!isGeneratingMatches && matchingResult ? (
                      <>
                        <MatchResults
                          matches={matchingResult.matches}
                          providers={aecProviders}
                          onAddToShortlist={handleAddToShortlist}
                          onViewDossier={handleViewDossier}
                          shortlistedIds={shortlistProviderIds}
                          algorithmVersion={matchingResult.algorithmVersion}
                          generatedAt={matchingResult.generatedAt}
                          totalCandidatesEvaluated={matchingResult.totalCandidatesEvaluated}
                          onRegenerate={handleRegenerateMatches}
                        />

                        <Card>
                          <CardHeader>
                            <CardTitle>Shortlist ({shortlist.length} providers)</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {shortlist.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Add providers from the matches above to build your shortlist.
                              </p>
                            ) : (
                              <div className="grid gap-3 md:grid-cols-2">
                                {shortlistMatches.map(({ entry, provider }) => (
                                  <div key={entry.id} className="rounded-md border border-border p-3 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="space-y-1">
                                        <p className="text-sm font-medium">{provider.name}</p>
                                        <TierBadge tier={provider.tier} size="sm" />
                                      </div>
                                      <FitScoreCard score={entry.matchScore.overallScore} size="compact" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleViewDossier(provider.id)}
                                      >
                                        View Dossier
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRemoveFromShortlist(provider.id)}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCompareShortlist}
                                disabled={shortlist.length < 2}
                              >
                                Compare Shortlist
                              </Button>

                              <Button
                                size="sm"
                                onClick={handlePresentToClient}
                                disabled={shortlist.length === 0 || actionInProgress !== null}
                              >
                                {actionInProgress === 'presentShortlist' ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                ) : null}
                                Present to Client
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {isComparing ? (
                          <ShortlistComparison
                            shortlist={shortlist}
                            providers={aecProviders}
                            onSelectProvider={handleOpenSelectProvider}
                            onRemoveFromShortlist={handleRemoveFromShortlist}
                            onViewDossier={handleViewDossier}
                            onClose={() => setIsComparing(false)}
                          />
                        ) : null}
                      </>
                    ) : null}
                  </>
                )}
              </TabsContent>
            ) : null}

            {isAdmin ? (
              <TabsContent value="history" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>History</CardTitle>
                    <CardDescription>Versioning and activity timeline placeholder.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Created:</span> {formatRelativeTime(brief.createdAt)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Last updated:</span> {formatRelativeTime(brief.updatedAt)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Client review started:</span>{' '}
                      {formatRelativeTime(brief.clientReviewStartedAt)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Client review completed:</span>{' '}
                      {formatRelativeTime(brief.clientReviewCompletedAt)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Locked:</span> {formatRelativeTime(brief.lockedAt)}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}

            {!isAdmin && showClientShortlistTab ? (
              <TabsContent value="shortlist" className="space-y-4 mt-0">
                {isBeforeShortlistedStatus ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Curated Shortlist</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Your Sablecrest advisor is identifying the best providers for your needs. You will be notified
                        when your shortlist is ready.
                      </p>
                    </CardContent>
                  </Card>
                ) : shortlistMatches.length === 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Curated Shortlist</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Your shortlist is being prepared. Please check back shortly.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <ClientShortlistView
                    shortlist={shortlist}
                    providers={aecProviders}
                    onViewDossier={handleViewDossier}
                    onSelectPreference={handleClientPreferenceSelect}
                    selectedPreferences={clientShortlistPreferences}
                    projectTypeName={projectType?.name}
                  />
                )}
              </TabsContent>
            ) : null}
          </Tabs>
        </div>

        {isAdmin ? (
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Advisor Notes Panel</CardTitle>
                <CardDescription>Internal context visible to admin and ops only.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Discovery Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{brief.discoveryNotes || 'No discovery notes recorded.'}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Advisor Assessment</p>
                  <p className="text-sm whitespace-pre-wrap">{brief.advisorNotes || 'No advisor assessment recorded.'}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Risk Flags</p>
                  {highRiskFlags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No high-risk flags identified.</p>
                  ) : (
                    <ul className="space-y-2">
                      {highRiskFlags.map((risk) => (
                        <li key={risk.id} className="text-sm rounded-md border border-border px-2.5 py-2">
                          <p className="font-medium">{risk.category}</p>
                          <p className="text-muted-foreground">{risk.description}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Internal Notes</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {brief.advisorNotes || 'No additional internal notes have been captured yet.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        ) : null}
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

      <AlertDialog
        open={Boolean(selectedProviderForSelection)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProviderForSelection(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Select {selectedProviderForSelection?.name ?? 'this provider'} for this brief?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will update the brief status to Selected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionInProgress === 'selectProvider'}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSelectProvider}
              disabled={actionInProgress === 'selectProvider'}
            >
              {actionInProgress === 'selectProvider' ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : null}
              Confirm Selection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionInProgress === 'delete'}
            >
              {actionInProgress === 'delete' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
