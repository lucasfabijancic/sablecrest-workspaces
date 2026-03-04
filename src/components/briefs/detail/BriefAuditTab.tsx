import type { Dispatch, SetStateAction } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { type AuditRow, formatValueForDisplay, pluralize, sourceBadgeClass, sourceBadgeLabel } from '@/lib/briefUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';

interface BriefAuditTabProps {
  auditMode: 'all' | 'changes';
  setAuditMode: Dispatch<SetStateAction<'all' | 'changes'>>;
  filteredAuditRows: AuditRow[];
  clientChangedCount: number;
  clientConfirmedCount: number;
  pendingClientInputCount: number;
}

export default function BriefAuditTab({
  auditMode,
  setAuditMode,
  filteredAuditRows,
  clientChangedCount,
  clientConfirmedCount,
  pendingClientInputCount,
}: BriefAuditTabProps) {
  return (
    <TabsContent value="audit" className="space-y-4 mt-0">
      <Card>
        <CardHeader>
          <CardTitle>Field Audit</CardTitle>
          <CardDescription>
            Track field source, client confirmations, and client notes across this brief.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{clientConfirmedCount} confirmed by client</Badge>
            <Badge variant="secondary">{clientChangedCount} changed by client</Badge>
            <Badge variant="secondary">
              {pendingClientInputCount} pending {pluralize(pendingClientInputCount, 'field')}
            </Badge>

            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant={auditMode === 'all' ? 'default' : 'outline'}
                onClick={() => setAuditMode('all')}
              >
                All Fields
              </Button>
              <Button
                size="sm"
                variant={auditMode === 'changes' ? 'default' : 'outline'}
                onClick={() => setAuditMode('changes')}
              >
                Client Changes
              </Button>
            </div>
          </div>

          {filteredAuditRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {auditMode === 'changes'
                ? 'No client-originated field changes detected yet.'
                : 'No field audit data available yet.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredAuditRows.map((row) => (
                <div key={row.path} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{row.label}</p>
                    <Badge variant="secondary" className={sourceBadgeClass(row.source)}>
                      {sourceBadgeLabel(row.source)}
                    </Badge>
                    {row.confirmedByClient ? (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Confirmed
                      </Badge>
                    ) : null}
                    {row.markedForClientInput ? (
                      <Badge
                        variant="outline"
                        className="text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-700"
                      >
                        Needs client input
                      </Badge>
                    ) : null}
                  </div>

                  <p className="text-sm whitespace-pre-wrap">{formatValueForDisplay(row.value)}</p>

                  {row.clientNote ? (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      <span className="font-medium">Client note:</span> {row.clientNote}
                    </p>
                  ) : null}

                  <p className="text-[11px] text-muted-foreground">{row.path}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
