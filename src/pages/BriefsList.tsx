import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { aecProjectTypes } from '@/data/aecProjectTypes';
import { mockBriefs } from '@/data/mockBriefs';
import type {
  BriefConstraints,
  BriefRequirement,
  BriefStatus,
  BusinessContext,
  FieldSource,
  ImplementationBrief,
  RiskFactor,
  SuccessCriterion,
} from '@/types/brief';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/Skeletons';
import { cn } from '@/lib/utils';

type BriefRow = Database['public']['Tables']['implementation_briefs']['Row'];
type ClientProfileRow = Database['public']['Tables']['client_profiles']['Row'];
type WorkspaceRow = Database['public']['Tables']['workspaces']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type AdminStatusFilter =
  | 'All'
  | 'Advisor Draft'
  | 'Client Review'
  | 'In Review'
  | 'Locked'
  | 'In Execution'
  | 'Completed';

type ClientStatusFilter =
  | 'All'
  | 'Awaiting Your Review'
  | 'Submitted'
  | 'In Progress'
  | 'Completed';

const ADMIN_STATUS_FILTERS: AdminStatusFilter[] = [
  'All',
  'Advisor Draft',
  'Client Review',
  'In Review',
  'Locked',
  'In Execution',
  'Completed',
];

const CLIENT_STATUS_FILTERS: ClientStatusFilter[] = [
  'All',
  'Awaiting Your Review',
  'Submitted',
  'In Progress',
  'Completed',
];

const IN_PROGRESS_CLIENT_STATUSES: BriefStatus[] = ['Locked', 'Matching', 'Shortlisted'];

const EMPTY_BUSINESS_CONTEXT: BusinessContext = {
  companyName: '',
  companySize: '',
  industry: '',
  currentState: '',
  desiredOutcome: '',
  keyStakeholders: '',
  decisionTimeline: '',
};

const EMPTY_CONSTRAINTS: BriefConstraints = {
  budget: {
    min: undefined,
    max: undefined,
    flexibility: 'Flexible',
  },
  timeline: {
    urgency: 'Flexible',
    hardDeadline: '',
    reason: '',
  },
  sensitivity: {
    level: 'Standard',
    concerns: [],
  },
  technical: {
    mustIntegrate: [],
    cannotChange: [],
    preferences: [],
  },
};

const EMPTY_INTAKE_RESPONSES: Record<string, any> = {};

const isPlainObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const toBusinessContext = (value: unknown): BusinessContext => {
  if (!isPlainObject(value)) return EMPTY_BUSINESS_CONTEXT;

  return {
    companyName: typeof value.companyName === 'string' ? value.companyName : '',
    companySize: typeof value.companySize === 'string' ? value.companySize : '',
    industry: typeof value.industry === 'string' ? value.industry : '',
    currentState: typeof value.currentState === 'string' ? value.currentState : '',
    desiredOutcome: typeof value.desiredOutcome === 'string' ? value.desiredOutcome : '',
    keyStakeholders: typeof value.keyStakeholders === 'string' ? value.keyStakeholders : '',
    decisionTimeline: typeof value.decisionTimeline === 'string' ? value.decisionTimeline : '',
  };
};

