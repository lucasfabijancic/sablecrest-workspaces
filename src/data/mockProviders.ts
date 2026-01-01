import type { BudgetBand } from '@/types/database';

// Extended provider type for shortlist display
export interface ProviderCardSummary {
  id: string;
  name: string;
  logo?: string;
  region: string;
  category: string;
  fitSummary: string;
  capabilities: string[];
  budgetBand: BudgetBand;
  typicalTimeline: string;
  leadTime: string;
  riskRating: 'Low' | 'Medium' | 'High';
  riskReason: string;
  referenceAvailability: 'Yes' | 'After NDA' | 'Limited';
}

export interface ProviderPitchbook {
  id: string;
  providerId: string;
  summary: {
    overview: string;
    keyStrengths: string[];
    idealFor: string[];
  };
  teamAndDelivery: {
    teamSize: string;
    keyPersonnel: { name: string; role: string; bio: string }[];
    deliveryApproach: string;
    communication: string;
  };
  proof: {
    caseStudies: { title: string; client: string; outcome: string }[];
    testimonials: { quote: string; author: string; company: string }[];
  };
  commercials: {
    pricingModel: string;
    typicalEngagement: string;
    paymentTerms: string;
    flexibilities: string[];
  };
  riskAndControls: {
    insurances: string[];
    certifications: string[];
    dataHandling: string;
    escalationProcess: string;
  };
  security: {
    securityLevel: 'Basic' | 'Standard' | 'Enterprise';
    compliance: string[];
    dataResidency: string;
    auditHistory: string;
  };
  references: {
    available: boolean;
    ndaRequired: boolean;
    recentReferences: { company: string; contact: string; project: string }[];
  };
}

export interface CompareProviderView {
  id: string;
  name: string;
  budgetBand: BudgetBand;
  timeline: string;
  leadTime: string;
  engagementType: string;
  scopeBoundaries: string;
  keyRisks: string[];
  proofSummary: string;
}

export const mockProviders: ProviderCardSummary[] = [
  {
    id: 'prov-1',
    name: 'Apex Digital Solutions',
    logo: undefined,
    region: 'North America',
    category: 'Full-stack Implementation',
    fitSummary: 'Strong enterprise track record with AI/ML integrations. Excellent for complex multi-system deployments.',
    capabilities: ['AI/ML', 'Enterprise Integration', 'Cloud Migration', 'Security', 'Data Engineering'],
    budgetBand: '$150K-$500K',
    typicalTimeline: '3-6 months',
    leadTime: '2-3 weeks',
    riskRating: 'Low',
    riskReason: 'Established vendor with proven delivery history',
    referenceAvailability: 'Yes',
  },
  {
    id: 'prov-2',
    name: 'Nimbus Tech Partners',
    logo: undefined,
    region: 'Europe',
    category: 'AI Consulting',
    fitSummary: 'Specialized in LLM implementations and prompt engineering. Fast iteration cycles.',
    capabilities: ['LLM Integration', 'Prompt Engineering', 'RAG Systems', 'Fine-tuning'],
    budgetBand: '$50K-$150K',
    typicalTimeline: '4-8 weeks',
    leadTime: '1 week',
    riskRating: 'Medium',
    riskReason: 'Newer firm, but strong technical team',
    referenceAvailability: 'After NDA',
  },
  {
    id: 'prov-3',
    name: 'DataForge Analytics',
    logo: undefined,
    region: 'Global',
    category: 'Data Engineering',
    fitSummary: 'Best-in-class data infrastructure. Ideal for high-volume data processing needs.',
    capabilities: ['Data Pipelines', 'Analytics', 'BI Dashboards', 'ETL', 'Real-time Processing'],
    budgetBand: '$50K-$150K',
    typicalTimeline: '2-4 months',
    leadTime: '2 weeks',
    riskRating: 'Low',
    riskReason: 'Multiple successful similar projects',
    referenceAvailability: 'Yes',
  },
  {
    id: 'prov-4',
    name: 'Quantum Innovations',
    logo: undefined,
    region: 'Asia',
    category: 'R&D Partner',
    fitSummary: 'Cutting-edge research capabilities. Best for experimental or novel implementations.',
    capabilities: ['Research', 'Prototyping', 'Novel AI', 'Academic Partnerships'],
    budgetBand: '$10K-$50K',
    typicalTimeline: '1-3 months',
    leadTime: '1-2 weeks',
    riskRating: 'High',
    riskReason: 'Research-focused, may require iteration',
    referenceAvailability: 'Limited',
  },
  {
    id: 'prov-5',
    name: 'SecureOps Consulting',
    logo: undefined,
    region: 'North America',
    category: 'Security & Compliance',
    fitSummary: 'Security-first approach. Essential for regulated industries and sensitive data handling.',
    capabilities: ['Security Audit', 'Compliance', 'SOC2', 'HIPAA', 'Penetration Testing'],
    budgetBand: '$50K-$150K',
    typicalTimeline: '4-8 weeks',
    leadTime: '3 weeks',
    riskRating: 'Low',
    riskReason: 'Industry leader in security consulting',
    referenceAvailability: 'Yes',
  },
];

