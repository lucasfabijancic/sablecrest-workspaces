import type { BudgetBand } from '@/types/database';

// Evidence verification levels
export type VerificationLevel = 'Provider-stated' | 'Documented' | 'Reference-validated' | 'Sablecrest-assessed';

// Delivery model types
export type DeliveryModel = 'Implementation' | 'Managed Service' | 'Hybrid';
export type EngagementType = 'Fixed Price' | 'Time & Materials' | 'Hybrid' | 'Retainer';

// Extended provider type for shortlist display
export interface ProviderCardSummary {
  id: string;
  name: string;
  logo?: string;
  regions: string[];
  category: string;
  fitSummary: string;
  capabilities: string[];
  budgetBand: BudgetBand;
  typicalTimeline: string;
  leadTime: string;
  deliveryModel: DeliveryModel;
  engagementType: EngagementType;
  riskRating: 'Low' | 'Medium' | 'High';
  riskReason: string;
  proofCount: number;
  referenceAvailability: 'Yes' | 'After NDA' | 'Limited';
  verificationStatus: 'Verified' | 'Pending' | 'Incomplete';
  evidenceCompleteness: number; // 0-100
}

export interface EvidenceArtifact {
  id: string;
  type: 'SOW' | 'Case Study' | 'Security Cert' | 'Insurance' | 'Reference Letter' | 'Audit Report' | 'Contract Template';
  name: string;
  visibility: 'Public' | 'NDA Required' | 'Client Only';
  verificationLevel: VerificationLevel;
  ndaRequired: boolean;
  uploadedAt: string;
  url?: string;
}

export interface ProviderPitchbook {
  id: string;
  providerId: string;
  summary: {
    overview: string;
    keyStrengths: string[];
    idealFor: string[];
    verificationLevel: VerificationLevel;
  };
  deliverySystem: {
    teamSize: string;
    keyPersonnel: { name: string; role: string; bio: string }[];
    deliveryApproach: string;
    communication: string;
    methodology: string;
    verificationLevel: VerificationLevel;
  };
  proof: {
    caseStudies: { title: string; client: string; outcome: string; verified: boolean }[];
    testimonials: { quote: string; author: string; company: string }[];
    projectCount: number;
    verificationLevel: VerificationLevel;
  };
  commercials: {
    pricingModel: string;
    typicalEngagement: string;
    paymentTerms: string;
    flexibilities: string[];
    verificationLevel: VerificationLevel;
  };
  riskAndControls: {
    insurances: string[];
    certifications: string[];
    dataHandling: string;
    escalationProcess: string;
    verificationLevel: VerificationLevel;
  };
  security: {
    securityLevel: 'Basic' | 'Standard' | 'Enterprise';
    compliance: string[];
    dataResidency: string;
    auditHistory: string;
    verificationLevel: VerificationLevel;
  };
  references: {
    available: boolean;
    ndaRequired: boolean;
    recentReferences: { company: string; contact: string; project: string }[];
    verificationLevel: VerificationLevel;
  };
}

export interface CompareProviderView {
  id: string;
  name: string;
  budgetBand: BudgetBand;
  timeline: string;
  leadTime: string;
  engagementType: EngagementType;
  deliveryModel: DeliveryModel;
  scopeBoundaries: string;
  keyRisks: string[];
  proofSummary: string;
  securityPosture: string;
}

// Selection criteria for enterprise decision-making
export interface SelectionCriterion {
  id: string;
  name: string;
  weight: number; // 1-10
  rationale: string;
  category: 'Technical' | 'Commercial' | 'Risk' | 'Strategic';
}

export interface CriteriaSet {
  id: string;
  requestId: string;
  criteria: SelectionCriterion[];
  createdAt: string;
  updatedAt: string;
}

