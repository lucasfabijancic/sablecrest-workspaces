import { type ComponentType, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Check, RefreshCw } from 'lucide-react';
import type { MatchScore, ScoreBreakdown } from '@/types/matching';
import type { ProviderProfile } from '@/types/provider';
import TierBadge from '@/components/providers/TierBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CountUpLikeProps {
  to: number;
  from?: number;
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
}

type CountUpLike = ComponentType<CountUpLikeProps>;

let cachedCountUp: CountUpLike | null | undefined;

type SortMode = 'score' | 'budget' | 'timeline';

interface MatchResultsProps {
  matches: MatchScore[];
  providers: ProviderProfile[];
  onAddToShortlist: (providerId: string) => void;
  onViewDossier: (providerId: string) => void;
  shortlistedIds: string[];
  algorithmVersion: string;
  generatedAt: string;
  totalCandidatesEvaluated: number;
  onRegenerate: () => void;
}

const BREAKDOWN_ROWS: Array<{ key: keyof ScoreBreakdown; label: string }> = [
  { key: 'capabilityFit', label: 'Capability' },
  { key: 'budgetAlignment', label: 'Budget' },
  { key: 'timelineCompatibility', label: 'Timeline' },
  { key: 'experienceRelevance', label: 'Experience' },
  { key: 'verificationLevel', label: 'Verification' },
  { key: 'successCriteriaAlignment', label: 'Success Alignment' },
];

