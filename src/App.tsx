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
import ProvidersList from "./pages/ProvidersList";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
                <Route path="requests" element={<RequestsList />} />
                <Route path="requests/new" element={<NewRequest />} />
                <Route path="requests/:id" element={<RequestDetail />} />
                <Route path="providers" element={<ProvidersList />} />
                <Route path="settings" element={<Settings />} />
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
