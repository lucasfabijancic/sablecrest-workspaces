import { assertUnreachable } from '@/lib/assertUnreachable';
import type { ImplementationBrief } from '@/types/brief';
import type { TimelineUrgency } from '@/types/database';
import type {
  MatchScore,
  MatchingPreferences,
  MatchingResult,
  ScoreBreakdown,
} from '@/types/matching';
import type {
  ProviderCapability,
  ProviderProfile,
  VerificationLevel,
} from '@/types/provider';

const ALGORITHM_VERSION = 'v1.0-client-side';
const DEFAULT_MAX_RESULTS = 10;

type BudgetFit = 'full' | 'partial' | 'none' | 'neutral';
type TimelineFit = 'fit' | 'tight' | 'cannot-fit' | 'neutral';
type UrgencyBucket = 'urgent' | 'high' | 'standard' | 'flexible' | 'exploring';

const KNOWN_TIMELINE_URGENCIES: TimelineUrgency[] = [
  'Immediate',
  'Within 2 weeks',
  'Within 1 month',
  'Within 3 months',
  'Flexible',
];

interface ScoredProvider {
  match: MatchScore;
  directCapabilityMatch: boolean;
  partialCapabilityMatch: boolean;
  budgetFit: BudgetFit;
  timelineFit: TimelineFit;
}

/**
 * Generates provider matches for an implementation brief using a deterministic v1 scoring model.
 *
 * Scoring model (100 points total):
 * - Capability Fit: 25
 * - Budget Alignment: 20
 * - Experience Relevance: 20
 * - Timeline Compatibility: 15
 * - Verification Level: 10
 * - Success Criteria Alignment: 10
 *
 * The function is pure and data-source agnostic: pass brief + providers from shell mock data
 * or future Supabase query results.
 */
export function generateMatches(
  brief: ImplementationBrief,
  providers: ProviderProfile[],
  preferences: MatchingPreferences = {}
): MatchingResult {
  const generatedAt = new Date().toISOString();

  const filteredProviders = providers.filter((provider) => {
    if (preferences.excludeProviders?.includes(provider.id)) return false;

    if (preferences.preferredTiers?.length && !preferences.preferredTiers.includes(provider.tier)) {
      return false;
    }

    if (preferences.requiredCapabilities?.length && !providerMatchesRequiredCapabilities(provider, preferences.requiredCapabilities)) {
      return false;
    }

    return true;
  });

  const scored = filteredProviders.map((provider) => scoreProvider(brief, provider, generatedAt));

  const minimumScore = typeof preferences.minimumScore === 'number' ? preferences.minimumScore : undefined;

  const postThreshold = typeof minimumScore === 'number'
    ? scored.filter((item) => item.match.overallScore >= minimumScore)
    : scored;

  const sorted = postThreshold.sort((a, b) => {
    if (b.match.overallScore !== a.match.overallScore) {
      return b.match.overallScore - a.match.overallScore;
    }

    return b.match.confidence - a.match.confidence;
  });

  const maxResults =
    typeof preferences.maxResults === 'number' && Number.isFinite(preferences.maxResults)
      ? Math.max(0, Math.floor(preferences.maxResults))
      : DEFAULT_MAX_RESULTS;

  return {
    briefId: brief.id,
    matches: sorted.slice(0, maxResults).map((item) => item.match),
    totalCandidatesEvaluated: filteredProviders.length,
    algorithmVersion: ALGORITHM_VERSION,
    generatedAt,
  };
}