const toBriefConstraints = (value: unknown): BriefConstraints => {
  if (!isPlainObject(value)) return EMPTY_CONSTRAINTS;

  const budget = isPlainObject(value.budget) ? value.budget : {};
  const timeline = isPlainObject(value.timeline) ? value.timeline : {};
  const sensitivity = isPlainObject(value.sensitivity) ? value.sensitivity : {};
  const technical = isPlainObject(value.technical) ? value.technical : {};

  return {
    budget: {
      min: typeof budget.min === 'number' ? budget.min : undefined,
      max: typeof budget.max === 'number' ? budget.max : undefined,
      flexibility:
        typeof budget.flexibility === 'string' && budget.flexibility === 'Firm'
          ? 'Firm'
          : 'Flexible',
    },
    timeline: {
      urgency:
        typeof timeline.urgency === 'string' && timeline.urgency
          ? (timeline.urgency as BriefConstraints['timeline']['urgency'])
          : 'Flexible',
      hardDeadline: typeof timeline.hardDeadline === 'string' ? timeline.hardDeadline : '',
      reason: typeof timeline.reason === 'string' ? timeline.reason : '',
    },
    sensitivity: {
      level:
        typeof sensitivity.level === 'string' && sensitivity.level
          ? (sensitivity.level as BriefConstraints['sensitivity']['level'])
          : 'Standard',
      concerns: toStringArray(sensitivity.concerns),
    },
    technical: {
      mustIntegrate: toStringArray(technical.mustIntegrate),
      cannotChange: toStringArray(technical.cannotChange),
      preferences: toStringArray(technical.preferences),
    },
  };
};

const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const toFieldSources = (value: unknown): Record<string, FieldSource> | undefined => {
  if (!isPlainObject(value)) return undefined;

  const result: Record<string, FieldSource> = {};

  Object.entries(value).forEach(([path, sourceValue]) => {
    if (!isPlainObject(sourceValue)) return;

    const source = sourceValue.source;
    const normalizedSource: FieldSource['source'] =
      source === 'advisor' || source === 'client' || source === 'document' || source === 'ai'
        ? source
        : 'advisor';

    result[path] = {
      source: normalizedSource,
      confirmedByClient: sourceValue.confirmedByClient === true,
      confirmedAt: typeof sourceValue.confirmedAt === 'string' ? sourceValue.confirmedAt : undefined,
      clientNotes: typeof sourceValue.clientNotes === 'string' ? sourceValue.clientNotes : undefined,
      markedForClientInput: sourceValue.markedForClientInput === true,
    };
  });

  return Object.keys(result).length > 0 ? result : undefined;
};

const toClientNotes = (value: unknown): Record<string, string> | undefined => {
  if (!isPlainObject(value)) return undefined;

  const result: Record<string, string> = {};

  Object.entries(value).forEach(([path, note]) => {
    if (typeof note !== 'string') return;
    if (note.trim().length === 0) return;
    result[path] = note;
  });

  return Object.keys(result).length > 0 ? result : undefined;
};

