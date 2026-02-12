import { Check, Star } from 'lucide-react';
import type { ProviderTier } from '@/types/provider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: ProviderTier;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_CONFIG: Record<
  ProviderTier,
  {
    label: string;
    description: string;
    className: string;
    icon?: 'check' | 'star';
  }
> = {
  Pending: {
    label: 'Pending',
    description: 'Provider application is under review.',
    className:
      'border border-dashed border-gray-400 text-gray-700 bg-transparent dark:border-gray-600 dark:text-gray-300',
  },
  Emerging: {
    label: 'Emerging',
    description: 'New to the network. Limited track record on Sablecrest.',
    className:
      'border border-transparent bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300',
  },
  Verified: {
    label: 'Verified',
    description: 'Established track record. Documentation and references confirmed.',
    className:
      'border border-transparent bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    icon: 'check',
  },
  Elite: {
    label: 'Elite',
    description: 'Top-tier partner. Consistently high performance across multiple engagements.',
    className:
      'border border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    icon: 'star',
  },
};

const SIZE_CONFIG = {
  sm: {
    root: 'px-1.5 py-0.5 text-xs',
    icon: 'h-3 w-3',
  },
  md: {
    root: 'px-2 py-1 text-sm',
    icon: 'h-4 w-4',
  },
  lg: {
    root: 'px-3 py-1.5 text-base',
    icon: 'h-5 w-5',
  },
} as const;

export default function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const config = TIER_CONFIG[tier];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
            config.className,
            sizeConfig.root
          )}
        >
          {config.icon === 'check' ? (
            <Check className={cn('shrink-0', sizeConfig.icon)} aria-hidden="true" />
          ) : null}
          {config.icon === 'star' ? (
            <Star className={cn('shrink-0', sizeConfig.icon)} aria-hidden="true" />
          ) : null}
          <span>{config.label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-xs">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
