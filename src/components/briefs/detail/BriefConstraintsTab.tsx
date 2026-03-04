import type { ImplementationBrief } from '@/types/brief';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';

interface BriefConstraintsTabProps {
  brief: ImplementationBrief;
}

export default function BriefConstraintsTab({ brief }: BriefConstraintsTabProps) {
  return (
    <TabsContent value="constraints" className="space-y-4 mt-0">
      <Card>
        <CardHeader>
          <CardTitle>Budget</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Minimum</p>
            <p className="text-sm">
              {typeof brief.constraints.budget.min === 'number'
                ? `$${brief.constraints.budget.min.toLocaleString()}`
                : 'Not provided'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Maximum</p>
            <p className="text-sm">
              {typeof brief.constraints.budget.max === 'number'
                ? `$${brief.constraints.budget.max.toLocaleString()}`
                : 'Not provided'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Flexibility</p>
            <p className="text-sm">{brief.constraints.budget.flexibility}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Urgency</p>
            <p className="text-sm">{brief.constraints.timeline.urgency || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Hard Deadline</p>
            <p className="text-sm">{brief.constraints.timeline.hardDeadline || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Reason</p>
            <p className="text-sm whitespace-pre-wrap">{brief.constraints.timeline.reason || 'Not provided'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sensitivity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Level</p>
            <p className="text-sm">{brief.constraints.sensitivity.level || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Concerns</p>
            <p className="text-sm">
              {brief.constraints.sensitivity.concerns?.length
                ? brief.constraints.sensitivity.concerns.join(', ')
                : 'None listed'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical Constraints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Must Integrate</p>
            <p className="text-sm">
              {brief.constraints.technical.mustIntegrate?.length
                ? brief.constraints.technical.mustIntegrate.join(', ')
                : 'None listed'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cannot Change</p>
            <p className="text-sm">
              {brief.constraints.technical.cannotChange?.length
                ? brief.constraints.technical.cannotChange.join(', ')
                : 'None listed'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Preferences</p>
            <p className="text-sm">
              {brief.constraints.technical.preferences?.length
                ? brief.constraints.technical.preferences.join(', ')
                : 'None listed'}
            </p>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
