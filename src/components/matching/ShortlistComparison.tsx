import { useMemo } from 'react';
import { ArrowLeftRight, ExternalLink, Trophy } from 'lucide-react';
import type { ShortlistEntry } from '@/types/matching';
import type { ProviderProfile, ProviderTier, VerificationLevel } from '@/types/provider';
import FitScoreCard from '@/components/matching/FitScoreCard';
import TierBadge from '@/components/providers/TierBadge';
import VerificationBadge from '@/components/providers/VerificationBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ShortlistComparison: Side-by-side provider comparison for admin curation.
// Used inside BriefDetail's Matches tab when admin clicks "Compare Selected."
// Receives an array of MatchScore entries + their ProviderProfile data.
// Client-facing version strips internal scores, showing only fit narratives.

interface ShortlistComparisonProps {
  shortlist: ShortlistEntry[];
  providers: ProviderProfile[];
  onSelectProvider: (providerId: string) => void;
  onRemoveFromShortlist: (providerId: string) => void;
  onViewDossier: (providerId: string) => void;
  onClose: () => void;
}

interface ComparisonColumn {
  entry: ShortlistEntry;
  provider: ProviderProfile;
  capabilityMatches: string[];
  minBudget?: number;
  minTimelineWeeks?: number;
  teamSizeScore?: number;
}

const TIER_RANK: Record<ProviderTier, number> = {
  Pending: 1,
  Emerging: 2,
  Verified: 3,
  Elite: 4,
};

const VERIFICATION_RANK: Record<VerificationLevel, number> = {
  Unverified: 1,
  'Provider-stated': 2,
  Documented: 3,
  'Reference-validated': 4,
  'Sablecrest-verified': 5,
};

