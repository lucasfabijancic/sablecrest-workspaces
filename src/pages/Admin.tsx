import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Admin() {
  const { currentWorkspace, isAdmin } = useAuth();
  const [stats, setStats] = useState({ requests: 0, providers: 0, members: 0 });

  useEffect(() => {
    if (!currentWorkspace) return;
    
    const fetchStats = async () => {
      const [reqRes, provRes, memRes] = await Promise.all([
        supabase.from('requests').select('id', { count: 'exact' }).eq('workspace_id', currentWorkspace.id),
        supabase.from('providers').select('id', { count: 'exact' }),
        supabase.from('memberships').select('id', { count: 'exact' }).eq('workspace_id', currentWorkspace.id),
      ]);
      setStats({
        requests: reqRes.count || 0,
        providers: provRes.count || 0,
        members: memRes.count || 0,
      });
    };
    fetchStats();
  }, [currentWorkspace]);

  if (!isAdmin) {
    return <div className="p-6 text-muted-foreground">Access denied.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Requests</p>
          <p className="text-2xl font-bold text-foreground">{stats.requests}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Providers</p>
          <p className="text-2xl font-bold text-foreground">{stats.providers}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Members</p>
          <p className="text-2xl font-bold text-foreground">{stats.members}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="font-medium text-foreground mb-2">Workspace: {currentWorkspace?.name}</h2>
        <p className="text-sm text-muted-foreground">Workspace management features coming soon.</p>
      </div>
    </div>
  );
}
