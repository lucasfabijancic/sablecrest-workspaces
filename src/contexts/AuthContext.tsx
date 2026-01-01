import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Membership, Workspace, AppRole } from '@/types/database';
import { mockWorkspace, mockMembership, mockProfile } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  currentWorkspace: Workspace | null;
  currentMembership: Membership | null;
  workspaces: Workspace[];
  memberships: Membership[];
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspaces: () => Promise<void>;
  hasRole: (roles: AppRole[]) => boolean;
  isOpsOrAdmin: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  isUiShellMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

  // UI Shell Mode: when user is logged in but has no workspaces, or when no user
  // This allows navigation for UI development purposes
  const isUiShellMode = !loading && (!user || workspaces.length === 0);

  const currentMembership = isUiShellMode 
    ? mockMembership 
    : memberships.find(m => m.workspace_id === currentWorkspace?.id) || null;

  const hasRole = (roles: AppRole[]) => {
    if (isUiShellMode) {
      // In UI shell mode, simulate admin role for full access
      return roles.includes('admin');
    }
    return currentMembership ? roles.includes(currentMembership.role) : false;
  };

  const isOpsOrAdmin = hasRole(['ops', 'admin']);
  const isAdmin = hasRole(['admin']);

  const refreshWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setMemberships([]);
      return;
    }

    const { data: membershipData, error } = await supabase
      .from('memberships')
      .select(`
        *,
        workspace:workspaces(*)
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching memberships:', error);
      return;
    }

    const membershipsList = (membershipData || []) as any[];
    const workspacesList = membershipsList
      .map(m => m.workspace)
      .filter(Boolean) as Workspace[];

    setMemberships(membershipsList.map(m => ({
      id: m.id,
      workspace_id: m.workspace_id,
      user_id: m.user_id,
      role: m.role,
      created_at: m.created_at,
      workspace: m.workspace,
    })));
    setWorkspaces(workspacesList);

    // Auto-select workspace if only one or none selected
    if (workspacesList.length === 1 && !currentWorkspace) {
      setCurrentWorkspace(workspacesList[0]);
    } else if (currentWorkspace) {
      // Verify current workspace is still valid
      const stillValid = workspacesList.find(w => w.id === currentWorkspace.id);
      if (!stillValid) {
        setCurrentWorkspace(workspacesList[0] || null);
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentWorkspace(null);
    setWorkspaces([]);
    setMemberships([]);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch workspaces when user changes
  useEffect(() => {
    if (user) {
      refreshWorkspaces();
    } else {
      setWorkspaces([]);
      setMemberships([]);
      setCurrentWorkspace(null);
    }
  }, [user]);

  // In UI shell mode, provide mock workspace as current
  const effectiveWorkspace = isUiShellMode ? mockWorkspace : currentWorkspace;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        currentWorkspace: effectiveWorkspace,
        currentMembership,
        workspaces: isUiShellMode ? [mockWorkspace] : workspaces,
        memberships: isUiShellMode ? [mockMembership] : memberships,
        setCurrentWorkspace,
        refreshWorkspaces,
        hasRole,
        isOpsOrAdmin,
        isAdmin,
        signOut,
        isUiShellMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
