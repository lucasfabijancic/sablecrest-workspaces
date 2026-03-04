import type { AECProjectType } from '@/data/aecProjectTypes';
import type { ImplementationBrief } from '@/types/brief';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';

interface BriefOverviewTabProps {
  brief: ImplementationBrief;
  projectType: AECProjectType | null;
  advisorName: string;
  isAdmin: boolean;
  isClient: boolean;
  formatRelativeTime: (isoDate?: string) => string;
}

export default function BriefOverviewTab({
  brief,
  projectType,
  advisorName,
  isAdmin,
  isClient,
  formatRelativeTime,
}: BriefOverviewTabProps) {
  return (
    <TabsContent value="overview" className="space-y-4 mt-0">
      <Card>
        <CardHeader>
          <CardTitle>Business Context</CardTitle>
          <CardDescription>What Sablecrest understands about your current situation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Company</p>
            <p className="text-sm">{brief.businessContext.companyName || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Size</p>
            <p className="text-sm">{brief.businessContext.companySize || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Segment</p>
            <p className="text-sm">{brief.businessContext.industry || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Decision Timeline</p>
            <p className="text-sm">{brief.businessContext.decisionTimeline || 'Not provided'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Current State</p>
            <p className="text-sm whitespace-pre-wrap">{brief.businessContext.currentState || 'Not provided'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Desired Outcome</p>
            <p className="text-sm whitespace-pre-wrap">{brief.businessContext.desiredOutcome || 'Not provided'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Key Stakeholders</p>
            <p className="text-sm whitespace-pre-wrap">{brief.businessContext.keyStakeholders || 'Not provided'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm font-medium">{projectType?.name ?? brief.projectTypeId}</p>
          {projectType && (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{projectType.category}</p>
              <p className="text-sm text-muted-foreground">{projectType.description}</p>
            </>
          )}
        </CardContent>
      </Card>

      {isAdmin ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>Advisor-only risk factors used for matching and planning.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {brief.riskFactors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No risk factors captured yet.</p>
              ) : (
                brief.riskFactors.map((risk) => (
                  <div key={risk.id} className="rounded-md border border-border p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{risk.category}</Badge>
                      <Badge variant="secondary">Likelihood: {risk.likelihood}</Badge>
                      <Badge variant="secondary">Impact: {risk.impact}</Badge>
                    </div>
                    <p className="text-sm">{risk.description}</p>
                    {risk.mitigation ? (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Mitigation:</span> {risk.mitigation}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advisor Notes</CardTitle>
              <CardDescription>Internal assessment and discovery context.</CardDescription>
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
            </CardContent>
          </Card>
        </>
      ) : null}
    </TabsContent>
  );
}
