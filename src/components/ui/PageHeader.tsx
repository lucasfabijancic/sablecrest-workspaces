import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="min-w-0 flex-1">
        <h1 className="page-header-title">{title}</h1>
        {description && (
          <p className="page-header-subtitle">{description}</p>
        )}
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