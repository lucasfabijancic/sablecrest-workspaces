import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Settings as SettingsIcon, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Membership, Profile } from '@/types/database';

interface MemberWithProfile extends Membership {
  profile?: Profile;
}

export default function Settings() {
  const navigate = useNavigate();
  const { currentWorkspace, isAdmin, refreshWorkspaces } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [members, setMembers] = useState<MemberWithProfile[]>([]);

  useEffect(() => {
    if (!currentWorkspace) return;
    
    setWorkspaceName(currentWorkspace.name);
    
    const fetchMembers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('memberships')
        .select('*')
        .eq('workspace_id', currentWorkspace.id);

      if (data) {
        const userIds = data.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        setMembers(data.map(m => ({ ...m, profile: profileMap.get(m.user_id) as Profile | undefined })));
      }
      setLoading(false);
    };

    fetchMembers();
  }, [currentWorkspace]);

  const handleSaveWorkspace = async () => {
    if (!currentWorkspace || !workspaceName.trim()) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('workspaces')
      .update({ name: workspaceName.trim() })
      .eq('id', currentWorkspace.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Workspace name updated.' });
      refreshWorkspaces();
    }
    setSaving(false);
  };

  if (!currentWorkspace) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        Select a workspace to view settings.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="page-container">
        <PageHeader title="Settings" />
        <div className="page-content">
          <EmptyState
            icon={SettingsIcon}
            title="Access denied"
            description="Only workspace admins can access settings."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader 
        title="Settings" 
        description="Manage your workspace and team"
      />

      <div className="page-content space-y-6">
        {/* Workspace Settings */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-medium text-foreground">Workspace</h3>
          
          <div className="max-w-sm">
            <Label htmlFor="workspaceName" className="text-xs">Name</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="workspaceName"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="h-8 text-xs"
              />
              <Button 
                size="sm" 
                className="h-8 text-xs"
                onClick={handleSaveWorkspace}
                disabled={saving || workspaceName === currentWorkspace.name}
              >
                {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Team Members</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No members"
              description="Team members will appear here."
            />
          ) : (
            <div className="divide-y divide-border">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                      {member.profile?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {member.profile?.full_name || member.profile?.email?.split('@')[0] || 'Unknown'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{member.profile?.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-0.5 bg-secondary rounded">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}