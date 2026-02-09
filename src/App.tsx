import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppLayout } from "./components/layout/AppLayout";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import RequestsList from "./pages/RequestsList";
import RequestDetail from "./pages/RequestDetail";
import NewRequest from "./pages/NewRequest";
import BriefsList from "./pages/BriefsList";
import NewBrief from "./pages/briefs/NewBrief";
import ClientSetup from "./pages/admin/ClientSetup";
import AdminBriefCreator from "./pages/admin/AdminBriefCreator";
import ClientsList from "./pages/admin/ClientsList";
import ProviderRegistry from "./pages/ProviderRegistry";
import Scorecards from "./pages/Scorecards";
import ShortlistCompare from "./pages/ShortlistCompare";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import ProviderPortal, { ProviderProfile, ProviderEvidence, ProviderReferences } from "./pages/ProviderPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ClientOnboarding = () => (
  <div className="p-8 text-muted-foreground">Coming soon - Client Onboarding</div>
);

const GuidedBriefReview = () => (
  <div className="p-8 text-muted-foreground">Coming soon - Guided Brief Review</div>
);

// Apply theme class before React renders to prevent flash
const storedTheme = localStorage.getItem('theme');
if (storedTheme === 'light' || storedTheme === 'dark') {
  document.documentElement.classList.add(storedTheme);
} else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
  document.documentElement.classList.add('light');
} else {
  document.documentElement.classList.add('dark');
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="admin/clients/new" element={<ClientSetup />} />
                <Route path="admin/clients" element={<ClientsList />} />
                <Route path="admin/briefs/create" element={<AdminBriefCreator />} />
                <Route path="admin/briefs/create/:clientId" element={<AdminBriefCreator />} />
                <Route path="onboarding" element={<ClientOnboarding />} />
                <Route path="briefs/:id/review" element={<GuidedBriefReview />} />
                <Route path="requests" element={<RequestsList />} />
                <Route path="requests/new" element={<NewRequest />} />
                <Route path="requests/:id" element={<RequestDetail />} />
                <Route path="briefs" element={<BriefsList />} />
                <Route path="briefs/new" element={<NewBrief />} />
                <Route path="providers" element={<ProviderRegistry />} />
                <Route path="scorecards" element={<Scorecards />} />
                <Route path="shortlists" element={<ShortlistCompare />} />
                <Route path="shortlists/:id" element={<ShortlistCompare />} />
                <Route path="messages" element={<Messages />} />
                <Route path="settings" element={<Settings />} />
                {/* Provider Portal Routes */}
                <Route path="provider-portal" element={<ProviderPortal />}>
                  <Route index element={<Navigate to="/provider-portal/profile" replace />} />
                  <Route path="profile" element={<ProviderProfile />} />
                  <Route path="evidence" element={<ProviderEvidence />} />
                  <Route path="references" element={<ProviderReferences />} />
                  <Route path="opportunities" element={<div className="p-8 text-muted-foreground">Opportunities - Coming soon</div>} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
