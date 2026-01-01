import { Outlet, Navigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { OnboardingBanner } from '@/components/OnboardingBanner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function AppLayout() {
  const { user, loading, isUiShellMode } = useAuth();

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