function scoreProvider(
  brief: ImplementationBrief,
  provider: ProviderProfile,
  generatedAt: string
): ScoredProvider {
  const capability = scoreCapabilityFit(brief, provider);
  const budget = scoreBudgetAlignment(brief, provider);
  const experience = scoreExperienceRelevance(provider);
  const timeline = scoreTimelineCompatibility(brief, provider);
  const verification = scoreVerificationLevel(provider.overallVerification);
  const successCriteria = scoreSuccessCriteriaAlignment(brief, provider);

  const overallScore = clampScore(
    capability.points +
      budget.points +
      experience.points +
      timeline.points +
      verification.points +
      successCriteria.points
  );

  const breakdown: ScoreBreakdown = {
    capabilityFit: toDimensionPercent(capability.points, 25),
    budgetAlignment: toDimensionPercent(budget.points, 20),
    timelineCompatibility: toDimensionPercent(timeline.points, 15),
    experienceRelevance: toDimensionPercent(experience.points, 20),
    verificationLevel: toDimensionPercent(verification.points, 10),
    successCriteriaAlignment: toDimensionPercent(successCriteria.points, 10),
  };

  const estimatedBudget = deriveEstimatedBudget(brief, provider);

  const match: MatchScore = {
    providerId: provider.id,
    briefId: brief.id,
    overallScore,
    breakdown,
    strengths: buildStrengths({
      provider,
      capability,
      budget,
      experience,
      verification,
    }),
    risks: buildRisks({
      provider,
      capability,
      budget,
      experience,
      timeline,
    }),
    estimatedBudget,
    estimatedTimeline: deriveEstimatedTimeline(provider),
    explanation: buildExplanation({
      provider,
      capability,
      budget,
      timeline,
      brief,
    }),
    confidence: deriveConfidence(provider),
    algorithmVersion: ALGORITHM_VERSION,
    generatedAt,
  };

  return {
    match,
    directCapabilityMatch: capability.directMatch,
    partialCapabilityMatch: capability.partialMatch,
    budgetFit: budget.fit,
    timelineFit: timeline.fit,
  };
}

function scoreCapabilityFit(brief: ImplementationBrief, provider: ProviderProfile): {
  points: number;
  directMatch: boolean;
  partialMatch: boolean;
} {
  const directMatch = provider.projectTypesServed.includes(brief.projectTypeId);

  if (directMatch) {
    return { points: 25, directMatch: true, partialMatch: false };
  }

  const relatedMatch = hasRelatedCapabilityMatch(brief, provider);

  if (relatedMatch) {
    return { points: 12, directMatch: false, partialMatch: true };
  }

  return { points: 0, directMatch: false, partialMatch: false };
}

function hasRelatedCapabilityMatch(brief: ImplementationBrief, provider: ProviderProfile): boolean {
  const briefKeywords = extractBriefKeywords(brief);
  if (briefKeywords.length === 0) return false;

  const providerKeywords = extractProviderKeywords(provider);
  if (providerKeywords.length === 0) return false;

  return briefKeywords.some((keyword) => providerKeywords.includes(keyword));
}

function scoreBudgetAlignment(brief: ImplementationBrief, provider: ProviderProfile): {
  points: number;
  fit: BudgetFit;
} {
  const briefMin = brief.constraints.budget.min;
  const briefMax = brief.constraints.budget.max;
  const providerMin = provider.typicalBudgetMin;
  const providerMax = provider.typicalBudgetMax;

  const hasBriefBudget = typeof briefMin === 'number' && typeof briefMax === 'number';
  const hasProviderBudget = typeof providerMin === 'number' && typeof providerMax === 'number';

  if (!hasBriefBudget || !hasProviderBudget) {
    return { points: 10, fit: 'neutral' };
  }

  if (providerMin <= briefMin && providerMax >= briefMax) {
    return { points: 20, fit: 'full' };
  }

  if (rangesOverlap(providerMin, providerMax, briefMin, briefMax)) {
    return { points: 10, fit: 'partial' };
  }

  return { points: 2, fit: 'none' };
}

function scoreExperienceRelevance(provider: ProviderProfile): { points: number } {
  const completed = provider.performanceMetrics?.completedEngagements;
  const total = provider.performanceMetrics?.totalEngagements;
  const completedEquivalent =
    typeof completed === 'number' && Number.isFinite(completed) && completed > 0
      ? completed
      : typeof total === 'number' && Number.isFinite(total) && total > 0
        ? total
        : undefined;

  if (typeof completedEquivalent !== 'number') {
    return { points: 3 };
  }

  if (completedEquivalent >= 20) return { points: 20 };
  if (completedEquivalent >= 10) return { points: 15 };
  if (completedEquivalent >= 5) return { points: 10 };
  return { points: 5 };
}