async function loadCountUp(): Promise<CountUpLike | null> {
  if (cachedCountUp !== undefined) {
    return cachedCountUp;
  }

  try {
    const module = await import('@/components/reactbits/CountUp');
    cachedCountUp = module.default as CountUpLike;
    return cachedCountUp;
  } catch {
    cachedCountUp = null;
    return null;
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function parseGeneratedAt(generatedAt: string): string {
  const parsed = new Date(generatedAt);
  if (Number.isNaN(parsed.getTime())) return 'Generated recently';
  return `Generated ${formatDistanceToNow(parsed, { addSuffix: true })}`;
}

function parseTimelineWeeks(value: string): number {
  if (!value) return Number.MAX_SAFE_INTEGER;

  const range = value.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    const min = Number(range[1]);
    if (Number.isFinite(min)) return min;
  }

  const single = value.match(/(\d+)/);
  if (single) {
    const weeks = Number(single[1]);
    if (Number.isFinite(weeks)) return weeks;
  }

  return Number.MAX_SAFE_INTEGER;
}

function FallbackScore({
  score,
  animationKey,
  className,
}: {
  score: number;
  animationKey: string;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [animationKey]);

  return (
    <span className={cn('relative inline-flex tabular-nums', className)}>
      <span className={cn('transition-opacity duration-700 ease-out', isVisible ? 'opacity-0' : 'opacity-100')}>0</span>
      <span
        className={cn(
          'absolute inset-0 transition-opacity duration-700 ease-out',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
      >
        {score}
      </span>
    </span>
  );
}

function AnimatedScore({
  score,
  animationKey,
  CountUpComponent,
  className,
}: {
  score: number;
  animationKey: string;
  CountUpComponent: CountUpLike | null;
  className?: string;
}) {
  if (CountUpComponent) {
    return (
      <CountUpComponent
        key={animationKey}
        from={0}
        to={score}
        duration={0.8}
        startWhen
        className={cn('tabular-nums', className)}
      />
    );
  }

  return <FallbackScore score={score} animationKey={animationKey} className={className} />;
}

export default function MatchResults({
  matches,
  providers,
  onAddToShortlist,
  onViewDossier,
  shortlistedIds,
  algorithmVersion,
  generatedAt,
  totalCandidatesEvaluated,
  onRegenerate,
}: MatchResultsProps) {
  const [sortMode, setSortMode] = useState<SortMode>('score');
  const [CountUpComponent, setCountUpComponent] = useState<CountUpLike | null>(
    cachedCountUp === undefined ? null : cachedCountUp
  );

  useEffect(() => {
    let active = true;

    if (cachedCountUp !== undefined) {
      setCountUpComponent(cachedCountUp);
      return () => {
        active = false;
      };
    }

    loadCountUp().then((component) => {
      if (!active) return;
      setCountUpComponent(component);
    });

    return () => {
      active = false;
    };
  }, []);

  const providersById = useMemo(() => {
    return providers.reduce<Record<string, ProviderProfile>>((accumulator, provider) => {
      accumulator[provider.id] = provider;
      return accumulator;
    }, {});
  }, [providers]);

  const sortedMatches = useMemo(() => {
    const next = [...matches];

    next.sort((a, b) => {
      if (sortMode === 'budget') {
        const aMin = a.estimatedBudget?.min ?? Number.MAX_SAFE_INTEGER;
        const bMin = b.estimatedBudget?.min ?? Number.MAX_SAFE_INTEGER;
        if (aMin !== bMin) return aMin - bMin;
      } else if (sortMode === 'timeline') {
        const aWeeks = parseTimelineWeeks(a.estimatedTimeline);
        const bWeeks = parseTimelineWeeks(b.estimatedTimeline);
        if (aWeeks !== bWeeks) return aWeeks - bWeeks;
      }

      return b.overallScore - a.overallScore;
    });

    return next;
  }, [matches, sortMode]);

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-sm text-muted-foreground">
            No providers matched this brief&apos;s criteria. Try adjusting constraints or contact the Sablecrest team for assistance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">
                {matches.length} providers matched from {totalCandidatesEvaluated} evaluated
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{algorithmVersion}</span>
                <span>{parseGeneratedAt(generatedAt)}</span>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>

          <div className="inline-flex items-center gap-1 rounded-md border border-border p-1">
            <Button
              type="button"
              variant={sortMode === 'score' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortMode('score')}
              className="h-7 text-xs"
            >
              By Score
            </Button>
            <Button
              type="button"
              variant={sortMode === 'budget' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortMode('budget')}
              className="h-7 text-xs"
            >
              By Budget
            </Button>
            <Button
              type="button"
              variant={sortMode === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortMode('timeline')}
              className="h-7 text-xs"
            >
              By Timeline
            </Button>
          </div>
        </CardContent>
      </Card>

      {sortedMatches.map((match) => {
        const provider = providersById[match.providerId];
        const providerName = provider?.name ?? match.providerId;
        const roundedScore = Math.round(match.overallScore);
        const isShortlisted = shortlistedIds.includes(match.providerId);
        const animationKey = `${generatedAt}-${match.providerId}-${roundedScore}`;

        return (
          <Card key={match.providerId}>
            <CardContent className="p-6 space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn('text-5xl font-semibold leading-none tabular-nums', scoreColor(roundedScore))}>
                    <AnimatedScore
                      score={roundedScore}
                      animationKey={animationKey}
                      CountUpComponent={CountUpComponent}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg leading-tight">{providerName}</CardTitle>
                      {provider ? <TierBadge tier={provider.tier} size="sm" /> : <Badge variant="outline">Unknown Tier</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{match.explanation}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {BREAKDOWN_ROWS.map((row) => {
                  const value = Math.max(0, Math.min(100, Math.round(match.breakdown[row.key])));
                  return (
                    <div key={row.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-medium tabular-nums text-foreground">{value}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-foreground/40 transition-all duration-500" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Strengths</p>
                  <ul className="space-y-1">
                    {match.strengths.map((strength, index) => (
                      <li key={`${match.providerId}-strength-${index}`} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Risks</p>
                  <ul className="space-y-1">
                    {match.risks.map((risk, index) => (
                      <li key={`${match.providerId}-risk-${index}`} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Budget:{' '}
                    <span className="font-medium text-foreground tabular-nums">
                      ${match.estimatedBudget.min.toLocaleString()}-${match.estimatedBudget.max.toLocaleString()}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Timeline: <span className="font-medium text-foreground">{match.estimatedTimeline}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Confidence: <span className="font-medium text-foreground tabular-nums">{Math.round(match.confidence * 100)}%</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onViewDossier(match.providerId)}>
                    View Dossier
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAddToShortlist(match.providerId)}
                    disabled={isShortlisted}
                  >
                    {isShortlisted ? 'Shortlisted' : 'Add to Shortlist'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