const scoreTextClass = (value: number): string => {
  if (value >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (value >= 60) return 'text-amber-600 dark:text-amber-400';
  if (value >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const formatCurrencyRange = (min?: number, max?: number): string => {
  if (typeof min !== 'number' && typeof max !== 'number') return 'Not provided';
  if (typeof min === 'number' && typeof max === 'number') {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  }
  if (typeof min === 'number') return `$${min.toLocaleString()}+`;
  return `Up to $${max?.toLocaleString()}`;
};

const parseTimelineWeeks = (timeline?: string): number | undefined => {
  if (!timeline) return undefined;

  const range = timeline.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    const min = Number(range[1]);
    return Number.isFinite(min) ? min : undefined;
  }

  const single = timeline.match(/(\d+)/);
  if (!single) return undefined;

  const weeks = Number(single[1]);
  return Number.isFinite(weeks) ? weeks : undefined;
};

const parseEmployeeCount = (value?: string): number | undefined => {
  if (!value) return undefined;

  const explicit = value.match(/\((\d+)\s*employees?\)/i);
  if (explicit) {
    const count = Number(explicit[1]);
    return Number.isFinite(count) ? count : undefined;
  }

  const range = value.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    if (Number.isFinite(min) && Number.isFinite(max)) return Math.round((min + max) / 2);
  }

  const single = value.match(/(\d+)/);
  if (single) {
    const count = Number(single[1]);
    return Number.isFinite(count) ? count : undefined;
  }

  return undefined;
};

const pickWinnerMax = (columns: ComparisonColumn[], score: (column: ComparisonColumn) => number | undefined): string | undefined => {
  let bestId: string | undefined;
  let bestValue = Number.NEGATIVE_INFINITY;

  columns.forEach((column) => {
    const value = score(column);
    if (typeof value !== 'number') return;
    if (value > bestValue) {
      bestValue = value;
      bestId = column.provider.id;
    }
  });

  return bestId;
};

const pickWinnerMin = (columns: ComparisonColumn[], score: (column: ComparisonColumn) => number | undefined): string | undefined => {
  let bestId: string | undefined;
  let bestValue = Number.POSITIVE_INFINITY;

  columns.forEach((column) => {
    const value = score(column);
    if (typeof value !== 'number') return;
    if (value < bestValue) {
      bestValue = value;
      bestId = column.provider.id;
    }
  });

  return bestId;
};

const isWordBoundaryMatch = (haystack: string, needle: string): boolean => {
  const escapedNeedle = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedNeedle}\\b`, 'i');
  return regex.test(haystack);
};

const deriveCapabilityMatches = (provider: ProviderProfile, shortlistEntry: ShortlistEntry): string[] => {
  const sourceText = [shortlistEntry.matchScore.explanation, ...shortlistEntry.matchScore.strengths]
    .join(' ')
    .toLowerCase();

  const matches: string[] = [];

  provider.capabilities.forEach((capability) => {
    const candidateLabels = [capability.capability, ...(capability.subcategories ?? [])];

    const matched = candidateLabels.some((label) => {
      const normalized = label.toLowerCase().trim();
      if (!normalized) return false;
      if (normalized.length <= 3) return sourceText.includes(normalized);
      return isWordBoundaryMatch(sourceText, normalized);
    });

    if (matched) {
      matches.push(capability.capability);
    }
  });

  if (matches.length > 0) return Array.from(new Set(matches)).slice(0, 5);

  return provider.capabilities.map((capability) => capability.capability).slice(0, 4);
};

const cellHighlightClass = (providerId: string, winningProviderId?: string): string => {
  if (!winningProviderId) return '';
  return providerId === winningProviderId
    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-900/60'
    : '';
};

const rowLabelClass =
  'sticky left-0 z-10 min-w-[220px] bg-card/95 align-top text-xs uppercase tracking-wide text-muted-foreground';

export default function ShortlistComparison({
  shortlist,
  providers,
  onSelectProvider,
  onRemoveFromShortlist,
  onViewDossier,
  onClose,
}: ShortlistComparisonProps) {
  const providerLookup = useMemo(() => {
    return providers.reduce<Record<string, ProviderProfile>>((accumulator, provider) => {
      accumulator[provider.id] = provider;
      return accumulator;
    }, {});
  }, [providers]);

  const comparisonColumns = useMemo<ComparisonColumn[]>(() => {
    return shortlist
      .slice(0, 5)
      .map((entry) => {
        const provider = providerLookup[entry.providerId];
        if (!provider) return null;

        return {
          entry,
          provider,
          capabilityMatches: deriveCapabilityMatches(provider, entry),
          minBudget:
            typeof entry.matchScore.estimatedBudget?.min === 'number'
              ? entry.matchScore.estimatedBudget.min
              : provider.typicalBudgetMin,
          minTimelineWeeks:
            parseTimelineWeeks(entry.matchScore.estimatedTimeline) ?? provider.typicalEngagementWeeks?.min,
          teamSizeScore: parseEmployeeCount(provider.employeeCountRange),
        } satisfies ComparisonColumn;
      })
      .filter((column): column is ComparisonColumn => column !== null);
  }, [providerLookup, shortlist]);

  const winners = useMemo(() => {
    return {
      fitScore: pickWinnerMax(comparisonColumns, (column) => column.entry.matchScore.overallScore),
      tier: pickWinnerMax(comparisonColumns, (column) => TIER_RANK[column.provider.tier]),
      verification: pickWinnerMax(
        comparisonColumns,
        (column) => VERIFICATION_RANK[column.provider.overallVerification]
      ),
      budget: pickWinnerMin(comparisonColumns, (column) => column.minBudget),
      timeline: pickWinnerMin(comparisonColumns, (column) => column.minTimelineWeeks),
      capability: pickWinnerMax(comparisonColumns, (column) => column.capabilityMatches.length),
      teamSize: pickWinnerMax(comparisonColumns, (column) => column.teamSizeScore),
      regions: pickWinnerMax(comparisonColumns, (column) => column.provider.regions.length),
      strengths: pickWinnerMax(comparisonColumns, (column) => column.entry.matchScore.strengths.length),
      risks: pickWinnerMin(comparisonColumns, (column) => column.entry.matchScore.risks.length),
    };
  }, [comparisonColumns]);

  if (comparisonColumns.length < 2) {
    return (
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Compare Shortlisted Providers</CardTitle>
            <CardDescription>Add at least 2 providers to compare.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Comparison
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Add at least 2 providers to compare.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Compare Shortlisted Providers
            </CardTitle>
            <CardDescription>
              Side-by-side comparison for curated selection ({comparisonColumns.length} providers).
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Comparison
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className={cn('w-full overflow-x-auto', comparisonColumns.length > 3 ? 'pb-2' : '')}>
          <Table
            className="border-separate border-spacing-0"
            style={{ minWidth: `${Math.max(980, comparisonColumns.length * 320)}px` }}
          >
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={rowLabelClass}>Provider</TableHead>
                {comparisonColumns.map((column) => (
                  <TableHead
                    key={column.provider.id}
                    className={cn(
                      'min-w-[280px] border-l border-border/60 align-top',
                      cellHighlightClass(column.provider.id, winners.fitScore)
                    )}
                  >
                    <div className="space-y-3 py-1">
                      <div className="space-y-1.5">
                        <p className="text-base font-semibold text-foreground">{column.provider.name}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <TierBadge tier={column.provider.tier} size="sm" />
                          <FitScoreCard size="compact" score={column.entry.matchScore.overallScore} />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => onViewDossier(column.provider.id)}
                      >
                        View Dossier
                        <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              <TableRow>
                <TableCell className={rowLabelClass}>Overall Fit Score</TableCell>
                {comparisonColumns.map((column) => (
                  <TableCell
                    key={`${column.provider.id}-fit`}
                    className={cn('border-l border-border/60', cellHighlightClass(column.provider.id, winners.fitScore))}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('text-lg font-semibold tabular-nums', scoreTextClass(column.entry.matchScore.overallScore))}>
                        {Math.round(column.entry.matchScore.overallScore)}
                      </span>
                      {winners.fitScore === column.provider.id ? (
                        <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : null}
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className={rowLabelClass}>Tier</TableCell>
                {comparisonColumns.map((column) => (
                  <TableCell
                    key={`${column.provider.id}-tier`}
                    className={cn('border-l border-border/60', cellHighlightClass(column.provider.id, winners.tier))}
                  >
                    <TierBadge tier={column.provider.tier} size="sm" />
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className={rowLabelClass}>Verification Level</TableCell>
                {comparisonColumns.map((column) => (
                  <TableCell
                    key={`${column.provider.id}-verification`}
                    className={cn(
                      'border-l border-border/60',
                      cellHighlightClass(column.provider.id, winners.verification)
                    )}
                  >
                    <VerificationBadge level={column.provider.overallVerification} size="sm" />
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className={rowLabelClass}>Budget Range</TableCell>
                {comparisonColumns.map((column) => (
                  <TableCell
                    key={`${column.provider.id}-budget`}
                    className={cn('border-l border-border/60', cellHighlightClass(column.provider.id, winners.budget))}
                  >
                    <span className="text-sm">
                      {formatCurrencyRange(
                        column.entry.matchScore.estimatedBudget?.min ?? column.provider.typicalBudgetMin,
                        column.entry.matchScore.estimatedBudget?.max ?? column.provider.typicalBudgetMax
                      )}
                    </span>
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className={rowLabelClass}>Typical Timeline</TableCell>
                {comparisonColumns.map((column) => (
                  <TableCell
                    key={`${column.provider.id}-timeline`}
                    className={cn('border-l border-border/60', cellHighlightClass(column.provider.id, winners.timeline))}
                  >
                    <span className="text-sm">
                      {column.entry.matchScore.estimatedTimeline ||
                        (column.provider.typicalEngagementWeeks
                          ? `${column.provider.typicalEngagementWeeks.min}-${column.provider.typicalEngagementWeeks.max} weeks`
                          : 'Not provided')}
                    </span>
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className={rowLabelClass}>Capability Match</TableCell>
                {comparisonColumns.map((column) => (
                  <TableCell
                    key={`${column.provider.id}-capability`}
                    className={cn('border-l border-border/60', cellHighlightClass(column.provider.id, winners.capability))}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {column.capabilityMatches.length > 0 ? (
                        column.capabilityMatches.slice(0, 5).map((capability) => (
                          <Badge key={`${column.provider.id}-${capability}`} variant="outline" className="text-[11px]">
                            {capability}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No direct capability tags</span>
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className={rowLabelClass}>Team Size</TableCell>
                {comparisonColumns.map((column) => (
                  <TableCell
                    key={`${column.provider.id}-team`}
                    className={cn('border-l border-border/60', cellHighlightClass(column.provider.id, winners.teamSize))}
                  >
                    <span className="text-sm">{column.provider.employeeCountRange || 'Not provided'}</span>
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className={rowLabelClass}>Regions</TableCell>
                {comparisonColumns.map((column) => (
                  <TableCell
                    key={`${column.provider.id}-regions`}
                    className={cn('border-l border-border/60', cellHighlightClass(column.provider.id, winners.regions))}
                  >
                    <span className="text-sm">
                      {column.provider.regions.length > 0 ? column.provider.regions.join(', ') : 'Not provided'}
                    </span>
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className={rowLabelClass}>Strengths</TableCell>
                {comparisonColumns.map((column) => (
                  <TableCell
                    key={`${column.provider.id}-strengths`}
                    className={cn('border-l border-border/60 align-top', cellHighlightClass(column.provider.id, winners.strengths))}
                  >
                    {column.entry.matchScore.strengths.length > 0 ? (
                      <ul className="space-y-1.5">
                        {column.entry.matchScore.strengths.slice(0, 4).map((strength, index) => (
                          <li key={`${column.provider.id}-strength-${index}`} className="text-sm leading-relaxed">
                            • {strength}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-muted-foreground">No strengths captured</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className={rowLabelClass}>Risks</TableCell>
                {comparisonColumns.map((column) => (
                  <TableCell
                    key={`${column.provider.id}-risks`}
                    className={cn('border-l border-border/60 align-top', cellHighlightClass(column.provider.id, winners.risks))}
                  >
                    {column.entry.matchScore.risks.length > 0 ? (
                      <ul className="space-y-1.5">
                        {column.entry.matchScore.risks.slice(0, 3).map((risk, index) => (
                          <li key={`${column.provider.id}-risk-${index}`} className="text-sm leading-relaxed text-muted-foreground">
                            • {risk}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-muted-foreground">No major risks identified</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className={rowLabelClass}>Actions</TableCell>
                {comparisonColumns.map((column) => (
                  <TableCell key={`${column.provider.id}-actions`} className="border-l border-border/60">
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => onSelectProvider(column.provider.id)}>
                        Select Provider
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onRemoveFromShortlist(column.provider.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
