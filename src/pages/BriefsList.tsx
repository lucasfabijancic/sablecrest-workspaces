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
type BriefStatusFilter = 'All' | 'Draft' | 'In Review' | 'Locked' | 'In Execution' | 'Completed';

const STATUS_FILTERS: BriefStatusFilter[] = [
  'All',
  'Draft',
  'In Review',
  'Locked',
  'In Execution',
  'Completed',
];

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
  lockedAt: row.locked_at ?? undefined,
  lockedBy: row.locked_by ?? undefined,
  ownerId: row.owner_id ?? 'unknown-owner',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const formatRelativeTime = (isoDate: string): string => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return formatDistanceToNow(parsed, { addSuffix: true });
};

export default function BriefsList() {
  const navigate = useNavigate();
  const { currentWorkspace, isUiShellMode } = useAuth();

  const [briefs, setBriefs] = useState<ImplementationBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BriefStatusFilter>('All');

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

      return 'Untitled Draft';
    },
    [getProjectTypeName]
  );

  const fetchBriefs = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isUiShellMode) {
      setBriefs(mockBriefs);
      setLoading(false);
      return;
    }

    if (!currentWorkspace) {
      setBriefs([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('implementation_briefs')
      .select('*')
      .eq('workspace_id', currentWorkspace.id)
      .order('updated_at', { ascending: false });

    if (error) {
      setError(error.message || 'Failed to load briefs.');
      setBriefs([]);
      setLoading(false);
      return;
    }

    setBriefs((data || []).map(mapRowToBrief));
    setLoading(false);
  }, [currentWorkspace, isUiShellMode]);

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  const filteredBriefs = useMemo(() => {
    return briefs.filter((brief) => {
      const matchesStatus = statusFilter === 'All' || brief.status === statusFilter;
      const titleToSearch = getBriefTitle(brief).toLowerCase();
      const matchesSearch = titleToSearch.includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [briefs, getBriefTitle, search, statusFilter]);

  if (!currentWorkspace && !isUiShellMode) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        Select a workspace to view briefs.
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Implementation Briefs"
        description={`${filteredBriefs.length} brief${filteredBriefs.length === 1 ? '' : 's'}`}
        showBack
        actions={
          <Button size="sm" onClick={() => navigate('/briefs/new')}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Brief
          </Button>
        }
      />

      <div className="filter-bar flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={cn(
                'h-7 px-2.5 rounded-full border text-[11px] font-medium whitespace-nowrap transition-colors',
                statusFilter === status
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/40'
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[220px] max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search briefs..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      <div className="page-content p-0">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={4} columns={5} />
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchBriefs}>
              Retry
            </Button>
          </div>
        ) : filteredBriefs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No briefs yet"
            description="Create your first implementation brief to get started."
            action={{
              label: 'New Brief',
              onClick: () => navigate('/briefs/new'),
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredBriefs.map((brief) => {
                  const title = getBriefTitle(brief);
                  const projectTypeName = getProjectTypeName(brief.projectTypeId);

                  return (
                    <tr key={brief.id} onClick={() => navigate(`/briefs/${brief.id}`)}>
                      <td className="font-medium max-w-sm truncate">
                        <button
                          type="button"
                          className="hover:underline text-left"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/briefs/${brief.id}`);
                          }}
                        >
                          {title}
                        </button>
                      </td>
                      <td className="text-muted-foreground">{projectTypeName}</td>
                      <td>
                        <StatusBadge status={brief.status} variant="brief" />
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(brief.createdAt)}
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(brief.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
