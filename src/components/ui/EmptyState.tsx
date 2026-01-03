import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { ReactNode } from 'react';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction | ReactNode;
  secondaryAction?: EmptyStateAction;
  children?: ReactNode;
}

function isEmptyStateAction(action: EmptyStateAction | ReactNode): action is EmptyStateAction {
  return action !== null && typeof action === 'object' && 'label' in action && 'onClick' in action;
}

export function EmptyState({ icon: Icon, title, description, action, secondaryAction, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon className="empty-state-icon" />
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-5">
          {action && (
            isEmptyStateAction(action) ? (
              <Button 
                size="sm"
                variant={action.variant || 'default'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ) : action
          )}
          {secondaryAction && (
            <Button 
              size="sm"
              variant={secondaryAction.variant || 'outline'}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}