export const mockPitchbooks: Record<string, ProviderPitchbook> = {
  'prov-1': {
    id: 'pitch-1',
    providerId: 'prov-1',
    summary: {
      overview: 'Apex Digital Solutions is a leading enterprise software implementation partner with 15+ years of experience delivering complex multi-system integrations. Our AI/ML practice has grown to 50+ specialists focused on production-grade deployments.',
      keyStrengths: ['Enterprise-scale delivery', 'Multi-cloud expertise', 'Strong project management', 'Post-launch support'],
      idealFor: ['Large enterprises', 'Complex integrations', 'Regulated industries', 'Multi-year programs'],
    },
    teamAndDelivery: {
      teamSize: '200+ engineers globally',
      keyPersonnel: [
        { name: 'Sarah Chen', role: 'AI Practice Lead', bio: '15 years in ML systems, former Google AI' },
        { name: 'Marcus Johnson', role: 'Delivery Director', bio: '20+ enterprise projects delivered' },
      ],
      deliveryApproach: 'Agile with 2-week sprints, dedicated PM and tech lead per project',
      communication: 'Daily standups, weekly stakeholder reviews, Slack/Teams integration',
    },
    proof: {
      caseStudies: [
        { title: 'Fortune 500 AI Transformation', client: 'Major Retailer', outcome: '40% efficiency gain in supply chain' },
        { title: 'Healthcare Data Platform', client: 'Regional Health System', outcome: 'HIPAA-compliant ML pipeline' },
      ],
      testimonials: [
        { quote: 'Apex delivered beyond our expectations on a complex integration.', author: 'CTO', company: 'Tech Corp' },
      ],
    },
    commercials: {
      pricingModel: 'Time & Materials with cap, or Fixed Price for defined scope',
      typicalEngagement: '$250K-$500K for enterprise projects',
      paymentTerms: 'Net 30, milestone-based for fixed price',
      flexibilities: ['Volume discounts', 'Long-term retainer options', 'Flexible resource scaling'],
    },
    riskAndControls: {
      insurances: ['E&O $10M', 'Cyber $5M', 'General Liability $2M'],
      certifications: ['ISO 27001', 'SOC 2 Type II', 'CMMI Level 3'],
      dataHandling: 'Encrypted at rest and in transit, no data retention post-project',
      escalationProcess: 'Dedicated account executive with 4-hour SLA',
    },
    security: {
      securityLevel: 'Enterprise',
      compliance: ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA', 'FedRAMP (in progress)'],
      dataResidency: 'US, EU, APAC options available',
      auditHistory: 'Annual third-party audits, last audit: clean',
    },
    references: {
      available: true,
      ndaRequired: false,
      recentReferences: [
        { company: 'Fortune 100 Retailer', contact: 'VP Engineering', project: 'ML Platform Build' },
        { company: 'Financial Services Firm', contact: 'CIO', project: 'Data Integration' },
      ],
    },
  },
};

export const mockCompareViews: CompareProviderView[] = mockProviders.slice(0, 3).map(p => ({
  id: p.id,
  name: p.name,
  budgetBand: p.budgetBand,
  timeline: p.typicalTimeline,
  leadTime: p.leadTime,
  engagementType: 'Project-based',
  scopeBoundaries: 'Defined deliverables with change control',
  keyRisks: [p.riskReason],
  proofSummary: `${p.capabilities.slice(0, 2).join(', ')} expertise`,
}));
