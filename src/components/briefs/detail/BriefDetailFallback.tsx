import { AlertCircle, Loader2, type LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

interface BriefDetailFallbackProps {
  variant: 'loading' | 'empty';
  title: string;
  description: string;
  onBack?: () => void;
  icon?: LucideIcon;
}

export default function BriefDetailFallback({
  variant,
  title,
  description,
  onBack,
  icon = AlertCircle,
}: BriefDetailFallbackProps) {
  if (variant === 'loading') {
    return (
      <div className="page-container">
        <PageHeader title={title} description={description} showBack />
        <div className="page-content">
          <Card>
            <CardContent className="py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {description}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={onBack ? { label: 'Back to Briefs', onClick: onBack } : undefined}
      />
    </div>
  );
}
