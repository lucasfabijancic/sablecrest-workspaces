import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Plus, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type OnboardingStatus =
  | 'Pending Setup'
  | 'Brief In Progress'
  | 'Invitation Sent'
  | 'Client Active'
  | 'Paused';

interface ClientProfileRow {
  id: string;
  workspace_id: string;
  company_legal_name: string;
  annual_revenue_range: string | null;
  onboarding_status: OnboardingStatus | null;
  assigned_advisor_id: string | null;
  created_at: string;
}

interface AdvisorProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface ClientListItem {
  id: string;
  workspaceId: string;
  companyName: string;
  revenueRange: string;
  onboardingStatus: OnboardingStatus;
  assignedAdvisor: string;
  activeBriefsCount: number;
  createdAt: string;
}

const STATUS_FILTERS: Array<'All' | OnboardingStatus> = [
  'All',
  'Pending Setup',
  'Brief In Progress',
  'Invitation Sent',
  'Client Active',
  'Paused',
];

const MOCK_CLIENTS: ClientListItem[] = [
  {
    id: 'mock-client-1',
    workspaceId: 'mock-workspace-1',
    companyName: 'North Ridge Constructors',
    revenueRange: '$30M - $100M',
    onboardingStatus: 'Brief In Progress',
    assignedAdvisor: 'Sablecrest Advisor',
    activeBriefsCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
  },
  {
    id: 'mock-client-2',
    workspaceId: 'mock-workspace-2',
    companyName: 'Harbor Civil Group',
    revenueRange: '$100M - $250M',
    onboardingStatus: 'Invitation Sent',
    assignedAdvisor: 'Sablecrest Advisor',
    activeBriefsCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 'mock-client-3',
    workspaceId: 'mock-workspace-3',
    companyName: 'Cobalt Design + Build',
    revenueRange: '$250M - $500M',
    onboardingStatus: 'Client Active',
    assignedAdvisor: 'Sablecrest Advisor',
    activeBriefsCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: 'mock-client-4',
    workspaceId: 'mock-workspace-4',
    companyName: 'Atlas Specialty Contractors',
    revenueRange: '$5M - $30M',
    onboardingStatus: 'Pending Setup',
    assignedAdvisor: 'Sablecrest Advisor',
    activeBriefsCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

const statusBadgeClassName = (status: OnboardingStatus) => {
  switch (status) {
    case 'Pending Setup':
      return 'border-border bg-muted text-muted-foreground';
    case 'Brief In Progress':
      return 'border-transparent bg-warning/15 text-warning';
    case 'Invitation Sent':
      return 'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300';
    case 'Client Active':
      return 'border-transparent bg-success/15 text-success';
    case 'Paused':
      return 'border-transparent bg-destructive/15 text-destructive';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
};

const toRelativeDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return formatDistanceToNow(parsed, { addSuffix: true });
};

export default function ClientsList() {
  const navigate = useNavigate();
  const { isOpsOrAdmin, isUiShellMode, loading: authLoading } = useAuth();

  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | OnboardingStatus>('All');

  useEffect(() => {
    if (authLoading) return;
    if (!isOpsOrAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isOpsOrAdmin, navigate]);

  const fetchClients = useCallback(async () => {
    setLoading(true);

    if (isUiShellMode) {
      setClients(MOCK_CLIENTS);
      setLoading(false);
      return;
    }

    try {
      const db = supabase as any;

      const { data, error } = await db
        .from('client_profiles')
        .select('id,workspace_id,company_legal_name,annual_revenue_range,onboarding_status,assigned_advisor_id,created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const clientRows = (data ?? []) as ClientProfileRow[];
      const advisorIds = Array.from(
        new Set(
          clientRows
            .map((row) => row.assigned_advisor_id)
            .filter((advisorId): advisorId is string => typeof advisorId === 'string' && advisorId.length > 0)
        )
      );

      const advisorLookup = new Map<string, string>();

      if (advisorIds.length > 0) {
        const { data: advisorRows } = await db
          .from('profiles')
          .select('id,full_name,email')
          .in('id', advisorIds);

        (advisorRows as AdvisorProfileRow[] | null | undefined)?.forEach((advisor) => {
          advisorLookup.set(
            advisor.id,
            advisor.full_name?.trim() || advisor.email?.trim() || 'Assigned'
          );
        });
      }

      const nextClients: ClientListItem[] = clientRows.map((row) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        companyName: row.company_legal_name,
        revenueRange: row.annual_revenue_range ?? '—',
        onboardingStatus: row.onboarding_status ?? 'Pending Setup',
        assignedAdvisor: row.assigned_advisor_id
          ? advisorLookup.get(row.assigned_advisor_id) ?? 'Assigned'
          : 'Unassigned',
        activeBriefsCount: 0,
        createdAt: row.created_at,
      }));

      setClients(nextClients);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [isUiShellMode]);

  useEffect(() => {
    if (authLoading || !isOpsOrAdmin) return;
    void fetchClients();
  }, [authLoading, fetchClients, isOpsOrAdmin]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesStatus =
        statusFilter === 'All' ? true : client.onboardingStatus === statusFilter;
      const matchesSearch = client.companyName.toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [clients, search, statusFilter]);

  if (authLoading) {
    return (
      <div className="page-container">
        <PageHeader
          title="Clients"
          description="Manage client workspaces and implementation briefs."
        />
      </div>
    );
  }

  if (!isOpsOrAdmin) {
    return null;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Clients"
        description="Manage client workspaces and implementation briefs."
        actions={
          <Button asChild size="sm">
            <Link to="/admin/clients/new">
              <Plus className="h-4 w-4 mr-1.5" />
              New Client
            </Link>
          </Button>
        }
      />

      <div className="page-content space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'All' | OnboardingStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status..." />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="client-search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="client-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by company name..."
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : filteredClients.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No clients yet."
            description="No clients yet. Set up your first client from a discovery call."
            action={{
              label: '+ New Client',
              onClick: () => navigate('/admin/clients/new'),
            }}
          />
        ) : (
          <div className="border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Revenue Range</TableHead>
                  <TableHead>Onboarding Status</TableHead>
                  <TableHead>Assigned Advisor</TableHead>
                  <TableHead>Active Briefs</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/admin/briefs/create/${client.id}`}
                        className="hover:underline"
                      >
                        {client.companyName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.revenueRange}</TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClassName(client.onboardingStatus)}>
                        {client.onboardingStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.assignedAdvisor}</TableCell>
                    <TableCell className="text-muted-foreground">{client.activeBriefsCount}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {toRelativeDate(client.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
