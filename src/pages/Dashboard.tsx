import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText, Send, Target, ListChecks, Play, ArrowRight, Activity, Search, Calendar, ExternalLink, CheckCircle, Clock } from 'lucide-react';
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
import { mockRequests, mockActivities, mockStatusCounts } from '@/data/mockData';

interface ActivityWithActor extends ActivityEvent {
  actor?: Profile;
}

type StatusFilter = 'all' | 'needs-action' | Request['status'];

const pipelineStages = [
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'scoping', label: 'Scoping', icon: Target },
  { key: 'shortlisting', label: 'Shortlisting', icon: ListChecks },
  { key: 'diligence', label: 'Diligence', icon: CheckCircle },
  { key: 'inExecution', label: 'Execution', icon: Play },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentWorkspace, isUiShellMode } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [activities, setActivities] = useState<ActivityWithActor[]>([]);
  const [statusCounts, setStatusCounts] = useState({
    submitted: 0,
    scoping: 0,
    shortlisting: 0,
    diligence: 0,
    inExecution: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [scopingDialogOpen, setScopingDialogOpen] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState('');

  useEffect(() => {
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
      const { data: reqData } = await supabase
        .from('requests')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('updated_at', { ascending: false });

      if (reqData) {
        setRequests(reqData as Request[]);
        setStatusCounts({
          submitted: reqData.filter(r => r.status === 'Submitted').length,
          scoping: reqData.filter(r => r.status === 'Scoping').length,
          shortlisting: reqData.filter(r => r.status === 'Shortlisting').length,
          diligence: 0,
          inExecution: reqData.filter(r => r.status === 'In Execution').length,
        });
      }

      const { data: activityData } = await supabase
        .from('activity_events')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (activityData) {
        setActivities(activityData as ActivityWithActor[]);
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
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  const getNextAction = (status: Request['status']) => {
    switch (status) {
      case 'Submitted':
      case 'Scoping':
        return { label: 'Schedule call', action: 'call' };
      case 'Shortlisting':
        return { label: 'Review shortlist', action: 'shortlist' };
      default:
        return { label: 'Review', action: 'review' };
    }
  };

  const handleNextAction = (request: Request, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextAction = getNextAction(request.status);
    if (nextAction.action === 'call') {
      setScopingDialogOpen(true);
    } else {
      navigate(`/requests/${request.id}`);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'needs-action' && ['Submitted', 'Scoping'].includes(request.status)) ||
      request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCalendly = () => {
    if (calendlyUrl) window.open(calendlyUrl, '_blank');
  };

  const totalActive = statusCounts.submitted + statusCounts.scoping + statusCounts.shortlisting + statusCounts.diligence + statusCounts.inExecution;
  const needsAction = statusCounts.submitted + statusCounts.scoping;

  return (
    <div className="page-container">
      <PageHeader 
        title="Dashboard" 
        description="Queue + next actions across your workspace"
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => setScopingDialogOpen(true)}>
              <Calendar className="h-3 w-3 mr-1.5" />
              Schedule Call
            </Button>
            <Button size="sm" className="h-8 text-[11px]" onClick={() => navigate('/requests/new')}>
              <FileText className="h-3 w-3 mr-1.5" />
              New Request
            </Button>
          </>
        }
      />

      <div className="page-content space-y-6">
        {/* Pipeline Summary Strip */}
        <section>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tabular-nums">{totalActive}</span>
              <span className="text-[11px] text-muted-foreground">Active</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-warning" />
              <span className="text-[12px] font-medium tabular-nums">{needsAction}</span>
              <span className="text-[11px] text-muted-foreground">need action</span>
            </div>
          </div>
          
          <div className="pipeline-strip">
            {pipelineStages.map((stage) => {
              const count = statusCounts[stage.key as keyof typeof statusCounts];
              return (
                <div 
                  key={stage.key} 
                  className={`pipeline-item ${count > 0 ? 'active' : ''}`}
                >
                  <stage.icon className="h-3 w-3" />
                  <span>{stage.label}</span>
                  <span className="tabular-nums font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* My Queue - takes 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">My Queue</h2>
              <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => navigate('/requests')}>
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px] max-w-[240px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-8 h-8 text-[11px]" 
                />
              </div>
              <div className="flex gap-1">
                {['all', 'needs-action', 'Shortlisting'].map(s => (
                  <Badge 
                    key={s} 
                    variant={statusFilter === s ? 'default' : 'outline'} 
                    className="cursor-pointer px-2 py-0.5 text-[10px]" 
                    onClick={() => setStatusFilter(s as StatusFilter)}
                  >
                    {s === 'all' ? 'All' : s === 'needs-action' ? 'Needs action' : s}
                  </Badge>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="border border-border p-12 text-center text-muted-foreground text-[12px]">Loading...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="border border-border">
                <EmptyState 
                  icon={FileText} 
                  title="Start with a minimal request" 
                  description="We'll scope it on a call."
                  action={{ label: 'New Request', onClick: () => navigate('/requests/new') }}
                  secondaryAction={{ label: 'Schedule Call', onClick: () => setScopingDialogOpen(true), variant: 'outline' }}
                />
              </div>
            ) : (
              <div className="border border-border overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Status</th>
                      <th>Urgency</th>
                      <th>Updated</th>
                      <th className="w-28">Next Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.slice(0, 8).map(request => (
                      <tr key={request.id} onClick={() => navigate(`/requests/${request.id}`)}>
                        <td className="font-medium">{request.title}</td>
                        <td><StatusBadge status={request.status} variant="request" /></td>
                        <td className="text-muted-foreground">{request.timeline_urgency || '—'}</td>
                        <td className="text-muted-foreground">{formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}</td>
                        <td>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={(e) => handleNextAction(request, e)}>
                            {getNextAction(request.status).label}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right rail - Recent Activity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Activity</h2>
              <Activity className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="border border-border divide-y divide-border">
              {activities.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-[11px]">No activity yet.</div>
              ) : activities.slice(0, 5).map(event => (
                <div key={event.id} className="px-3 py-3 hover:bg-muted/30 transition-colors">
                  <p className="text-[11px]">
                    <span className="font-medium">{event.actor?.email?.split('@')[0] || 'System'}</span>
                    {' '}
                    <span className="text-muted-foreground">{formatEventType(event.event_type)}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</p>
                </div>
              ))}
            </div>

            {/* Upcoming Calls placeholder */}
            <div className="border border-border p-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Upcoming</h3>
              </div>
              <p className="text-[11px] text-muted-foreground">No calls scheduled</p>
              <Button variant="outline" size="sm" className="w-full mt-3 h-7 text-[10px]" onClick={() => setScopingDialogOpen(true)}>
                Schedule a call
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scoping Call Dialog */}
      <Dialog open={scopingDialogOpen} onOpenChange={setScopingDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Schedule Scoping Call</DialogTitle>
            <DialogDescription className="text-[12px]">We scope requests on a call to ensure we fully understand your needs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="calendly-url" className="text-[11px]">Workspace Calendly URL</Label>
              <Input 
                id="calendly-url" 
                placeholder="https://calendly.com/your-workspace/scoping" 
                value={calendlyUrl} 
                onChange={(e) => setCalendlyUrl(e.target.value)} 
                className="h-8 text-[12px]"
              />
            </div>
            <Button className="w-full h-8 text-[11px]" onClick={handleOpenCalendly} disabled={!calendlyUrl}>
              <ExternalLink className="h-3 w-3 mr-1.5" />
              Open Scheduling Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}