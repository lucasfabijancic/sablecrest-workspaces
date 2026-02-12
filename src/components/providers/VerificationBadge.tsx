import {
  Check,
  CheckCheck,
  Circle,
  FileCheck,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { VerificationLevel } from '@/types/provider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  level: VerificationLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const LEVEL_CONFIG: Record<
  VerificationLevel,
  {
    label: string;
    description: string;
    Icon: LucideIcon;
    className: string;
  }
> = {
  Unverified: {
    label: 'Unverified',
    description: 'This information has not been verified.',
    Icon: Circle,
    className:
      'border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300',
  },
  'Provider-stated': {
    label: 'Provider-stated',
    description: 'Stated by the provider. Not independently verified.',
    Icon: Check,
    className:
      'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
  Documented: {
    label: 'Documented',
    description: 'Supported by uploaded documentation.',
    Icon: FileCheck,
    className:
      'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  },
  'Reference-validated': {
    label: 'Reference-validated',
    description: 'Confirmed by at least one client reference.',
    Icon: CheckCheck,
    className:
      'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  },
  'Sablecrest-verified': {
    label: 'Sablecrest-verified',
    description: 'Independently verified by the Sablecrest team.',
    Icon: ShieldCheck,
    className:
      'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  },
};

const SIZE_CONFIG = {
  sm: {
    root: 'gap-1 px-2 py-0.5',
    icon: 'h-3 w-3',
    text: 'text-xs',
  },
  md: {
    root: 'gap-1.5 px-2.5 py-1',
    icon: 'h-4 w-4',
    text: 'text-sm',
  },
  lg: {
    root: 'gap-2 px-3 py-1.5',
    icon: 'h-5 w-5',
    text: 'text-base',
  },
} as const;

export default function VerificationBadge({
  level,
  size = 'md',
  showLabel = true,
}: VerificationBadgeProps) {
  const config = LEVEL_CONFIG[level];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.Icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
            config.className,
            sizeConfig.root,
            sizeConfig.text
          )}
        >
          <Icon className={cn('shrink-0', sizeConfig.icon)} aria-hidden="true" />
          {showLabel ? <span>{config.label}</span> : null}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-xs">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
