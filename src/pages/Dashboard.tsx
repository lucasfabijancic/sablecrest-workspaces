import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText, Send, Target, ListChecks, Play, ArrowRight, Activity, Search, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import type { Request, ActivityEvent, Profile } from '@/types/database';
import { mockRequests, mockActivities, mockStatusCounts, mockWorkspace } from '@/data/mockData';

interface ActivityWithActor extends ActivityEvent {
  actor?: Profile;
}

type StatusFilter = 'all' | Request['status'];
type UrgencyFilter = 'all' | NonNullable<Request['timeline_urgency']>;

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentWorkspace, isUiShellMode } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [activities, setActivities] = useState<ActivityWithActor[]>([]);
  const [statusCounts, setStatusCounts] = useState({
    submitted: 0,
    scoping: 0,
    shortlisting: 0,
    inExecution: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all');
  const [scopingDialogOpen, setScopingDialogOpen] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState('');

  useEffect(() => {
    // In UI shell mode, use mock data
    if (isUiShellMode) {
      setRequests(mockRequests);
      setActivities(mockActivities);
      setStatusCounts(mockStatusCounts);
      setLoading(false);
      return;
    }

    if (!currentWorkspace) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch all requests for counts and display
      const { data: reqData } = await supabase
        .from('requests')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('updated_at', { ascending: false });

      if (reqData) {
        setRequests(reqData as Request[]);
        
        // Calculate status counts
        const counts = {
          submitted: reqData.filter(r => r.status === 'Submitted').length,
          scoping: reqData.filter(r => r.status === 'Scoping').length,
          shortlisting: reqData.filter(r => r.status === 'Shortlisting').length,
          inExecution: reqData.filter(r => r.status === 'In Execution').length,
        };
        setStatusCounts(counts);
      }

      // Fetch activity
      const { data: activityData } = await supabase
        .from('activity_events')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (activityData) {
        const actorIds = [...new Set(activityData.filter(a => a.actor_user_id).map(a => a.actor_user_id!))];
        if (actorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', actorIds);
          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
          const activitiesWithActors = activityData.map(a => ({
            ...a,
            actor: a.actor_user_id ? profileMap.get(a.actor_user_id) as Profile | undefined : undefined
          }));
          setActivities(activitiesWithActors);
        } else {
          setActivities(activityData as ActivityWithActor[]);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [currentWorkspace, isUiShellMode]);

  const formatEventType = (type: string): string => {
    const labels: Record<string, string> = {
      'request_submitted': 'submitted a request',
      'request_updated': 'updated a request',
      'status_changed': 'changed status',
      'shortlist_added': 'added to shortlist',
      'file_uploaded': 'uploaded a file',
      'message_sent': 'sent a message',
      'workspace_created': 'created workspace',
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  const getNextAction = (status: Request['status']): string => {
    if (status === 'Submitted' || status === 'Scoping') {
      return 'Schedule call';
    }
    return 'Review';
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || request.timeline_urgency === urgencyFilter;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const handleOpenCalendly = () => {
    if (calendlyUrl) {
      window.open(calendlyUrl, '_blank');
    }
  };

  const workspaceName = isUiShellMode ? mockWorkspace.name : currentWorkspace?.name;

  return (
    <div className="page-container">
      <PageHeader 
        title="Dashboard" 
        description="Queue + next actions across your workspaces"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setScopingDialogOpen(true)}
            >
              <Calendar className="h-3 w-3 mr-1.5" />
              Schedule Scoping Call
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => navigate('/requests/new')}
            >
              <FileText className="h-3 w-3 mr-1.5" />
              New Request
            </Button>
          </>
        }
      />

      <div className="page-content space-y-6">
        {/* KPI Grid - Funnel stages */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            label="Submitted"
            value={statusCounts.submitted}
            icon={Send}
          />
          <KPICard
            label="Scoping"
            value={statusCounts.scoping}
            icon={Target}
          />
          <KPICard
            label="Shortlisting"
            value={statusCounts.shortlisting}
            icon={ListChecks}
          />
          <KPICard
            label="In Execution"
            value={statusCounts.inExecution}
            icon={Play}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Queue */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-medium text-foreground">My Queue</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => navigate('/requests')}
                >
                  View all
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              
              {/* Filters */}
              <div className="px-4 py-2 border-b border-border flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[160px] max-w-[240px]">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 text-xs pl-7"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge 
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    className="cursor-pointer text-[10px] h-5"
                    onClick={() => setStatusFilter('all')}
                  >
                    All Status
                  </Badge>
                  <Badge 
                    variant={statusFilter === 'Submitted' ? 'default' : 'outline'}
                    className="cursor-pointer text-[10px] h-5"
                    onClick={() => setStatusFilter('Submitted')}
                  >
                    Submitted
                  </Badge>
                  <Badge 
                    variant={statusFilter === 'Scoping' ? 'default' : 'outline'}
                    className="cursor-pointer text-[10px] h-5"
                    onClick={() => setStatusFilter('Scoping')}
                  >
                    Scoping
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge 
                    variant={urgencyFilter === 'all' ? 'secondary' : 'outline'}
                    className="cursor-pointer text-[10px] h-5"
                    onClick={() => setUrgencyFilter('all')}
                  >
                    All Urgency
                  </Badge>
                  <Badge 
                    variant={urgencyFilter === 'Immediate' ? 'secondary' : 'outline'}
                    className="cursor-pointer text-[10px] h-5"
                    onClick={() => setUrgencyFilter('Immediate')}
                  >
                    Immediate
                  </Badge>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-muted-foreground text-xs">Loading...</div>
              ) : filteredRequests.length === 0 && requests.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Start with a minimal request"
                  description="We'll scope it on a call."
                  action={{
                    label: 'New Request',
                    onClick: () => navigate('/requests/new'),
                  }}
                  secondaryAction={{
                    label: 'Schedule Scoping Call',
                    onClick: () => setScopingDialogOpen(true),
                    variant: 'outline',
                  }}
                />
              ) : filteredRequests.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No requests match your filters.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Status</th>
                      <th>Urgency</th>
                      <th>Updated</th>
                      <th>Next Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.slice(0, 10).map(request => (
                      <tr key={request.id} onClick={() => navigate(`/requests/${request.id}`)}>
                        <td className="font-medium">{request.title}</td>
                        <td><StatusBadge status={request.status} variant="request" /></td>
                        <td>
                          {request.timeline_urgency ? (
                            <span className="text-xs text-muted-foreground">{request.timeline_urgency}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="text-muted-foreground">
                          {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
                        </td>
                        <td>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-[10px] px-2 text-primary hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (getNextAction(request.status) === 'Schedule call') {
                                setScopingDialogOpen(true);
                              } else {
                                navigate(`/requests/${request.id}`);
                              }
                            }}
                          >
                            {getNextAction(request.status)}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-medium text-foreground">Recent Activity</h3>
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {loading ? (
                <div className="p-8 text-center text-muted-foreground text-xs">Loading...</div>
              ) : activities.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs">
                  No activity recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activities.map(event => (
                    <div key={event.id} className="px-4 py-2.5 hover:bg-table-hover transition-colors">
                      <p className="text-xs">
                        <span className="font-medium text-foreground">
                          {event.actor?.email?.split('@')[0] || 'System'}
                        </span>
                        <span className="text-muted-foreground"> {formatEventType(event.event_type)}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scoping Call Dialog */}
      <Dialog open={scopingDialogOpen} onOpenChange={setScopingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">Schedule Scoping Call</DialogTitle>
            <DialogDescription className="text-xs">
              We scope requests on a call to ensure we fully understand your needs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="calendly-url" className="text-xs">
                Workspace Calendly URL
              </Label>
              <Input
                id="calendly-url"
                placeholder="https://calendly.com/your-workspace/scoping"
                value={calendlyUrl}
                onChange={(e) => setCalendlyUrl(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <Button
              size="sm"
              className="w-full h-8 text-xs"
              onClick={handleOpenCalendly}
              disabled={!calendlyUrl}
            >
              <ExternalLink className="h-3 w-3 mr-1.5" />
              Open Scheduling Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
