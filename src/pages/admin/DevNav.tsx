import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DevRoute {
  label: string;
  path: string;
}

interface DevSection {
  title: string;
  routes: DevRoute[];
}

const DEV_SECTIONS: DevSection[] = [
  {
    title: 'ADMIN PAGES',
    routes: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Clients List', path: '/admin/clients' },
      { label: 'New Client Setup', path: '/admin/clients/new' },
      { label: 'Create Brief (no client)', path: '/admin/briefs/create' },
      { label: 'Create Brief (mock client)', path: '/admin/briefs/create/mock-client-001' },
      { label: 'Briefs List', path: '/briefs' },
      { label: 'Brief Detail (Locked)', path: '/briefs/brief-004' },
      { label: 'Brief Detail (Advisor Draft)', path: '/briefs/brief-001' },
      { label: 'Brief Detail (Shortlisted)', path: '/briefs/brief-005' },
      { label: 'Provider Registry', path: '/providers' },
      { label: 'Messages', path: '/messages' },
      { label: 'Settings', path: '/settings' },
    ],
  },
  {
    title: 'CLIENT PAGES',
    routes: [
  { label: 'Client Onboarding', path: '/client-onboarding' },
      { label: 'Guided Brief Review (brief-002)', path: '/briefs/brief-002/review' },
      { label: 'Guided Brief Review (brief-001)', path: '/briefs/brief-001/review' },
    ],
  },
  {
    title: 'PROVIDER PAGES',
    routes: [
      { label: 'Provider Portal', path: '/provider-portal' },
      { label: 'Provider Profile', path: '/provider-portal/profile' },
      { label: 'Provider Evidence', path: '/provider-portal/evidence' },
    ],
  },
  {
    title: 'LEGACY PAGES (to be removed)',
    routes: [
      { label: 'New Request', path: '/requests/new' },
      { label: 'Requests List', path: '/requests' },
      { label: 'Scorecards', path: '/scorecards' },
      { label: 'Shortlist Compare', path: '/shortlists' },
    ],
  },
];

export default function DevNav() {
  const navigate = useNavigate();
  const { loading: authLoading, isUiShellMode } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isUiShellMode) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isUiShellMode, navigate]);

  if (authLoading) {
    return (
      <div className="page-container">
        <PageHeader
          title="Dev Navigation"
          description="Quick links to all app routes. Dev only — remove before production."
        />
      </div>
    );
  }

  if (!isUiShellMode) {
    return null;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Dev Navigation"
        description="Quick links to all app routes. Dev only — remove before production."
      />

      <div className="page-content space-y-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Switch roles using the DEV MODE selector in the sidebar.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {DEV_SECTIONS.map((section) => (
            <Card key={section.title}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {section.routes.map((route) => (
                  <Link
                    key={route.path}
                    to={route.path}
                    className="group flex items-center justify-between rounded-sm border border-transparent px-2 py-2 hover:border-border hover:bg-muted/30"
                  >
                    <span className="text-sm text-foreground group-hover:underline">{route.label}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {route.path}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
