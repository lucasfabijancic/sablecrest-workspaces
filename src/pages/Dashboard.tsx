import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText, Building2, Users, Clock, ArrowRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import type { Request, ActivityEvent, Profile } from '@/types/database';

interface ActivityWithActor extends ActivityEvent {
  actor?: Profile;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentWorkspace, isOpsOrAdmin } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [activities, setActivities] = useState<ActivityWithActor[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeRequests: 0,
    providers: 0,
    members: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch requests
      const { data: reqData } = await supabase
        .from('requests')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (reqData) {
        setRequests(reqData as Request[]);
        const active = reqData.filter(r => !['Draft', 'Closed', 'Delivered'].includes(r.status));
        setStats(prev => ({
          ...prev,
          totalRequests: reqData.length,
          activeRequests: active.length,
        }));
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

      // Fetch counts
      const { count: memberCount } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspace.id);

      const { count: providerCount } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true });

      setStats(prev => ({
        ...prev,
        members: memberCount || 0,
        providers: providerCount || 0,
      }));

      setLoading(false);
    };

    fetchData();
  }, [currentWorkspace]);

  const formatEventType = (type: string): string => {
    const labels: Record<string, string> = {
      'request_submitted': 'submitted a request',
      'request_updated': 'updated a request',
      'status_changed': 'changed status',
      'shortlist_added': 'added to shortlist',
      'file_uploaded': 'uploaded a file',
      'message_sent': 'sent a message',
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  if (!currentWorkspace) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        Select a workspace to view dashboard.
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader 
        title="Dashboard" 
        description={`Overview for ${currentWorkspace.name}`}
      />

      <div className="page-content space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Requests"
            value={stats.totalRequests}
            icon={FileText}
          />
          <KPICard
            label="Active"
            value={stats.activeRequests}
            icon={Clock}
          />
          <KPICard
            label="Providers"
            value={stats.providers}
            icon={Building2}
          />
          <KPICard
            label="Team Members"
            value={stats.members}
            icon={Users}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Requests */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-medium text-foreground">Recent Requests</h3>
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
              {loading ? (
                <div className="p-8 text-center text-muted-foreground text-xs">Loading...</div>
              ) : requests.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No requests yet"
                  description="Create your first request to get started."
                  action={{
                    label: 'New Request',
                    onClick: () => navigate('/requests/new'),
                  }}
                />
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(request => (
                      <tr key={request.id} onClick={() => navigate(`/requests/${request.id}`)}>
                        <td className="font-medium">{request.title}</td>
                        <td><StatusBadge status={request.status} variant="request" /></td>
                        <td className="text-muted-foreground">
                          {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
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
    </div>
  );
}