function scoreTimelineCompatibility(brief: ImplementationBrief, provider: ProviderProfile): {
  points: number;
  fit: TimelineFit;
} {
  const bucket = resolveUrgencyBucket(brief.constraints.timeline.urgency);

  const lead = provider.leadTimeWeeks;
  const engagementWeeks = provider.typicalEngagementWeeks;

  const hasTimelineData =
    typeof lead === 'number' &&
    typeof engagementWeeks?.min === 'number' &&
    typeof engagementWeeks?.max === 'number';

  if (!bucket || !hasTimelineData) {
    return { points: 8, fit: 'neutral' };
  }

  if (bucket === 'exploring' || bucket === 'flexible') {
    return { points: 15, fit: 'fit' };
  }

  const providerTotalWeeks = lead + engagementWeeks.max;
  const expectedMax = expectedWeeksForBucket(bucket);

  if (providerTotalWeeks <= expectedMax) {
    return { points: 15, fit: 'fit' };
  }

  if (providerTotalWeeks <= expectedMax * 2) {
    return { points: 8, fit: 'tight' };
  }

  return { points: 0, fit: 'cannot-fit' };
}

function expectedWeeksForBucket(bucket: Exclude<UrgencyBucket, 'flexible' | 'exploring'>): number {
  switch (bucket) {
    case 'urgent':
      return 4;
    case 'high':
      return 8;
    case 'standard':
      return 16;
    default:
      return assertUnreachable(bucket);
  }
}

function scoreVerificationLevel(level: VerificationLevel): { points: number } {
  switch (level) {
    case 'Sablecrest-verified':
      return { points: 10 };
    case 'Reference-validated':
      return { points: 8 };
    case 'Documented':
      return { points: 6 };
    case 'Provider-stated':
      return { points: 3 };
    case 'Unverified':
      return { points: 0 };
    default:
      return assertUnreachable(level);
  }
}

function scoreSuccessCriteriaAlignment(brief: ImplementationBrief, provider: ProviderProfile): {
  points: number;
} {
  const criteria = Array.isArray(brief.successCriteria) ? brief.successCriteria : [];

  if (criteria.length === 0) {
    return { points: 5 };
  }

  const highImportanceCriteria = criteria.filter((criterion) => (criterion.weight ?? 0) >= 7);

  if (highImportanceCriteria.length === 0) {
    return { points: 5 };
  }

  const providerKeywords = extractProviderKeywords(provider);

  const matches = highImportanceCriteria.reduce((count, criterion) => {
    const metric = normalize(criterion.metric);
    if (!metric) return count;

    const found = providerKeywords.some((keyword) => metric.includes(keyword));
    return found ? count + 1 : count;
  }, 0);

  return { points: Math.min(matches * 2, 10) };
}

function buildExplanation(input: {
  provider: ProviderProfile;
  capability: { points: number; directMatch: boolean; partialMatch: boolean };
  budget: { points: number; fit: BudgetFit };
  timeline: { points: number; fit: TimelineFit };
  brief: ImplementationBrief;
}): string {
  const capabilitySentence = input.capability.directMatch
    ? `Direct match for ${input.brief.projectTypeId} with relevant implementation capabilities.`
    : input.capability.partialMatch
      ? 'Related capability coverage is present, though direct project-type evidence is limited.'
      : 'Direct capability alignment for this project type appears limited.';

  const budgetPhrase = (() => {
    switch (input.budget.fit) {
      case 'full':
        return 'Budget range aligns well.';
      case 'partial':
        return 'Budget overlap is partial.';
      case 'none':
        return 'Budget range appears misaligned.';
      case 'neutral':
        return 'Budget alignment requires confirmation.';
      default:
        return assertUnreachable(input.budget.fit);
    }
  })();

  const timelinePhrase = (() => {
    switch (input.timeline.fit) {
      case 'fit':
        return 'Timeline appears feasible.';
      case 'tight':
        return 'Lead time may be tight against urgency.';
      case 'cannot-fit':
        return 'Timeline is unlikely without scope or sequencing changes.';
      case 'neutral':
        return 'Timeline feasibility needs validation.';
      default:
        return assertUnreachable(input.timeline.fit);
    }
  })();

  return `${capabilitySentence} ${budgetPhrase} ${timelinePhrase}`;
}

