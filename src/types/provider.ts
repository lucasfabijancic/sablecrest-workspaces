export type VerificationLevel =
  | 'Unverified'
  | 'Provider-stated'
  | 'Documented'
  | 'Reference-validated'
  | 'Sablecrest-verified';

export type ProviderTier = 'Pending' | 'Emerging' | 'Verified' | 'Elite';

export type DeliveryModel =
  | 'Implementation'
  | 'Managed Service'
  | 'Staff Augmentation'
  | 'Hybrid';

export type EngagementPricing = 'Fixed Price' | 'Time & Materials' | 'Retainer' | 'Hybrid';

export interface ProviderCapability {
  capability: string;
  subcategories?: string[];
  experienceLevel: 'Competent' | 'Proficient' | 'Expert';
  verificationLevel: VerificationLevel;
  projectCount?: number;
}

export interface ProviderTeamMember {
  id: string;
  name: string;
  role: string;
  title: string;
  bio?: string;
  yearsExperience?: number;
  specializations: string[];
  linkedIn?: string;
  verificationLevel: VerificationLevel;
}

export interface ProviderEvidence {
  id: string;
  type:
    | 'Certification'
    | 'Insurance'
    | 'Case Study'
    | 'SOW Sample'
    | 'Reference Letter'
    | 'Audit Report'
    | 'Contract Template';
  name: string;
  description?: string;
  fileUrl?: string;
  visibility: 'Public' | 'NDA Required' | 'Sablecrest Only';
  verificationLevel: VerificationLevel;
  verifiedAt?: string;
  expiresAt?: string;
  uploadedAt: string;
}

export interface ProviderReference {
  id: string;
  companyName: string;
  contactName?: string;
  contactTitle?: string;
  projectType: string;
  projectDescription?: string;
  availability: 'Available' | 'After NDA' | 'By Request';
  verificationLevel: VerificationLevel;
}

export interface ProviderPerformance {
  totalEngagements: number;
  completedEngagements: number;
  successRate?: number;
  averageNps?: number;
  onTimeDeliveryRate?: number;
  lastUpdated: string;
}

export interface ProviderProfile {
  id: string;
  name: string;
  legalName?: string;
  website?: string;
  description: string;
  founded?: number;
  headquarters?: string;
  employeeCountRange: string;
  tier: ProviderTier;
  tierUpdatedAt?: string;
  overallVerification: VerificationLevel;
  regions: string[];
  capabilities: ProviderCapability[];
  aecSpecializations: string[];
  projectTypesServed: string[];
  typicalBudgetMin?: number;
  typicalBudgetMax?: number;
  typicalEngagementWeeks?: { min: number; max: number };
  leadTimeWeeks?: number;
  deliveryModels: DeliveryModel[];
  pricingModels: EngagementPricing[];
  teamMembers: ProviderTeamMember[];
  evidence: ProviderEvidence[];
  references: ProviderReference[];
  performanceMetrics?: ProviderPerformance;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fields excluded from client-side matching and public display.
 * internalNotes is for Sablecrest ops eyes only.
 * Full ProviderProfile is used in admin/ops views.
 * ProviderMatchView is used in matching algorithm output and buyer-facing displays.
 */
export type ProviderMatchView = Omit<ProviderProfile, 'internalNotes'>;

/**
 * Minimal provider info for list/card displays.
 */
export interface ProviderSummary {
  id: string;
  name: string;
  tier: ProviderTier;
  overallVerification: VerificationLevel;
  description: string;
  regions: string[];
  aecSpecializations: string[];
  typicalBudgetMin?: number;
  typicalBudgetMax?: number;
  capabilities: ProviderCapability[];
  employeeCountRange: string;
}
