import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageSquare } from 'lucide-react';

export default function Messages() {
  return (
    <div className="page-container">
      <PageHeader 
        title="Messages" 
        description="Conversations across your requests"
      />
      <div className="page-content">
        <div className="border border-border">
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Messages from your requests will appear here."
          />
        </div>
      </div>
    </div>
  );
}
