import { formatValueForDisplay } from '@/lib/briefUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';

interface IntakeEntry {
  id: string;
  label: string;
  value: unknown;
}

interface BriefRequirementsTabProps {
  intakeEntries: IntakeEntry[];
}

export default function BriefRequirementsTab({ intakeEntries }: BriefRequirementsTabProps) {
  return (
    <TabsContent value="requirements" className="space-y-4 mt-0">
      <Card>
        <CardHeader>
          <CardTitle>Intake Responses</CardTitle>
          <CardDescription>Detailed inputs collected for this implementation brief.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {intakeEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No intake responses have been captured yet.</p>
          ) : (
            intakeEntries.map((entry) => (
              <div key={entry.id} className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{entry.label}</p>
                <p className="text-sm whitespace-pre-wrap">{formatValueForDisplay(entry.value)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