// Selection Pack for final recommendation
export interface SelectionPack {
  id: string;
  requestId: string;
  status: 'Draft' | 'Ready' | 'Approved' | 'Exported';
  sections: {
    executiveSummary: string;
    criteriaAnalysis: string;
    shortlistComparison: string;
    recommendation: string;
    riskAssessment: string;
    nextSteps: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Governance log for delivery oversight
export interface GovernanceEntry {
  id: string;
  week: number;
  date: string;
  status: 'On Track' | 'At Risk' | 'Off Track';
  summary: string;
  keyIssues: string[];
  nextActions: string[];
  authorId: string;
}

export interface GovernanceLog {
  requestId: string;
  entries: GovernanceEntry[];
}

export const mockProviders: ProviderCardSummary[] = [
  {
    id: 'prov-1',
    name: 'Apex Digital Solutions',
    logo: undefined,
    regions: ['North America', 'Europe'],
    category: 'Full-stack Implementation',
    fitSummary: 'Strong enterprise track record with AI/ML integrations. Excellent for complex multi-system deployments.',
    capabilities: ['AI/ML', 'Enterprise Integration', 'Cloud Migration', 'Security', 'Data Engineering'],
    budgetBand: '$150K-$500K',
    typicalTimeline: '3-6 months',
    leadTime: '2-3 weeks',
    deliveryModel: 'Implementation',
    engagementType: 'Hybrid',
    riskRating: 'Low',
    riskReason: 'Established vendor with proven delivery history',
    proofCount: 12,
    referenceAvailability: 'Yes',
    verificationStatus: 'Verified',
    evidenceCompleteness: 95,
  },
  {
    id: 'prov-2',
    name: 'Nimbus Tech Partners',
    logo: undefined,
    regions: ['Europe'],
    category: 'AI Consulting',
    fitSummary: 'Specialized in LLM implementations and prompt engineering. Fast iteration cycles.',
    capabilities: ['LLM Integration', 'Prompt Engineering', 'RAG Systems', 'Fine-tuning'],
    budgetBand: '$50K-$150K',
    typicalTimeline: '4-8 weeks',
    leadTime: '1 week',
    deliveryModel: 'Implementation',
    engagementType: 'Time & Materials',
    riskRating: 'Medium',
    riskReason: 'Newer firm, but strong technical team',
    proofCount: 5,
    referenceAvailability: 'After NDA',
    verificationStatus: 'Verified',
    evidenceCompleteness: 78,
  },
  {
    id: 'prov-3',
    name: 'DataForge Analytics',
    logo: undefined,
    regions: ['Global'],
    category: 'Data Engineering',
    fitSummary: 'Best-in-class data infrastructure. Ideal for high-volume data processing needs.',
    capabilities: ['Data Pipelines', 'Analytics', 'BI Dashboards', 'ETL', 'Real-time Processing'],
    budgetBand: '$50K-$150K',
    typicalTimeline: '2-4 months',
    leadTime: '2 weeks',
    deliveryModel: 'Hybrid',
    engagementType: 'Fixed Price',
    riskRating: 'Low',
    riskReason: 'Multiple successful similar projects',
    proofCount: 18,
    referenceAvailability: 'Yes',
    verificationStatus: 'Verified',
    evidenceCompleteness: 100,
  },
  {
    id: 'prov-4',
    name: 'Quantum Innovations',
    logo: undefined,
    regions: ['Asia'],
    category: 'R&D Partner',
    fitSummary: 'Cutting-edge research capabilities. Best for experimental or novel implementations.',
    capabilities: ['Research', 'Prototyping', 'Novel AI', 'Academic Partnerships'],
    budgetBand: '$10K-$50K',
    typicalTimeline: '1-3 months',
    leadTime: '1-2 weeks',
    deliveryModel: 'Implementation',
    engagementType: 'Time & Materials',
    riskRating: 'High',
    riskReason: 'Research-focused, may require iteration',
    proofCount: 3,
    referenceAvailability: 'Limited',
    verificationStatus: 'Pending',
    evidenceCompleteness: 45,
  },
  {
    id: 'prov-5',
    name: 'SecureOps Consulting',
    logo: undefined,
    regions: ['North America'],
    category: 'Security & Compliance',
    fitSummary: 'Security-first approach. Essential for regulated industries and sensitive data handling.',
    capabilities: ['Security Audit', 'Compliance', 'SOC2', 'HIPAA', 'Penetration Testing'],
    budgetBand: '$50K-$150K',
    typicalTimeline: '4-8 weeks',
    leadTime: '3 weeks',
    deliveryModel: 'Managed Service',
    engagementType: 'Retainer',
    riskRating: 'Low',
    riskReason: 'Industry leader in security consulting',
    proofCount: 24,
    referenceAvailability: 'Yes',
    verificationStatus: 'Verified',
    evidenceCompleteness: 100,
  },
];

export const mockEvidenceArtifacts: EvidenceArtifact[] = [
  {
    id: 'ev-1',
    type: 'Security Cert',
    name: 'SOC 2 Type II Certificate',
    visibility: 'Public',
    verificationLevel: 'Documented',
    ndaRequired: false,
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ev-2',
    type: 'Case Study',
    name: 'Fortune 500 AI Transformation',
    visibility: 'NDA Required',
    verificationLevel: 'Reference-validated',
    ndaRequired: true,
    uploadedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ev-3',
    type: 'Insurance',
    name: 'E&O Coverage Certificate',
    visibility: 'Client Only',
    verificationLevel: 'Sablecrest-assessed',
    ndaRequired: false,
    uploadedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ev-4',
    type: 'SOW',
    name: 'Redacted Enterprise SOW Template',
    visibility: 'NDA Required',
    verificationLevel: 'Provider-stated',
    ndaRequired: true,
    uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockCriteriaSet: CriteriaSet = {
  id: 'crit-1',
  requestId: 'mock-req-3',
  criteria: [
    { id: 'c1', name: 'Technical Expertise', weight: 9, rationale: 'Critical for complex AI/ML implementation', category: 'Technical' },
    { id: 'c2', name: 'Enterprise Experience', weight: 8, rationale: 'Need proven track record with similar scale', category: 'Strategic' },
    { id: 'c3', name: 'Security Posture', weight: 9, rationale: 'Handling sensitive data requires top-tier security', category: 'Risk' },
    { id: 'c4', name: 'Budget Alignment', weight: 7, rationale: 'Must fit within approved budget band', category: 'Commercial' },
    { id: 'c5', name: 'Timeline Fit', weight: 8, rationale: 'Project has firm deadline', category: 'Commercial' },
    { id: 'c6', name: 'Reference Quality', weight: 6, rationale: 'Want verifiable success stories', category: 'Risk' },
  ],
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

export const mockSelectionPack: SelectionPack = {
  id: 'sp-1',
  requestId: 'mock-req-3',
  status: 'Draft',
  sections: {
    executiveSummary: 'Based on comprehensive evaluation across 6 weighted criteria, we recommend Apex Digital Solutions as the primary partner for this data warehouse modernization initiative.',
    criteriaAnalysis: 'Technical expertise and security posture were weighted highest at 9/10 each. All three shortlisted providers scored above threshold on mandatory criteria.',
    shortlistComparison: 'Apex Digital (Score: 87/100) leads in enterprise experience and security. DataForge (Score: 82/100) offers competitive pricing. Nimbus (Score: 74/100) provides fastest timeline.',
    recommendation: 'Proceed with Apex Digital Solutions. Secondary recommendation: DataForge Analytics for potential parallel workstream on analytics layer.',
    riskAssessment: 'Primary risk is timeline compression. Mitigation: phased approach with monthly checkpoints. Secondary risk: integration complexity. Mitigation: dedicated integration lead from Apex.',
    nextSteps: '1. Schedule intro call with Apex. 2. Finalize SOW scope. 3. Legal review of MSA. 4. Kick-off planning.',
  },
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
};

export const mockGovernanceLog: GovernanceLog = {
  requestId: 'mock-req-4',
  entries: [
    {
      id: 'gov-1',
      week: 1,
      date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'On Track',
      summary: 'Kickoff completed successfully. Team onboarded, environments provisioned.',
      keyIssues: [],
      nextActions: ['Complete initial assessment', 'Schedule stakeholder interviews'],
      authorId: 'mock-user-1',
    },
    {
      id: 'gov-2',
      week: 2,
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'On Track',
      summary: 'Assessment phase 50% complete. No major blockers identified.',
      keyIssues: ['Minor delay in access provisioning'],
      nextActions: ['Complete vulnerability scan', 'Draft preliminary report'],
      authorId: 'mock-user-1',
    },
    {
      id: 'gov-3',
      week: 3,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'At Risk',
      summary: 'Discovered additional scope in legacy systems. Evaluating impact.',
      keyIssues: ['Legacy system complexity higher than estimated', 'Additional resources may be needed'],
      nextActions: ['Scope impact analysis', 'Discuss timeline adjustment options'],
      authorId: 'mock-user-1',
    },
  ],
};

export const mockPitchbooks: Record<string, ProviderPitchbook> = {
  'prov-1': {
    id: 'pitch-1',
    providerId: 'prov-1',
    summary: {
      overview: 'Apex Digital Solutions is a leading enterprise software implementation partner with 15+ years of experience delivering complex multi-system integrations. Our AI/ML practice has grown to 50+ specialists focused on production-grade deployments.',
      keyStrengths: ['Enterprise-scale delivery', 'Multi-cloud expertise', 'Strong project management', 'Post-launch support'],
      idealFor: ['Large enterprises', 'Complex integrations', 'Regulated industries', 'Multi-year programs'],
      verificationLevel: 'Sablecrest-assessed',
    },
    deliverySystem: {
      teamSize: '200+ engineers globally',
      keyPersonnel: [
        { name: 'Sarah Chen', role: 'AI Practice Lead', bio: '15 years in ML systems, former Google AI' },
        { name: 'Marcus Johnson', role: 'Delivery Director', bio: '20+ enterprise projects delivered' },
      ],
      deliveryApproach: 'Agile with 2-week sprints, dedicated PM and tech lead per project',
      communication: 'Daily standups, weekly stakeholder reviews, Slack/Teams integration',
      methodology: 'SAFe-aligned with customization for client context',
      verificationLevel: 'Documented',
    },
    proof: {
      caseStudies: [
        { title: 'Fortune 500 AI Transformation', client: 'Major Retailer', outcome: '40% efficiency gain in supply chain', verified: true },
        { title: 'Healthcare Data Platform', client: 'Regional Health System', outcome: 'HIPAA-compliant ML pipeline', verified: true },
      ],
      testimonials: [
        { quote: 'Apex delivered beyond our expectations on a complex integration.', author: 'CTO', company: 'Tech Corp' },
      ],
      projectCount: 12,
      verificationLevel: 'Reference-validated',
    },
    commercials: {
      pricingModel: 'Time & Materials with cap, or Fixed Price for defined scope',
      typicalEngagement: '$250K-$500K for enterprise projects',
      paymentTerms: 'Net 30, milestone-based for fixed price',
      flexibilities: ['Volume discounts', 'Long-term retainer options', 'Flexible resource scaling'],
      verificationLevel: 'Documented',
    },
    riskAndControls: {
      insurances: ['E&O $10M', 'Cyber $5M', 'General Liability $2M'],
      certifications: ['ISO 27001', 'SOC 2 Type II', 'CMMI Level 3'],
      dataHandling: 'Encrypted at rest and in transit, no data retention post-project',
      escalationProcess: 'Dedicated account executive with 4-hour SLA',
      verificationLevel: 'Sablecrest-assessed',
    },
    security: {
      securityLevel: 'Enterprise',
      compliance: ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA', 'FedRAMP (in progress)'],
      dataResidency: 'US, EU, APAC options available',
      auditHistory: 'Annual third-party audits, last audit: clean',
      verificationLevel: 'Documented',
    },
    references: {
      available: true,
      ndaRequired: false,
      recentReferences: [
        { company: 'Fortune 100 Retailer', contact: 'VP Engineering', project: 'ML Platform Build' },
        { company: 'Financial Services Firm', contact: 'CIO', project: 'Data Integration' },
      ],
      verificationLevel: 'Reference-validated',
    },
  },
  'prov-2': {
    id: 'pitch-2',
    providerId: 'prov-2',
    summary: {
      overview: 'Nimbus Tech Partners specializes in cutting-edge LLM implementations with rapid iteration cycles. Our team combines research expertise with production engineering.',
      keyStrengths: ['LLM expertise', 'Fast iteration', 'Research-to-production', 'Cost optimization'],
      idealFor: ['AI-first products', 'Rapid prototyping', 'LLM integration', 'Startups & scale-ups'],
      verificationLevel: 'Documented',
    },
    deliverySystem: {
      teamSize: '35 engineers',
      keyPersonnel: [
        { name: 'Dr. Elena Vasquez', role: 'CTO', bio: 'PhD in NLP, former OpenAI researcher' },
      ],
      deliveryApproach: 'Rapid prototyping with weekly demos',
      communication: 'Daily async updates, weekly sync calls',
      methodology: 'Lean startup principles applied to enterprise context',
      verificationLevel: 'Provider-stated',
    },
    proof: {
      caseStudies: [
        { title: 'Customer Service AI', client: 'E-commerce Platform', outcome: '60% ticket deflection', verified: false },
      ],
      testimonials: [],
      projectCount: 5,
      verificationLevel: 'Provider-stated',
    },
    commercials: {
      pricingModel: 'Time & Materials',
      typicalEngagement: '$75K-$150K',
      paymentTerms: 'Net 15, weekly invoicing',
      flexibilities: ['Flexible team sizing', 'Month-to-month options'],
      verificationLevel: 'Documented',
    },
    riskAndControls: {
      insurances: ['E&O $2M', 'Cyber $1M'],
      certifications: ['SOC 2 Type I'],
      dataHandling: 'Client cloud only, no data egress',
      escalationProcess: 'Direct founder access',
      verificationLevel: 'Provider-stated',
    },
    security: {
      securityLevel: 'Standard',
      compliance: ['SOC 2 Type I', 'GDPR'],
      dataResidency: 'Client-specified',
      auditHistory: 'Initial audit completed 2024',
      verificationLevel: 'Documented',
    },
    references: {
      available: true,
      ndaRequired: true,
      recentReferences: [
        { company: 'Series B Startup', contact: 'CTO', project: 'LLM Product Build' },
      ],
      verificationLevel: 'Provider-stated',
    },
  },
  'prov-3': {
    id: 'pitch-3',
    providerId: 'prov-3',
    summary: {
      overview: 'DataForge Analytics delivers best-in-class data infrastructure solutions with a focus on reliability and scale. 10+ years in enterprise data.',
      keyStrengths: ['Data infrastructure', 'Scale expertise', 'Cost efficiency', 'Reliability focus'],
      idealFor: ['Data modernization', 'High-volume processing', 'Analytics platforms', 'Data lakes'],
      verificationLevel: 'Sablecrest-assessed',
    },
    deliverySystem: {
      teamSize: '80 engineers',
      keyPersonnel: [
        { name: 'James Park', role: 'Principal Architect', bio: 'Former Snowflake, 15 years data eng' },
      ],
      deliveryApproach: 'Fixed-price phases with clear milestones',
      communication: 'Weekly status reports, bi-weekly steering',
      methodology: 'DataOps with automated testing and deployment',
      verificationLevel: 'Reference-validated',
    },
    proof: {
      caseStudies: [
        { title: 'Data Lake Migration', client: 'Fortune 500 Bank', outcome: '10x query performance', verified: true },
        { title: 'Real-time Analytics', client: 'Logistics Co', outcome: 'Sub-second dashboards', verified: true },
      ],
      testimonials: [
        { quote: 'DataForge transformed our data capabilities.', author: 'CDO', company: 'Major Bank' },
      ],
      projectCount: 18,
      verificationLevel: 'Reference-validated',
    },
    commercials: {
      pricingModel: 'Fixed price with change control',
      typicalEngagement: '$100K-$200K',
      paymentTerms: 'Milestone-based',
      flexibilities: ['Fixed price certainty', 'Performance guarantees'],
      verificationLevel: 'Documented',
    },
    riskAndControls: {
      insurances: ['E&O $5M', 'Cyber $3M'],
      certifications: ['SOC 2 Type II', 'ISO 27001'],
      dataHandling: 'Strict data governance, automated compliance',
      escalationProcess: 'Partner-level escalation path',
      verificationLevel: 'Sablecrest-assessed',
    },
    security: {
      securityLevel: 'Enterprise',
      compliance: ['SOC 2 Type II', 'ISO 27001', 'GDPR', 'CCPA'],
      dataResidency: 'Multi-region support',
      auditHistory: 'Continuous compliance monitoring',
      verificationLevel: 'Documented',
    },
    references: {
      available: true,
      ndaRequired: false,
      recentReferences: [
        { company: 'Fortune 500 Bank', contact: 'VP Data', project: 'Data Lake' },
        { company: 'Logistics Co', contact: 'CTO', project: 'Analytics Platform' },
      ],
      verificationLevel: 'Reference-validated',
    },
  },
};

export const mockCompareViews: CompareProviderView[] = mockProviders.slice(0, 3).map(p => ({
  id: p.id,
  name: p.name,
  budgetBand: p.budgetBand,
  timeline: p.typicalTimeline,
  leadTime: p.leadTime,
  engagementType: p.engagementType,
  deliveryModel: p.deliveryModel,
  scopeBoundaries: 'Defined deliverables with change control',
  keyRisks: [p.riskReason],
  proofSummary: `${p.proofCount} relevant projects in ${p.capabilities.slice(0, 2).join(', ')}`,
  securityPosture: p.id === 'prov-1' || p.id === 'prov-3' ? 'Enterprise-grade (SOC 2 Type II, ISO 27001)' : 'Standard (SOC 2 Type I)',
}));
