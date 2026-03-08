import type { ImplementationBrief, SuccessCriterion } from '@/types/brief';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';

interface BriefSuccessTabProps {
  brief: ImplementationBrief;
  isAdmin: boolean;
}

function getCriterionSourceBadgeClass(source?: SuccessCriterion['source']) {
  switch (source) {
    case 'advisor':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
    case 'client':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
    default:
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
  }
}

function getCriterionSourceLabel(source?: SuccessCriterion['source']) {
  switch (source) {
    case 'advisor':
      return 'Suggested by Sablecrest';
    case 'client':
      return 'Client Added';
    default:
      return 'AI Suggested';
  }
}

export default function BriefSuccessTab({ brief, isAdmin }: BriefSuccessTabProps) {
  return (
    <TabsContent value="success" className="space-y-4 mt-0">
      <Card>
        <CardHeader>
          <CardTitle>Success Criteria</CardTitle>
          <CardDescription>
            {isAdmin
              ? 'Criteria used to evaluate implementation outcomes and provider fit.'
              : 'How success will be measured for your implementation.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {brief.successCriteria.length === 0 ? (
            <p className="text-sm text-muted-foreground">No success criteria are defined yet.</p>
          ) : (
            brief.successCriteria.map((criterion, index) => (
              <div key={criterion.id || `criterion-${index}`} className="rounded-md border border-border p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{criterion.metric || `Criterion ${index + 1}`}</p>
                  {isAdmin && criterion.source ? (
                    <Badge variant="secondary" className={getCriterionSourceBadgeClass(criterion.source)}>
                      {getCriterionSourceLabel(criterion.source)}
                    </Badge>
                  ) : null}
                  {isAdmin && criterion.confirmedByClient ? (
                    <Badge variant="outline">Confirmed by client</Badge>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Baseline</p>
                    <p className="text-sm">{criterion.baseline || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Target</p>
                    <p className="text-sm">{criterion.target || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Measurement Method</p>
                    <p className="text-sm">{criterion.measurementMethod || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Timeframe</p>
                    <p className="text-sm">{criterion.timeframe || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Weight</p>
                    <p className="text-sm">{criterion.weight ?? 'Not provided'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
