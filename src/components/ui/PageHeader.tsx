import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="min-w-0 flex-1">
        <h1 className="page-header-title">{title}</h1>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {actions && (
        <div className="page-header-actions flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}