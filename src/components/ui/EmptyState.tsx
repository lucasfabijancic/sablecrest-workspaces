import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon className="empty-state-icon" />
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && (
        <Button size="sm" className="mt-4 text-xs h-7" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}