import { useEffect, useMemo, useState } from 'react';
import CountUp from '@/components/reactbits/CountUp';
import type { ScoreBreakdown } from '@/types/matching';
import { cn } from '@/lib/utils';

type FitScoreSize = 'compact' | 'full';

interface FitScoreCardProps {
  score: number;
  breakdown?: ScoreBreakdown;
  size?: FitScoreSize;
}

interface ScoreTone {
  text: string;
  bg: string;
  border: string;
  ring: string;
  bar: string;
}

const BREAKDOWN_ROWS: Array<{ key: keyof ScoreBreakdown; label: string }> = [
  { key: 'capabilityFit', label: 'Capability Fit' },
  { key: 'budgetAlignment', label: 'Budget' },
  { key: 'timelineCompatibility', label: 'Timeline' },
  { key: 'experienceRelevance', label: 'Experience' },
  { key: 'verificationLevel', label: 'Verification' },
  { key: 'successCriteriaAlignment', label: 'Success Alignment' },
];

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const getScoreTone = (value: number): ScoreTone => {
  if (value >= 80) {
    return {
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100/70 dark:bg-emerald-950/50',
      border: 'border-emerald-300/70 dark:border-emerald-800/60',
      ring: 'stroke-emerald-500',
      bar: 'bg-emerald-500',
    };
  }

  if (value >= 60) {
    return {
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100/70 dark:bg-amber-950/50',
      border: 'border-amber-300/70 dark:border-amber-800/60',
      ring: 'stroke-amber-500',
      bar: 'bg-amber-500',
    };
  }

  if (value >= 40) {
    return {
      text: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100/70 dark:bg-orange-950/50',
      border: 'border-orange-300/70 dark:border-orange-800/60',
      ring: 'stroke-orange-500',
      bar: 'bg-orange-500',
    };
  }

  return {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100/70 dark:bg-red-950/50',
    border: 'border-red-300/70 dark:border-red-800/60',
    ring: 'stroke-red-500',
    bar: 'bg-red-500',
  };
};

export default function FitScoreCard({
  score,
  breakdown,
  size = 'full',
}: FitScoreCardProps) {
  const safeScore = clampPercent(score);

  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    setAnimatedScore(0);

    const frame = window.requestAnimationFrame(() => {
      setAnimatedScore(safeScore);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [safeScore]);

  const scoreTone = getScoreTone(safeScore);

  if (size === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold tabular-nums',
          scoreTone.bg,
          scoreTone.border,
          scoreTone.text
        )}
        aria-label={`Fit score ${safeScore} out of 100`}
      >
        {safeScore}
      </div>
    );
  }

  const ringSize = 168;
  const stroke = 11;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedScore / 100) * circumference;

  const breakdownRows = useMemo(
    () =>
      breakdown
        ? BREAKDOWN_ROWS.map((row) => ({
            key: row.key,
            label: row.label,
            value: clampPercent(breakdown[row.key]),
          }))
        : [],
    [breakdown]
  );

  return (
    <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 p-6 shadow-sm">
      <div className="mx-auto flex w-full max-w-[220px] flex-col items-center">
        <div className="relative">
          <svg width={ringSize} height={ringSize} className="block">
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              className="fill-none stroke-muted/40"
              strokeWidth={stroke}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              className={cn('fill-none transition-all duration-700 ease-out', scoreTone.ring)}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <CountUp
              key={`overall-${safeScore}`}
              to={safeScore}
              from={0}
              duration={0.8}
              className={cn('text-4xl font-semibold leading-none tabular-nums', scoreTone.text)}
            />
            <span className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Fit Score</span>
          </div>
        </div>
      </div>

      {breakdownRows.length > 0 ? (
        <div className="mt-7 space-y-3">
          {breakdownRows.map((row, index) => {
            const tone = getScoreTone(row.value);
            return (
              <div key={row.key} className="space-y-1.5">
                <div className="grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground">{row.label}</span>

                  <div className="h-2.5 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className={cn('h-full transition-all duration-700 ease-out', tone.bar)}
                      style={{ width: `${row.value}%` }}
                    />
                  </div>

                  <CountUp
                    key={`breakdown-${row.key}-${row.value}`}
                    from={0}
                    to={row.value}
                    delay={index * 0.1}
                    duration={0.65}
                    className={cn('w-10 text-right text-xs font-semibold tabular-nums', tone.text)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
