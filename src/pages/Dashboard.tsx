import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText, Send, Target, ListChecks, Play, ArrowRight, Activity, Search, Calendar, ExternalLink, CheckCircle } from 'lucide-react';
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

type StatusFilter = 'all' | Request['status'];

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
        .limit(8);

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
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCalendly = () => {
    if (calendlyUrl) window.open(calendlyUrl, '_blank');
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Dashboard" 
        description="Queue + next actions across your workspace"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setScopingDialogOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Call
            </Button>
            <Button size="sm" onClick={() => navigate('/requests/new')}>
              <FileText className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </>
        }
      />

      <div className="page-content space-y-10">
        {/* KPI Strip */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard label="Submitted" value={statusCounts.submitted} icon={Send} />
            <KPICard label="Scoping" value={statusCounts.scoping} icon={Target} />
            <KPICard label="Shortlisting" value={statusCounts.shortlisting} icon={ListChecks} />
            <KPICard label="Diligence" value={statusCounts.diligence} icon={CheckCircle} />
            <KPICard label="In Execution" value={statusCounts.inExecution} icon={Play} />
          </div>
        </section>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Queue */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">My Queue</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/requests')}>
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-10 h-9" 
                />
              </div>
              <div className="flex gap-2">
                {['all', 'Submitted', 'Scoping', 'Shortlisting'].map(s => (
                  <Badge 
                    key={s} 
                    variant={statusFilter === s ? 'default' : 'outline'} 
                    className="cursor-pointer px-3 py-1" 
                    onClick={() => setStatusFilter(s as StatusFilter)}
                  >
                    {s === 'all' ? 'All' : s}
                  </Badge>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="border border-border p-16 text-center text-muted-foreground">Loading...</div>
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
                      <th>Next Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.slice(0, 10).map(request => (
                      <tr key={request.id} onClick={() => navigate(`/requests/${request.id}`)}>
                        <td className="font-medium">{request.title}</td>
                        <td><StatusBadge status={request.status} variant="request" /></td>
                        <td className="text-muted-foreground">{request.timeline_urgency || '—'}</td>
                        <td className="text-muted-foreground">{formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}</td>
                        <td>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => handleNextAction(request, e)}>
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

          {/* Recent Activity */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">Recent Activity</h2>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="border border-border divide-y divide-border">
              {activities.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground text-sm">No activity yet.</div>
              ) : activities.map(event => (
                <div key={event.id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                  <p className="text-sm">
                    <span className="font-medium">{event.actor?.email?.split('@')[0] || 'System'}</span>
                    {' '}
                    <span className="text-muted-foreground">{formatEventType(event.event_type)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scoping Call Dialog */}
      <Dialog open={scopingDialogOpen} onOpenChange={setScopingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Scoping Call</DialogTitle>
            <DialogDescription>We scope requests on a call to ensure we fully understand your needs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="calendly-url">Workspace Calendly URL</Label>
              <Input 
                id="calendly-url" 
                placeholder="https://calendly.com/your-workspace/scoping" 
                value={calendlyUrl} 
                onChange={(e) => setCalendlyUrl(e.target.value)} 
              />
            </div>
            <Button className="w-full" onClick={handleOpenCalendly} disabled={!calendlyUrl}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Scheduling Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
