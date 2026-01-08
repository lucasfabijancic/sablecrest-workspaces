import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './button';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  backTo?: string;
  backLabel?: string;
}

export function PageHeader({ title, description, actions, children, backTo, backLabel = 'Back' }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="page-header">
      <div className="min-w-0 flex-1 flex items-center gap-3">
        {backTo && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs shrink-0 hover-slide" 
            onClick={() => navigate(backTo)}
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            {backLabel}
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="page-header-title">{title}</h1>
          {description && (
            <p className="page-header-subtitle">{description}</p>
          )}
        </div>
      </div>
      {(actions || children) && (
        <div className="page-header-actions flex items-center gap-3 shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
