import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Loader2, FileText, Filter, X } from 'lucide-react';
import type { Request, RequestStatus, TimelineUrgency, SensitivityLevel } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';

const statusOptions: RequestStatus[] = ['Draft', 'Submitted', 'Scoping', 'Shortlisting', 'In Execution', 'Delivered', 'Closed'];
const urgencyOptions: TimelineUrgency[] = ['Immediate', 'Within 2 weeks', 'Within 1 month', 'Within 3 months', 'Flexible'];
const sensitivityOptions: SensitivityLevel[] = ['Standard', 'Confidential', 'Highly Confidential'];

export default function RequestsList() {
  const { currentWorkspace } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [sensitivityFilter, setSensitivityFilter] = useState<string>('all');
  const navigate = useNavigate();

  const hasFilters = statusFilter !== 'all' || urgencyFilter !== 'all' || sensitivityFilter !== 'all' || search !== '';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setUrgencyFilter('all');
    setSensitivityFilter('all');
  };

  useEffect(() => {
    if (!currentWorkspace) return;

    const fetchRequests = async () => {
      setLoading(true);
      let query = supabase
        .from('requests')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('updated_at', { ascending: false });

      if (statusFilter !== 'all' && statusOptions.includes(statusFilter as RequestStatus)) {
        query = query.eq('status', statusFilter as RequestStatus);
      }

      if (urgencyFilter !== 'all' && urgencyOptions.includes(urgencyFilter as TimelineUrgency)) {
        query = query.eq('timeline_urgency', urgencyFilter as TimelineUrgency);
      }

      if (sensitivityFilter !== 'all' && sensitivityOptions.includes(sensitivityFilter as SensitivityLevel)) {
        query = query.eq('sensitivity', sensitivityFilter as SensitivityLevel);
      }

      const { data, error } = await query;
      if (!error && data) {
        setRequests(data as Request[]);
      }
      setLoading(false);
    };

    fetchRequests();
  }, [currentWorkspace, statusFilter, urgencyFilter, sensitivityFilter]);

  const filteredRequests = requests.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  if (!currentWorkspace) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        Select a workspace to view requests.
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader 
        title="Requests" 
        description={`${filteredRequests.length} request${filteredRequests.length !== 1 ? 's' : ''}`}
        actions={
          <Button size="sm" className="h-7 text-xs" onClick={() => navigate('/requests/new')}>
            <Plus className="h-3 w-3 mr-1" />
            New Request
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-7 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            {statusOptions.map(s => (
              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-36 h-7 text-xs">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All urgencies</SelectItem>
            {urgencyOptions.map(u => (
              <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sensitivityFilter} onValueChange={setSensitivityFilter}>
          <SelectTrigger className="w-36 h-7 text-xs">
            <SelectValue placeholder="Sensitivity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All levels</SelectItem>
            {sensitivityOptions.map(s => (
              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="page-content p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={hasFilters ? "No matching requests" : "No requests yet"}
            description={hasFilters ? "Try adjusting your filters." : "Create your first request to get started."}
            action={hasFilters ? undefined : {
              label: 'New Request',
              onClick: () => navigate('/requests/new'),
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Urgency</th>
                  <th>Sensitivity</th>
                  <th>Budget</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(request => (
                  <tr
                    key={request.id}
                    onClick={() => navigate(`/requests/${request.id}`)}
                  >
                    <td className="font-medium max-w-xs truncate">{request.title}</td>
                    <td><StatusBadge status={request.status} variant="request" /></td>
                    <td>
                      {request.timeline_urgency ? (
                        <StatusBadge status={request.timeline_urgency} variant="urgency" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-muted-foreground">{request.sensitivity || '—'}</td>
                    <td className="text-muted-foreground">{request.budget_band || '—'}</td>
                    <td className="text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}