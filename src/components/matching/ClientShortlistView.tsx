import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import type { ShortlistEntry } from '@/types/matching';
import type { ProviderProfile } from '@/types/provider';
import TierBadge from '@/components/providers/TierBadge';
import AnimatedList from '@/components/reactbits/AnimatedList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type ClientPreference = 'Interested' | 'Not Interested' | 'Questions';

interface ClientShortlistViewProps {
  shortlist: ShortlistEntry[];
  providers: ProviderProfile[];
  onViewDossier: (providerId: string) => void;
  onSelectPreference: (providerId: string, preference: ClientPreference) => void;
  selectedPreferences?: Record<string, ClientPreference>;
  projectTypeName?: string;
}

function formatEngagementLength(provider: ProviderProfile): string {
  if (!provider.typicalEngagementWeeks) return 'Timeline scoped with your advisor';

  const { min, max } = provider.typicalEngagementWeeks;
  if (min === max) return `${min} weeks typical`;

  return `${min}-${max} weeks typical`;
}

function formatRegions(provider: ProviderProfile): string {
  if (provider.regions.length === 0) return 'Region coverage discussed with advisor';

  if (provider.regions.length <= 2) return provider.regions.join(', ');

  return `${provider.regions.slice(0, 2).join(', ')} +${provider.regions.length - 2} more`;
}

export default function ClientShortlistView({
  shortlist,
  providers,
  onViewDossier,
  onSelectPreference,
  selectedPreferences = {},
  projectTypeName,
}: ClientShortlistViewProps) {
  const providersById = useMemo(() => {
    return providers.reduce<Record<string, ProviderProfile>>((accumulator, provider) => {
      accumulator[provider.id] = provider;
      return accumulator;
    }, {});
  }, [providers]);

  const curatedProviders = useMemo(() => {
    return shortlist
      .map((entry) => {
        const provider = providersById[entry.providerId];
        if (!provider) return null;

        return {
          entry,
          provider,
        };
      })
      .filter((item): item is { entry: ShortlistEntry; provider: ProviderProfile } => item !== null);
  }, [shortlist, providersById]);

  const providerCount = curatedProviders.length;
  const projectContext = projectTypeName ? `${projectTypeName} implementation` : 'implementation';

  const handlePreferenceSelect = (providerId: string, preference: ClientPreference) => {
    onSelectPreference(providerId, preference);
  };

  const preferenceButtonClass = (providerId: string, preference: ClientPreference): string => {
    const isSelected = selectedPreferences[providerId] === preference;

    if (preference === 'Interested') {
      return cn(
        'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/50',
        isSelected
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200'
          : undefined
      );
    }

    if (preference === 'Questions') {
      return cn(
        'border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/50',
        isSelected ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200' : undefined
      );
    }

    return cn(
      'border-muted-foreground/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      isSelected ? 'bg-muted text-foreground' : undefined
    );
  };

  if (providerCount === 0) {
    return (
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">Your Provider Shortlist</CardTitle>
          <CardDescription>
            Sablecrest is still curating your recommendations. Your advisor will share the shortlist shortly.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-gradient-to-b from-background to-muted/20 shadow-sm">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold tracking-tight">Your Provider Shortlist</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Sablecrest has identified {providerCount} provider{providerCount === 1 ? '' : 's'} that are the strongest fit
            for your {projectContext}.
          </CardDescription>
        </CardHeader>
      </Card>

      <AnimatedList
        items={curatedProviders}
        animation="fadeUp"
        staggerDelay={0.15}
        enableArrowNavigation={false}
        showGradients={false}
        scrollable={false}
        displayScrollbar={false}
        containerWidthClass="w-full"
        className="w-full"
        getItemKey={(item) => item.entry.id}
        renderItem={({ entry, provider }) => {
          const strengths = entry.matchScore.strengths.slice(0, 4);

          return (
            <Card className="border-border/70 bg-gradient-to-b from-background via-background to-muted/10 shadow-sm">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-semibold tracking-tight">{provider.name}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <TierBadge tier={provider.tier} size="md" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Why this provider</p>
                  <p className="text-sm leading-relaxed text-foreground/90">{entry.matchScore.explanation}</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Key strengths</p>

                  {strengths.length > 0 ? (
                    <ul className="space-y-1.5 text-sm leading-relaxed text-foreground/90">
                      {strengths.map((strength, index) => (
                        <li key={`${provider.id}-strength-${index}`} className="flex gap-2">
                          <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your advisor will provide context during shortlist review.
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Regions</p>
                    <p className="mt-1 text-sm text-foreground/90">{formatRegions(provider)}</p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Team size</p>
                    <p className="mt-1 text-sm text-foreground/90">{provider.employeeCountRange}</p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Typical engagement
                    </p>
                    <p className="mt-1 text-sm text-foreground/90">{formatEngagementLength(provider)}</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col items-stretch gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" onClick={() => onViewDossier(provider.id)}>
                  Learn More
                </Button>

                <div className="grid gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    variant="outline"
                    className={preferenceButtonClass(provider.id, 'Interested')}
                    onClick={() => handlePreferenceSelect(provider.id, 'Interested')}
                  >
                    Interested
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className={preferenceButtonClass(provider.id, 'Questions')}
                    onClick={() => handlePreferenceSelect(provider.id, 'Questions')}
                  >
                    I Have Questions
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className={preferenceButtonClass(provider.id, 'Not Interested')}
                    onClick={() => handlePreferenceSelect(provider.id, 'Not Interested')}
                  >
                    Not For Us
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        }}
      />

      <Card className="border-border/70 bg-muted/20">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
          <p className="text-sm text-muted-foreground">
            Want to discuss these options? Message your Sablecrest advisor.
          </p>

          <Button asChild variant="outline" className="gap-2">
            <Link to="/messages">
              <MessageSquare className="h-4 w-4" />
              Open Messages
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
