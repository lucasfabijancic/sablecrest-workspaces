import { useEffect, useRef } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { OnboardingBanner } from '@/components/OnboardingBanner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const ONBOARDING_SEEN_KEY_PREFIX = 'sablecrest_onboarding_seen_';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, isUiShellMode, currentWorkspace, hasRole, isOpsOrAdmin } = useAuth();
  const onboardingCheckKeyRef = useRef<string | null>(null);
  const isClientRole = hasRole(['client']);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (isUiShellMode) return;
    if (!currentWorkspace?.id) return;
    if (isOpsOrAdmin) return;
    if (!isClientRole) return;

    const key = `${user.id}:${currentWorkspace.id}`;
    if (onboardingCheckKeyRef.current === key) return;
    onboardingCheckKeyRef.current = key;

    let isMounted = true;

    const checkForClientReviewBrief = async () => {
      try {
        const { data, error } = await supabase
          .from('implementation_briefs')
          .select('id')
          .eq('workspace_id', currentWorkspace.id)
          .eq('status', 'Client Review')
          .order('updated_at', { ascending: false });

        if (!isMounted || error || !data || data.length === 0) return;

        const firstUnseenBrief = data.find(
          (brief) => !localStorage.getItem(`${ONBOARDING_SEEN_KEY_PREFIX}${brief.id}`)
        );

        if (!firstUnseenBrief) return;

        localStorage.setItem(
          `${ONBOARDING_SEEN_KEY_PREFIX}${firstUnseenBrief.id}`,
          new Date().toISOString()
        );

        if (location.pathname !== '/client-onboarding') {
          navigate('/client-onboarding', { replace: true });
        }
      } catch {
        // Keep navigation uninterrupted if this lightweight check fails.
      }
    };

    void checkForClientReviewBrief();

    return () => {
      isMounted = false;
    };
  }, [
    currentWorkspace?.id,
    isClientRole,
    isOpsOrAdmin,
    isUiShellMode,
    loading,
    location.pathname,
    navigate,
    user,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // In UI shell mode, we allow navigation without a user/workspace
  // This enables UI-first development
  // Only redirect to auth if NOT in UI shell mode and no user
  if (!user && !isUiShellMode) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          {/* Show onboarding banner in UI Shell Mode */}
          {isUiShellMode && <OnboardingBanner />}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
