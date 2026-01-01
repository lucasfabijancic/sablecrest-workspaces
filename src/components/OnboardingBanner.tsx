import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OnboardingBanner() {
  return (
    <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-warning">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Workspace not set up yet — Continue onboarding</span>
      </div>
      <Button asChild size="sm" variant="outline" className="h-6 text-xs border-warning/30 text-warning hover:bg-warning/10">
        <Link to="/onboarding">
          Complete Setup
          <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      </Button>
    </div>
  );
}