function buildStrengths(input: {
  provider: ProviderProfile;
  capability: { points: number; directMatch: boolean; partialMatch: boolean };
  budget: { points: number };
  experience: { points: number };
  verification: { points: number };
}): string[] {
  const strengths: string[] = [];

  if (input.capability.directMatch) {
    strengths.push('Direct project-type experience is present.');
  } else if (input.capability.partialMatch) {
    strengths.push('Related capabilities suggest practical fit.');
  }

  if (input.verification.points >= 8) {
    strengths.push('Verification quality is high for key claims.');
  }

  if (input.experience.points >= 15) {
    strengths.push('Strong completed-engagement track record.');
  }

  if (input.budget.points >= 10) {
    strengths.push('Budget profile is within or near target range.');
  }

  if (input.provider.regions.length > 0) {
    strengths.push(`Regional footprint includes ${input.provider.regions.slice(0, 2).join(', ')}.`);
  }

  while (strengths.length < 2) {
    strengths.push('Baseline fit is present across core criteria.');
  }

  return strengths.slice(0, 3);
}

function buildRisks(input: {
  provider: ProviderProfile;
  capability: { directMatch: boolean; partialMatch: boolean };
  budget: { points: number };
  experience: { points: number };
  timeline: { fit: TimelineFit; points: number };
}): string[] {
  const risks: string[] = [];

  if (input.timeline.fit === 'tight' || input.timeline.fit === 'cannot-fit') {
    risks.push('Timeline pressure could impact delivery certainty.');
  }

  if (input.experience.points <= 5) {
    risks.push('Limited completed project history for this profile.');
  }

  if (input.budget.points <= 2) {
    risks.push('Budget mismatch may require scope tradeoffs.');
  }

  if (!input.capability.directMatch && !input.capability.partialMatch) {
    risks.push('No direct evidence of experience with this exact project type.');
  }

  if (!input.provider.performanceMetrics) {
    risks.push('Performance metrics are incomplete, reducing predictability.');
  }

  if (risks.length === 0) {
    risks.push('No material risks identified from current structured inputs.');
  }

  return risks.slice(0, 2);
}

function deriveEstimatedBudget(
  brief: ImplementationBrief,
  provider: ProviderProfile
): { min: number; max: number } {
  const briefMin = brief.constraints.budget.min;
  const briefMax = brief.constraints.budget.max;

  let min = provider.typicalBudgetMin ?? briefMin ?? 0;
  let max = provider.typicalBudgetMax ?? briefMax ?? min;

  if (min > max) {
    const temp = min;
    min = max;
    max = temp;
  }

  if (typeof briefMin === 'number' && typeof briefMax === 'number') {
    const clampedMin = Math.max(min, briefMin);
    const clampedMax = Math.min(max, briefMax);

    if (clampedMin <= clampedMax) {
      return { min: Math.round(clampedMin), max: Math.round(clampedMax) };
    }

    if (max < briefMin) {
      return { min: Math.round(briefMin), max: Math.round(briefMin) };
    }

    return { min: Math.round(briefMax), max: Math.round(briefMax) };
  }

  if (typeof briefMin === 'number') {
    min = Math.max(min, briefMin);
    max = Math.max(max, min);
  }

  if (typeof briefMax === 'number') {
    max = Math.min(max, briefMax);
    min = Math.min(min, max);
  }

  return {
    min: Math.round(min),
    max: Math.round(max),
  };
}

function deriveEstimatedTimeline(provider: ProviderProfile): string {
  const lead = provider.leadTimeWeeks;
  const engagement = provider.typicalEngagementWeeks;

  if (typeof engagement?.min === 'number' && typeof engagement?.max === 'number') {
    if (typeof lead === 'number') {
      return `${lead} week lead + ${engagement.min}-${engagement.max} week implementation window`;
    }

    return `${engagement.min}-${engagement.max} week implementation window`;
  }

  if (typeof lead === 'number') {
    return `${lead} week lead time; delivery duration to be confirmed`;
  }

  return 'Timeline estimate pending provider details';
}

