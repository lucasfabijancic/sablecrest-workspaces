import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Plus, Search, Loader2 } from 'lucide-react';
import type { Request, RequestStatus } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';

const statusOptions: RequestStatus[] = ['Draft', 'Submitted', 'Scoping', 'Shortlisting', 'In Execution', 'Delivered', 'Closed'];

export default function RequestsList() {
  const { currentWorkspace, isOpsOrAdmin } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentWorkspace) return;

    const fetchRequests = async () => {
      setLoading(true);
      let query = supabase
        .from('requests')
        .select('*, workspace:workspaces(*)')
        .eq('workspace_id', currentWorkspace.id)
        .order('updated_at', { ascending: false });

      if (statusFilter !== 'all' && statusOptions.includes(statusFilter as RequestStatus)) {
        query = query.eq('status', statusFilter as RequestStatus);
      }

      const { data, error } = await query;
      if (!error && data) {
        setRequests(data as Request[]);
      }
      setLoading(false);
    };

    fetchRequests();
  }, [currentWorkspace, statusFilter]);

  const filteredRequests = requests.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  if (!currentWorkspace) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Select a workspace to view requests.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Requests</h1>
        <Button onClick={() => navigate('/requests/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No requests found.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Urgency</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => (
                <tr
                  key={request.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/requests/${request.id}`)}
                >
                  <td className="font-medium text-foreground">{request.title}</td>
                  <td><StatusBadge status={request.status} variant="request" /></td>
                  <td>
                    {request.timeline_urgency && (
                      <StatusBadge status={request.timeline_urgency} variant="urgency" />
                    )}
                  </td>
                  <td className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
