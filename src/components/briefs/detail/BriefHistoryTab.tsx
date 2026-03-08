import type { ImplementationBrief } from '@/types/brief';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';

interface BriefHistoryTabProps {
  brief: ImplementationBrief;
  formatRelativeTime: (isoDate?: string) => string;
}

export default function BriefHistoryTab({ brief, formatRelativeTime }: BriefHistoryTabProps) {
  return (
    <TabsContent value="history" className="space-y-4 mt-0">
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Versioning and activity timeline placeholder.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Created:</span> {formatRelativeTime(brief.createdAt)}
          </p>
          <p>
            <span className="text-muted-foreground">Last updated:</span> {formatRelativeTime(brief.updatedAt)}
          </p>
          <p>
            <span className="text-muted-foreground">Client review started:</span>{' '}
            {formatRelativeTime(brief.clientReviewStartedAt)}
          </p>
          <p>
            <span className="text-muted-foreground">Client review completed:</span>{' '}
            {formatRelativeTime(brief.clientReviewCompletedAt)}
          </p>
          <p>
            <span className="text-muted-foreground">Locked:</span> {formatRelativeTime(brief.lockedAt)}
          </p>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