function deriveConfidence(provider: ProviderProfile): number {
  const hasBudgetData =
    typeof provider.typicalBudgetMin === 'number' &&
    typeof provider.typicalBudgetMax === 'number';

  const hasPerformanceData =
    typeof provider.performanceMetrics?.totalEngagements === 'number' ||
    typeof provider.performanceMetrics?.completedEngagements === 'number';

  const hasTimelineData =
    typeof provider.leadTimeWeeks === 'number' &&
    typeof provider.typicalEngagementWeeks?.min === 'number' &&
    typeof provider.typicalEngagementWeeks?.max === 'number';

  const hasCapabilityData = provider.capabilities.length > 0 || provider.projectTypesServed.length > 0;

  if (hasBudgetData && hasPerformanceData && hasTimelineData && hasCapabilityData) {
    return 0.9;
  }

  if (!hasBudgetData && !hasPerformanceData) {
    return 0.3;
  }

  if (!hasPerformanceData) {
    return 0.6;
  }

  if (!hasBudgetData) {
    return 0.75;
  }

  return 0.8;
}

function providerMatchesRequiredCapabilities(
  provider: ProviderProfile,
  requiredCapabilities: string[]
): boolean {
  const providerText = normalize(
    [
      ...provider.capabilities.map((capability) => capability.capability),
      ...provider.capabilities.flatMap((capability) => capability.subcategories ?? []),
      ...provider.aecSpecializations,
      ...provider.projectTypesServed,
      provider.description,
    ].join(' ')
  );

  return requiredCapabilities.every((required) => {
    const normalized = normalize(required);
    return normalized.length > 0 && providerText.includes(normalized);
  });
}

function extractBriefKeywords(brief: ImplementationBrief): string[] {
  const text = [
    brief.projectTypeId,
    brief.title,
    brief.businessContext.industry,
    brief.businessContext.currentState,
    brief.businessContext.desiredOutcome,
    ...brief.requirements.map((item) => item.description),
    ...brief.successCriteria.map((item) => item.metric),
  ].join(' ');

  return tokenize(text);
}

function extractProviderKeywords(provider: ProviderProfile): string[] {
  const capabilityKeywords = provider.capabilities.flatMap((capability) => {
    const base = [capability.capability, ...(capability.subcategories ?? [])]
      .join(' ')
      .toLowerCase();

    // We use experience level as a lightweight proxy for how confidently to consider the keyword set.
    const includeCount = scoreCapabilityExperienceLevel(capability.experienceLevel) >= 50 ? 1 : 0;

    if (includeCount === 0) return [] as string[];
    return tokenize(base);
  });

  const otherKeywords = tokenize(
    [provider.description, ...provider.aecSpecializations, ...provider.projectTypesServed].join(' ')
  );

  return Array.from(new Set([...capabilityKeywords, ...otherKeywords]));
}

function scoreCapabilityExperienceLevel(level: ProviderCapability['experienceLevel']): number {
  switch (level) {
    case 'Competent':
      return 50;
    case 'Proficient':
      return 75;
    case 'Expert':
      return 100;
    default:
      return assertUnreachable(level);
  }
}

function isTimelineUrgency(value: string): value is TimelineUrgency {
  return KNOWN_TIMELINE_URGENCIES.includes(value as TimelineUrgency);
}

function mapTimelineUrgencyToBucket(urgency: TimelineUrgency): UrgencyBucket {
  switch (urgency) {
    case 'Immediate':
      return 'urgent';
    case 'Within 2 weeks':
      return 'high';
    case 'Within 1 month':
      return 'standard';
    case 'Within 3 months':
      return 'standard';
    case 'Flexible':
      return 'flexible';
    default:
      return assertUnreachable(urgency);
  }
}

function resolveUrgencyBucket(urgency: string | TimelineUrgency | undefined): UrgencyBucket | null {
  if (!urgency || typeof urgency !== 'string') {
    return null;
  }

  if (isTimelineUrgency(urgency)) {
    return mapTimelineUrgencyToBucket(urgency);
  }

  const normalized = normalize(urgency);

  if (normalized === 'urgent') return 'urgent';
  if (normalized === 'high') return 'high';
  if (normalized === 'standard') return 'standard';
  if (normalized === 'flexible') return 'flexible';
  if (normalized === 'exploring') return 'exploring';

  return null;
}

function rangesOverlap(minA: number, maxA: number, minB: number, maxB: number): boolean {
  return Math.max(minA, minB) <= Math.min(maxA, maxB);
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toDimensionPercent(points: number, maxPoints: number): number {
  if (maxPoints <= 0) return 0;
  return clampScore((points / maxPoints) * 100);
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(' ')
    .filter((token) => token.length >= 4);
}
