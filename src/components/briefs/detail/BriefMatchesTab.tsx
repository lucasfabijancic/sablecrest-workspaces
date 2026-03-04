import { Loader2 } from 'lucide-react';
import { aecProviders } from '@/data/aecProviders';
import type { ActionKey } from '@/lib/briefUtils';
import type { ImplementationBrief } from '@/types/brief';
import type { MatchingResult, ShortlistEntry } from '@/types/matching';
import type { ProviderProfile } from '@/types/provider';
import FitScoreCard from '@/components/matching/FitScoreCard';
import MatchResults from '@/components/matching/MatchResults';
import ShortlistComparison from '@/components/matching/ShortlistComparison';
import TierBadge from '@/components/providers/TierBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';

interface BriefMatchesTabProps {
  brief: ImplementationBrief;
  isAdmin: boolean;
  matchingResult: MatchingResult | null;
  isGeneratingMatches: boolean;
  shortlist: ShortlistEntry[];
  shortlistMatches: Array<{ entry: ShortlistEntry; provider: ProviderProfile }>;
  shortlistProviderIds: string[];
  actionInProgress: ActionKey | null;
  isComparing: boolean;
  isBeforeLockedStatus: boolean;
  isBeforeShortlistedStatus: boolean;
  handleLockBrief: () => void;
  handleGenerateMatches: () => void;
  handleRegenerateMatches: () => void;
  handleAddToShortlist: (providerId: string) => void;
  handleRemoveFromShortlist: (providerId: string) => void;
  handleViewDossier: (providerId: string) => void;
  handleCompareShortlist: () => void;
  handlePresentToClient: () => void;
  handleOpenSelectProvider: (providerId: string) => void;
  setIsComparing: (value: boolean) => void;
}

export default function BriefMatchesTab({
  brief,
  isAdmin,
  matchingResult,
  isGeneratingMatches,
  shortlist,
  shortlistMatches,
  shortlistProviderIds,
  actionInProgress,
  isComparing,
  isBeforeLockedStatus,
  isBeforeShortlistedStatus,
  handleLockBrief,
  handleGenerateMatches,
  handleRegenerateMatches,
  handleAddToShortlist,
  handleRemoveFromShortlist,
  handleViewDossier,
  handleCompareShortlist,
  handlePresentToClient,
  handleOpenSelectProvider,
  setIsComparing,
}: BriefMatchesTabProps) {
  if (!isAdmin || !brief) return null;

  return (
    <TabsContent value="matches" className="space-y-4 mt-0">
      {/* Admin-only matching workflow. Route-level RoleRoute should also guard this path in production. */}
      {isBeforeLockedStatus ? (
        <Card>
          <CardHeader>
            <CardTitle>Provider Matches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Lock the brief to generate provider matches. Matching requires all criteria to be finalized.
            </p>
            <Button size="sm" onClick={handleLockBrief} disabled={actionInProgress !== null}>
              {actionInProgress === 'lock' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              Lock Brief
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {isGeneratingMatches ? (
            <Card>
              <CardContent className="py-8 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing providers...
              </CardContent>
            </Card>
          ) : null}

          {!isGeneratingMatches && !matchingResult ? (
            <Card>
              <CardHeader>
                <CardTitle>Run Matching</CardTitle>
                <CardDescription>
                  Analyzes {aecProviders.length} providers against your brief requirements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg" onClick={handleGenerateMatches} disabled={actionInProgress !== null}>
                  Generate Matches
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {!isGeneratingMatches && matchingResult ? (
            <>
              <MatchResults
                matches={matchingResult.matches}
                providers={aecProviders}
                onAddToShortlist={handleAddToShortlist}
                onViewDossier={handleViewDossier}
                shortlistedIds={shortlistProviderIds}
                algorithmVersion={matchingResult.algorithmVersion}
                generatedAt={matchingResult.generatedAt}
                totalCandidatesEvaluated={matchingResult.totalCandidatesEvaluated}
                onRegenerate={handleRegenerateMatches}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Shortlist ({shortlist.length} providers)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {shortlist.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Add providers from the matches above to build your shortlist.
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {shortlistMatches.map(({ entry, provider }) => (
                        <div key={entry.id} className="rounded-md border border-border p-3 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{provider.name}</p>
                              <TierBadge tier={provider.tier} size="sm" />
                            </div>
                            <FitScoreCard score={entry.matchScore.overallScore} size="compact" />
                          </div>

                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewDossier(provider.id)}>
                              View Dossier
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleRemoveFromShortlist(provider.id)}>
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={handleCompareShortlist} disabled={shortlist.length < 2}>
                      Compare Shortlist
                    </Button>

                    <Button
                      size="sm"
                      onClick={handlePresentToClient}
                      disabled={shortlist.length === 0 || actionInProgress !== null}
                    >
                      {actionInProgress === 'presentShortlist' ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : null}
                      Present to Client
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {isComparing ? (
                <ShortlistComparison
                  shortlist={shortlist}
                  providers={aecProviders}
                  onSelectProvider={handleOpenSelectProvider}
                  onRemoveFromShortlist={handleRemoveFromShortlist}
                  onViewDossier={handleViewDossier}
                  onClose={() => setIsComparing(false)}
                />
              ) : null}
            </>
          ) : null}
        </>
      )}
    </TabsContent>
  );
}