const mapRowToBrief = (row: BriefRow): ImplementationBrief => ({
  id: row.id,
  workspaceId: row.workspace_id,
  title: row.title ?? '',
  projectTypeId: row.project_type_id,
  status: row.status as BriefStatus,
  currentVersion: row.current_version ?? 1,
  businessContext: toBusinessContext(row.business_context),
  requirements: toArray<BriefRequirement>(row.requirements),
  successCriteria: toArray<SuccessCriterion>(row.success_criteria),
  constraints: toBriefConstraints(row.constraints),
  riskFactors: toArray<RiskFactor>(row.risk_factors),
  intakeResponses: isPlainObject(row.intake_responses) ? row.intake_responses : EMPTY_INTAKE_RESPONSES,
  advisorId: row.advisor_id ?? undefined,
  advisorNotes: row.advisor_notes ?? undefined,
  discoveryDate: row.discovery_date ?? undefined,
  discoveryNotes: row.discovery_notes ?? undefined,
  clientReviewStartedAt: row.client_review_started_at ?? undefined,
  clientReviewCompletedAt: row.client_review_completed_at ?? undefined,
  fieldSources: toFieldSources(row.field_sources),
  clientNotes: toClientNotes(row.client_notes),
  lockedAt: row.locked_at ?? undefined,
  lockedBy: row.locked_by ?? undefined,
  ownerId: row.owner_id ?? 'unknown-owner',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const formatRelativeTime = (isoDate: string): string => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return formatDistanceToNow(parsed, { addSuffix: true });
};

const matchesAdminStatusFilter = (brief: ImplementationBrief, filter: AdminStatusFilter): boolean => {
  if (filter === 'All') return true;
  return brief.status === filter;
};

const matchesClientStatusFilter = (brief: ImplementationBrief, filter: ClientStatusFilter): boolean => {
  if (brief.status === 'Advisor Draft') return false;

  switch (filter) {
    case 'All':
      return true;
    case 'Awaiting Your Review':
      return brief.status === 'Client Review';
    case 'Submitted':
      return brief.status === 'In Review';
    case 'In Progress':
      return IN_PROGRESS_CLIENT_STATUSES.includes(brief.status);
    case 'Completed':
      return brief.status === 'Completed';
    default:
      return true;
  }
};

export default function BriefsList() {
  const navigate = useNavigate();
  const { currentWorkspace, isUiShellMode, isOpsOrAdmin } = useAuth();

  const isInternalView = isOpsOrAdmin;

  const [briefs, setBriefs] = useState<ImplementationBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<AdminStatusFilter>('All');
  const [clientStatusFilter, setClientStatusFilter] = useState<ClientStatusFilter>('All');

  const [workspaceNameById, setWorkspaceNameById] = useState<Record<string, string>>({});
  const [clientCompanyByWorkspaceId, setClientCompanyByWorkspaceId] = useState<Record<string, string>>({});
  const [advisorNameById, setAdvisorNameById] = useState<Record<string, string>>({});

  const projectTypeLookup = useMemo(
    () => new Map(aecProjectTypes.map((projectType) => [projectType.id, projectType.name])),
    []
  );

  const getProjectTypeName = useCallback(
    (projectTypeId: string) => {
      if (!projectTypeId) return 'Unspecified';
      if (projectTypeId === 'other') return 'Other / Custom';
      return projectTypeLookup.get(projectTypeId) ?? 'Unknown type';
    },
    [projectTypeLookup]
  );

  const getBriefTitle = useCallback(
    (brief: ImplementationBrief) => {
      const explicitTitle = brief.title?.trim();
      if (explicitTitle) return explicitTitle;

      const projectTypeName = getProjectTypeName(brief.projectTypeId);
      if (projectTypeName && projectTypeName !== 'Unknown type' && projectTypeName !== 'Unspecified') {
        return projectTypeName;
      }

      return 'Untitled Brief';
    },
    [getProjectTypeName]
  );

  const getClientCompanyName = useCallback(
    (brief: ImplementationBrief) => {
      return (
        clientCompanyByWorkspaceId[brief.workspaceId] ||
        workspaceNameById[brief.workspaceId] ||
        brief.businessContext.companyName ||
        'Client'
      );
    },
    [clientCompanyByWorkspaceId, workspaceNameById]
  );

  const getAdvisorName = useCallback(
    (brief: ImplementationBrief) => {
      if (!brief.advisorId) return 'Unassigned';
      return advisorNameById[brief.advisorId] || brief.advisorId;
    },
    [advisorNameById]
  );

  const fetchBriefs = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isUiShellMode) {
      const mockWorkspaceNames: Record<string, string> = {
        'mock-workspace-001': 'Demo Workspace',
      };
      const mockClientCompanies: Record<string, string> = {};
      mockBriefs.forEach((brief) => {
        if (!mockClientCompanies[brief.workspaceId]) {
          mockClientCompanies[brief.workspaceId] = brief.businessContext.companyName || 'Client';
        }
      });

      setBriefs(mockBriefs);
      setWorkspaceNameById(mockWorkspaceNames);
      setClientCompanyByWorkspaceId(mockClientCompanies);
      setAdvisorNameById({
        'mock-advisor-001': 'Alex Carter',
        'mock-advisor-002': 'Jordan Lee',
      });
      setLoading(false);
      return;
    }

    if (!isInternalView && !currentWorkspace) {
      setBriefs([]);
      setWorkspaceNameById({});
      setClientCompanyByWorkspaceId({});
      setAdvisorNameById({});
      setLoading(false);
      return;
    }

    const briefsQuery = supabase
      .from('implementation_briefs')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!isInternalView && currentWorkspace) {
      briefsQuery.eq('workspace_id', currentWorkspace.id);
    }

    const clientProfilesQuery = supabase
      .from('client_profiles')
      .select('workspace_id, company_legal_name, assigned_advisor_id');

    if (!isInternalView && currentWorkspace) {
      clientProfilesQuery.eq('workspace_id', currentWorkspace.id);
    }

    const workspacesQuery = supabase
      .from('workspaces')
      .select('id, name');

    if (!isInternalView && currentWorkspace) {
      workspacesQuery.eq('id', currentWorkspace.id);
    }

    const [briefsResult, clientProfilesResult, workspacesResult] = await Promise.all([
      briefsQuery,
      clientProfilesQuery,
      workspacesQuery,
    ]);

    if (briefsResult.error) {
      setError(briefsResult.error.message || 'Failed to load briefs.');
      setBriefs([]);
      setWorkspaceNameById({});
      setClientCompanyByWorkspaceId({});
      setAdvisorNameById({});
      setLoading(false);
      return;
    }

    const nextBriefs = (briefsResult.data ?? []).map(mapRowToBrief);

    const nextWorkspaceNames: Record<string, string> = {};
    ((workspacesResult.data ?? []) as WorkspaceRow[]).forEach((workspace) => {
      nextWorkspaceNames[workspace.id] = workspace.name;
    });

    const nextClientCompanies: Record<string, string> = {};
    ((clientProfilesResult.data ?? []) as Pick<ClientProfileRow, 'workspace_id' | 'company_legal_name' | 'assigned_advisor_id'>[])
      .forEach((profile) => {
        if (!nextClientCompanies[profile.workspace_id]) {
          nextClientCompanies[profile.workspace_id] = profile.company_legal_name;
        }
      });

    const advisorIds = new Set<string>();

    nextBriefs.forEach((brief) => {
      if (brief.advisorId) advisorIds.add(brief.advisorId);
    });

    ((clientProfilesResult.data ?? []) as Pick<ClientProfileRow, 'workspace_id' | 'company_legal_name' | 'assigned_advisor_id'>[])
      .forEach((profile) => {
        if (profile.assigned_advisor_id) advisorIds.add(profile.assigned_advisor_id);
      });

    const nextAdvisorNames: Record<string, string> = {};

    if (advisorIds.size > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', Array.from(advisorIds));

      ((profilesData ?? []) as Pick<ProfileRow, 'id' | 'full_name' | 'email'>[]).forEach((profile) => {
        const displayName = profile.full_name?.trim() || profile.email?.trim() || profile.id;
        nextAdvisorNames[profile.id] = displayName;
      });
    }

    setBriefs(nextBriefs);
    setWorkspaceNameById(nextWorkspaceNames);
    setClientCompanyByWorkspaceId(nextClientCompanies);
    setAdvisorNameById(nextAdvisorNames);
    setLoading(false);
  }, [currentWorkspace, isInternalView, isUiShellMode]);

  useEffect(() => {
    void fetchBriefs();
  }, [fetchBriefs]);

  const filteredBriefs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return briefs.filter((brief) => {
      const matchesStatus = isInternalView
        ? matchesAdminStatusFilter(brief, adminStatusFilter)
        : matchesClientStatusFilter(brief, clientStatusFilter);

      if (!matchesStatus) return false;

      if (!query) return true;

      const title = getBriefTitle(brief).toLowerCase();
      const projectType = getProjectTypeName(brief.projectTypeId).toLowerCase();

      if (isInternalView) {
        const clientCompany = getClientCompanyName(brief).toLowerCase();
        const advisorName = getAdvisorName(brief).toLowerCase();
        return (
          title.includes(query) ||
          projectType.includes(query) ||
          clientCompany.includes(query) ||
          advisorName.includes(query)
        );
      }

      return title.includes(query) || projectType.includes(query);
    });
  }, [
    adminStatusFilter,
    briefs,
    clientStatusFilter,
    getAdvisorName,
    getBriefTitle,
    getClientCompanyName,
    getProjectTypeName,
    isInternalView,
    search,
  ]);

  const headerTitle = isInternalView ? 'Implementation Briefs' : 'My Briefs';

  if (!currentWorkspace && !isUiShellMode && !isInternalView) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        Select a workspace to view your briefs.
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title={headerTitle}
        description={`${filteredBriefs.length} brief${filteredBriefs.length === 1 ? '' : 's'}`}
        showBack
        actions={
          isInternalView ? (
            <Button size="sm" onClick={() => navigate('/admin/briefs/create')}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create Brief
            </Button>
          ) : undefined
        }
      />

      <div className="filter-bar flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(isInternalView ? ADMIN_STATUS_FILTERS : CLIENT_STATUS_FILTERS).map((status) => {
            const isActive = isInternalView
              ? adminStatusFilter === (status as AdminStatusFilter)
              : clientStatusFilter === (status as ClientStatusFilter);

            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  if (isInternalView) {
                    setAdminStatusFilter(status as AdminStatusFilter);
                  } else {
                    setClientStatusFilter(status as ClientStatusFilter);
                  }
                }}
                className={cn(
                  'h-7 px-2.5 rounded-full border text-[11px] font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/40'
                )}
              >
                {status}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 min-w-[220px] max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isInternalView ? 'Search briefs, clients, advisors...' : 'Search briefs...'}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      <div className="page-content p-0">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={4} columns={isInternalView ? 6 : 5} />
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchBriefs()}>
              Retry
            </Button>
          </div>
        ) : filteredBriefs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={isInternalView ? 'No briefs found' : 'No briefs yet'}
            description={
              isInternalView
                ? 'No implementation briefs match your current filters.'
                : 'Your advisor has not shared any briefs with you yet.'
            }
            action={
              isInternalView
                ? {
                    label: 'Create Brief',
                    onClick: () => navigate('/admin/briefs/create'),
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            {isInternalView ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client Company Name</th>
                    <th>Brief Title</th>
                    <th>Project Type</th>
                    <th>Status</th>
                    <th>Advisor</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBriefs.map((brief) => {
                    const title = getBriefTitle(brief);
                    const projectTypeName = getProjectTypeName(brief.projectTypeId);
                    const clientCompany = getClientCompanyName(brief);
                    const advisorName = getAdvisorName(brief);

                    return (
                      <tr key={brief.id} onClick={() => navigate(`/briefs/${brief.id}`)}>
                        <td className="font-medium max-w-xs truncate">{clientCompany}</td>
                        <td className="max-w-sm truncate">{title}</td>
                        <td className="text-muted-foreground">{projectTypeName}</td>
                        <td>
                          <StatusBadge status={brief.status} variant="brief" />
                        </td>
                        <td className="text-muted-foreground">{advisorName}</td>
                        <td className="text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(brief.updatedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Brief Title</th>
                    <th>Project Type</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBriefs.map((brief) => {
                    const title = getBriefTitle(brief);
                    const projectTypeName = getProjectTypeName(brief.projectTypeId);
                    const needsReview = brief.status === 'Client Review';

                    return (
                      <tr key={brief.id} onClick={() => navigate(`/briefs/${brief.id}`)}>
                        <td className="font-medium max-w-sm truncate">{title}</td>
                        <td className="text-muted-foreground">{projectTypeName}</td>
                        <td>
                          <StatusBadge status={brief.status} variant="brief" />
                        </td>
                        <td className="text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(brief.updatedAt)}
                        </td>
                        <td className="text-right">
                          {needsReview ? (
                            <Button
                              size="sm"
                              className="h-7"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/briefs/${brief.id}/review`);
                              }}
                            >
                              Review Now
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
