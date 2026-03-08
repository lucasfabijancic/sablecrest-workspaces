import type { ImplementationBrief, RiskFactor } from '@/types/brief';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BriefAdminSidebarProps {
  brief: ImplementationBrief;
  highRiskFlags: RiskFactor[];
}

export default function BriefAdminSidebar({ brief, highRiskFlags }: BriefAdminSidebarProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <Card>
        <CardHeader>
          <CardTitle>Advisor Notes Panel</CardTitle>
          <CardDescription>Internal context visible to admin and ops only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Discovery Notes</p>
            <p className="text-sm whitespace-pre-wrap">{brief.discoveryNotes || 'No discovery notes recorded.'}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Advisor Assessment</p>
            <p className="text-sm whitespace-pre-wrap">{brief.advisorNotes || 'No advisor assessment recorded.'}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Risk Flags</p>
            {highRiskFlags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No high-risk flags identified.</p>
            ) : (
              <ul className="space-y-2">
                {highRiskFlags.map((risk) => (
                  <li key={risk.id} className="text-sm rounded-md border border-border px-2.5 py-2">
                    <p className="font-medium">{risk.category}</p>
                    <p className="text-muted-foreground">{risk.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Internal Notes</p>
            <p className="text-sm whitespace-pre-wrap">
              {brief.advisorNotes || 'No additional internal notes have been captured yet.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
