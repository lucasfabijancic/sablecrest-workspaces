import { aecProviders } from '@/data/aecProviders';
import ClientShortlistView from '@/components/matching/ClientShortlistView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { ShortlistEntry } from '@/types/matching';
import type { ClientPreference } from '@/components/matching/ClientShortlistView';

interface BriefShortlistTabProps {
  isBeforeShortlistedStatus: boolean;
  shortlist: ShortlistEntry[];
  shortlistMatchCount: number;
  onViewDossier: (providerId: string) => void;
  onSelectPreference: (providerId: string, preference: ClientPreference) => void;
  selectedPreferences: Record<string, ClientPreference>;
  projectTypeName?: string;
}

export default function BriefShortlistTab({
  isBeforeShortlistedStatus,
  shortlist,
  shortlistMatchCount,
  onViewDossier,
  onSelectPreference,
  selectedPreferences,
  projectTypeName,
}: BriefShortlistTabProps) {
  return (
    <TabsContent value="shortlist" className="space-y-4 mt-0">
      {isBeforeShortlistedStatus ? (
        <Card>
          <CardHeader>
            <CardTitle>Curated Shortlist</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your Sablecrest advisor is identifying the best providers for your needs. You will be notified when your
              shortlist is ready.
            </p>
          </CardContent>
        </Card>
      ) : shortlistMatchCount === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Curated Shortlist</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your shortlist is being prepared. Please check back shortly.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ClientShortlistView
          shortlist={shortlist}
          providers={aecProviders}
          onViewDossier={onViewDossier}
          onSelectPreference={onSelectPreference}
          selectedPreferences={selectedPreferences}
          projectTypeName={projectTypeName}
        />
      )}
    </TabsContent>
  );
}
