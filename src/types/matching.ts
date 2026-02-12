import type { ProviderTier } from '@/types/provider';

export interface MatchScore {
  providerId: string;
  briefId: string;
  overallScore: number;
  breakdown: ScoreBreakdown;
  strengths: string[];
  risks: string[];
  estimatedBudget: {
    min: number;
    max: number;
  };
  estimatedTimeline: string;
  explanation: string;
  confidence: number;
  algorithmVersion: string;
  generatedAt: string;
}

export interface ScoreBreakdown {
  capabilityFit: number;
  budgetAlignment: number;
  timelineCompatibility: number;
  experienceRelevance: number;
  verificationLevel: number;
  successCriteriaAlignment: number;
}

export interface ShortlistEntry {
  id: string;
  briefId: string;
  providerId: string;
  matchScore: MatchScore;
  status: 'Proposed' | 'Contacted' | 'Interested' | 'Declined' | 'Selected';
  fitNotes?: string;
  addedAt: string;
  addedBy: string;
  contactedAt?: string;
  responseAt?: string;
}

export interface MatchingPreferences {
  preferredTiers?: ProviderTier[];
  requiredCapabilities?: string[];
  excludeProviders?: string[];
  maxResults?: number;
  minimumScore?: number;
}

export interface MatchingResult {
  briefId: string;
  matches: MatchScore[];
  totalCandidatesEvaluated: number;
  algorithmVersion: string;
  generatedAt: string;
}
