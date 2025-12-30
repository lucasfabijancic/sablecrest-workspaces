import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Membership, Workspace, AppRole } from '@/types/database';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

  const currentMembership = memberships.find(
    m => m.workspace_id === currentWorkspace?.id
  ) || null;

  const hasRole = (roles: AppRole[]) => {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        currentWorkspace,
        currentMembership,
        workspaces,
        memberships,
        setCurrentWorkspace,
        refreshWorkspaces,
        hasRole,
        isOpsOrAdmin,
        isAdmin,
        signOut,
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
