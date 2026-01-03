import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Users, Settings as SettingsIcon, Loader2, Sun, Moon, Calendar, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Membership, Profile } from '@/types/database';

interface MemberWithProfile extends Membership {
  profile?: Profile;
}

export default function Settings() {
  const navigate = useNavigate();
  const { currentWorkspace, isAdmin, refreshWorkspaces, isUiShellMode } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [members, setMembers] = useState<MemberWithProfile[]>([]);

  useEffect(() => {
    if (isUiShellMode) {
      setWorkspaceName('Demo Workspace');
      setLoading(false);
      return;
    }
    
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
  }, [currentWorkspace, isUiShellMode]);

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

  const handleTestCalendly = () => {
    if (calendlyUrl) {
      window.open(calendlyUrl, '_blank');
    }
  };

  // Allow settings access in UI shell mode
  if (!currentWorkspace && !isUiShellMode) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        Select a workspace to view settings.
      </div>
    );
  }

  if (!isAdmin && !isUiShellMode) {
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
        description="Workspace preferences and configuration"
      />

      <div className="page-content space-y-8">
        {/* Theme Settings */}
        <section className="section">
          <h3 className="section-title mb-4">Appearance</h3>
          <div className="border border-border rounded-sm p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground">
                    {theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Light</span>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <span className="text-xs text-muted-foreground">Dark</span>
              </div>
            </div>
          </div>
        </section>

        {/* Scheduling Settings */}
        <section className="section">
          <h3 className="section-title mb-4">Scheduling</h3>
          <div className="border border-border rounded-sm p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Calendly URL</p>
              <p className="text-xs text-muted-foreground mb-3">
                Primary CTA routes users to a call, not a self-serve purchase. Set your scheduling link here.
              </p>
              <div className="flex items-center gap-3 max-w-lg">
                <Input
                  placeholder="https://calendly.com/your-link"
                  value={calendlyUrl}
                  onChange={(e) => setCalendlyUrl(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestCalendly}
                  disabled={!calendlyUrl.trim()}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Workspace Settings */}
        <section className="section">
          <h3 className="section-title mb-4">Workspace</h3>
          <div className="border border-border rounded-sm p-5 space-y-4">
            <div>
              <Label htmlFor="workspaceName" className="text-sm">Workspace Name</Label>
              <div className="flex items-center gap-3 mt-2 max-w-sm">
                <Input
                  id="workspaceName"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={isUiShellMode}
                />
                <Button 
                  size="sm"
                  onClick={handleSaveWorkspace}
                  disabled={saving || workspaceName === currentWorkspace?.name || isUiShellMode}
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Team Members */}
        <section className="section">
          <h3 className="section-title mb-4">Team Members</h3>
          <div className="border border-border rounded-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
              </div>
            ) : isUiShellMode ? (
              <div className="divide-y divide-border">
                {[
                  { name: 'Demo User', email: 'demo@example.com', role: 'admin' },
                  { name: 'Jane Smith', email: 'jane@example.com', role: 'ops' },
                  { name: 'Bob Wilson', email: 'bob@example.com', role: 'client' },
                ].map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-sm bg-muted flex items-center justify-center text-sm font-medium">
                        {member.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-sm bg-muted text-muted-foreground capitalize">
                      {member.role}
                    </span>
                  </div>
                ))}
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
                  <div key={member.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-sm bg-muted flex items-center justify-center text-sm font-medium">
                        {member.profile?.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {member.profile?.full_name || member.profile?.email?.split('@')[0] || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.profile?.email}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-sm bg-muted text-muted-foreground capitalize">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Integrations Placeholder */}
        <section className="section">
          <h3 className="section-title mb-4">Integrations</h3>
          <div className="border border-border rounded-sm p-5">
            <p className="text-sm text-muted-foreground">
              Integrations with external tools will be available here. Coming soon.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
