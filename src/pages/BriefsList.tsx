import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';

export default function BriefsList() {
  const { currentWorkspace, isUiShellMode } = useAuth();
  const navigate = useNavigate();

  if (!currentWorkspace && !isUiShellMode) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        Select a workspace to view briefs.
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Briefs"
        description="Implementation briefs in your workspace. Drafts auto-save while editing."
        showBack
        actions={
          <Button size="sm" onClick={() => navigate('/briefs/new')}>
            New Brief
          </Button>
        }
      />

      <div className="page-content p-0">
        <EmptyState
          icon={FileText}
          title="No briefs yet"
          description="Create your first implementation brief to get started."
          action={{ label: 'New Brief', onClick: () => navigate('/briefs/new') }}
        />
      </div>
    </div>
  );
}
