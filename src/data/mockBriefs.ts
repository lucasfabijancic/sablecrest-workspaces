import type {
  BriefConstraints,
  BusinessContext,
  FieldSource,
  ImplementationBrief,
  RiskFactor,
  SuccessCriterion,
} from '@/types/brief';

const workspaceId = 'mock-workspace-001';
const ownerId = 'mock-user-001';

const buildBusinessContext = (context: BusinessContext): BusinessContext => context;
const buildSuccessCriteria = (criteria: SuccessCriterion[]): SuccessCriterion[] => criteria;
const buildConstraints = (constraints: BriefConstraints): BriefConstraints => constraints;
const buildRiskFactors = (riskFactors: RiskFactor[]): RiskFactor[] => riskFactors;

interface BuildFieldSourcesOptions {
  source?: FieldSource['source'];
  confirmedByClient?: boolean;
  confirmedAt?: string;
  markedForClientInput?: string[];
  notesByPath?: Record<string, string>;
}

const buildFieldSources = (
  paths: string[],
  options: BuildFieldSourcesOptions = {},
): Record<string, FieldSource> => {
  const {
    source = 'advisor',
    confirmedByClient = false,
    confirmedAt,
    markedForClientInput = [],
    notesByPath = {},
  } = options;

  return paths.reduce<Record<string, FieldSource>>((accumulator, path) => {
    const fieldSource: FieldSource = {
      source,
      confirmedByClient,
      markedForClientInput: markedForClientInput.includes(path),
    };

    if (confirmedAt) {
      fieldSource.confirmedAt = confirmedAt;
    }

    if (notesByPath[path]) {
      fieldSource.clientNotes = notesByPath[path];
    }

    accumulator[path] = fieldSource;
    return accumulator;
  }, {});
};

const brief1FieldPaths = [
  'businessContext.companyName',
  'businessContext.companySize',
  'businessContext.industry',
  'businessContext.currentState',
  'businessContext.desiredOutcome',
  'businessContext.keyStakeholders',
  'businessContext.decisionTimeline',
  'constraints.budget',
  'constraints.timeline',
  'constraints.sensitivity',
  'constraints.technical',
  'requirements.0',
  'requirements.1',
  'requirements.2',
  'successCriteria.0',
  'successCriteria.1',
  'successCriteria.2',
  'intakeResponses.current-erp',
  'intakeResponses.user-count',
  'intakeResponses.modules-needed',
  'intakeResponses.integrations',
  'intakeResponses.multi-entity',
];

const brief2FieldPaths = [
  'businessContext.companyName',
  'businessContext.companySize',
  'businessContext.industry',
  'businessContext.currentState',
  'businessContext.desiredOutcome',
  'businessContext.keyStakeholders',
  'businessContext.decisionTimeline',
  'constraints.budget',
  'constraints.timeline',
  'constraints.sensitivity',
  'constraints.technical',
  'requirements.0',
  'requirements.1',
  'successCriteria.0',
  'successCriteria.1',
  'intakeResponses.project-volume',
  'intakeResponses.field-users',
  'intakeResponses.workflow-priorities',
  'intakeResponses.document-control',
  'intakeResponses.owner-visibility',
];

const brief3FieldPaths = [
  'businessContext.companyName',
  'businessContext.companySize',
  'businessContext.industry',
  'businessContext.currentState',
  'businessContext.desiredOutcome',
  'businessContext.keyStakeholders',
  'businessContext.decisionTimeline',
  'constraints.budget',
  'constraints.timeline',
  'constraints.sensitivity',
  'constraints.technical',
  'requirements.0',
  'requirements.1',
  'successCriteria.0',
  'successCriteria.1',
  'successCriteria.2',
  'intakeResponses.bim-maturity',
  'intakeResponses.design-tools',
  'intakeResponses.collaboration-needs',
  'intakeResponses.model-ownership',
  'intakeResponses.cde-platform',
];

const brief4FieldPaths = [
  'businessContext.companyName',
  'businessContext.companySize',
  'businessContext.industry',
  'businessContext.currentState',
  'businessContext.desiredOutcome',
  'businessContext.keyStakeholders',
  'businessContext.decisionTimeline',
  'constraints.budget',
  'constraints.timeline',
  'constraints.sensitivity',
  'constraints.technical',
  'requirements.0',
  'requirements.1',
  'successCriteria.0',
  'successCriteria.1',
  'intakeResponses.systems-to-connect',
  'intakeResponses.sync-frequency',
  'intakeResponses.data-domains',
  'intakeResponses.mapping-complexity',
  'intakeResponses.integration-platform',
];

const brief5FieldPaths = [
  'businessContext.companyName',
  'businessContext.companySize',
  'businessContext.industry',
  'businessContext.currentState',
  'businessContext.desiredOutcome',
  'businessContext.keyStakeholders',
  'businessContext.decisionTimeline',
  'constraints.budget',
  'constraints.timeline',
  'constraints.sensitivity',
  'constraints.technical',
  'requirements.0',
  'requirements.1',
  'successCriteria.0',
  'successCriteria.1',
  'intakeResponses.primary-use-case',
  'intakeResponses.data-readiness',
  'intakeResponses.data-sources',
  'intakeResponses.integration-points',
  'intakeResponses.risk-tolerance',
];

const brief6FieldPaths = [
  'businessContext.companyName',
  'businessContext.companySize',
  'businessContext.industry',
  'businessContext.currentState',
  'businessContext.desiredOutcome',
  'businessContext.keyStakeholders',
  'businessContext.decisionTimeline',
  'constraints.budget',
  'constraints.timeline',
  'constraints.sensitivity',
  'constraints.technical',
  'requirements.0',
  'requirements.1',
  'requirements.2',
  'successCriteria.0',
  'successCriteria.1',
  'successCriteria.2',
  'intakeResponses.estimate-volume',
  'intakeResponses.trade-type',
  'intakeResponses.current-tools',
  'intakeResponses.cost-database',
  'intakeResponses.integration-needs',
];

const brief3BaseFieldSources = buildFieldSources(brief3FieldPaths, {
  source: 'advisor',
  confirmedByClient: true,
  confirmedAt: '2026-02-03T16:30:00Z',
  notesByPath: {
    'businessContext.currentState':
      'We also have a Revit template library that needs migration.',
    'successCriteria.0': 'We want to track template adoption rate too.',
  },
});

export const mockBriefs: ImplementationBrief[] = [
  {
    id: 'brief-001',
    workspaceId,
    title: 'Sage 300 CRE Implementation',
    projectTypeId: 'erp-implementation',
    status: 'Advisor Draft',
    currentVersion: 1,
    businessContext: buildBusinessContext({
      companyName: 'Summit Ridge Constructors',
      companySize: '180 employees',
      industry: 'General Contractor',
      currentState:
        'The finance team is split between QuickBooks and spreadsheet-based job costing. Payroll is reconciled manually every pay period and PMs track cost-to-complete outside the accounting system.',
      desiredOutcome:
        'Deploy Sage 300 CRE to centralize job costing, payroll, AP, and project financial reporting while removing duplicate entry between accounting and operations.',
      keyStakeholders:
        'CFO (executive sponsor), Controller, Payroll Manager, IT Manager, 6 Project Managers, 2 Field Operations Leads',
      decisionTimeline: 'Within 1 month',
    }),
    requirements: [
      {
        id: 'brf-001-req-1',
        category: 'Functional',
        priority: 'Must Have',
        description: 'Configure multi-company job cost structure with consolidated financial reporting.',
        acceptanceCriteria: 'Executives can run consolidated WIP and margin reports by entity and project.',
        source: 'User',
      },
      {
        id: 'brf-001-req-2',
        category: 'Integration',
        priority: 'Must Have',
        description: 'Integrate Procore commitments and change orders into ERP job cost and AP workflows.',
        acceptanceCriteria: 'Approved Procore commitments and change orders sync to Sage within 15 minutes.',
        source: 'User',
      },
      {
        id: 'brf-001-req-3',
        category: 'Training',
        priority: 'Should Have',
        description: 'Role-based onboarding for accounting staff, payroll, and project managers.',
        acceptanceCriteria: 'At least 90% of targeted users complete training before go-live.',
        source: 'Template',
      },
    ],
    successCriteria: buildSuccessCriteria([
      {
        id: 'brf-001-sc-1',
        metric: 'Month-end close duration',
        baseline: '12 business days',
        target: '5 business days or less',
        measurementMethod: 'System Report',
        timeframe: '90 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: false,
        weight: 8,
      },
      {
        id: 'brf-001-sc-2',
        metric: 'Purchase order processing cycle time',
        baseline: '4.5 days average',
        target: '2 days average',
        measurementMethod: 'System Report',
        timeframe: 'Full Deployment',
        source: 'advisor',
        confirmedByClient: false,
        weight: 6,
      },
      {
        id: 'brf-001-sc-3',
        metric: 'Duplicate project cost entry incidents per month',
        baseline: '30+ duplicate entries',
        target: '0 duplicate entries',
        measurementMethod: 'Manual Audit',
        timeframe: '30 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: false,
        weight: 7,
      },
    ]),
    constraints: buildConstraints({
      budget: {
        min: 200000,
        max: 350000,
        flexibility: 'Firm',
      },
      timeline: {
        urgency: 'Within 1 month',
        hardDeadline: '2026-07-01',
        reason: 'Need payroll and job cost stability before FY planning cycle.',
      },
      sensitivity: {
        level: 'Standard',
        concerns: ['Payroll accuracy during cutover'],
      },
      technical: {
        mustIntegrate: ['Procore', 'ADP'],
        cannotChange: ['Procore field workflow configuration during Phase 1'],
        preferences: ['Cloud-hosted deployment', 'Single sign-on via Microsoft Entra ID'],
      },
    }),
    riskFactors: buildRiskFactors([
      {
        id: 'brf-001-risk-1',
        category: 'Technical',
        description: 'Legacy QuickBooks chart of accounts is inconsistent across entities.',
        likelihood: 'High',
        impact: 'High',
        mitigation: 'Complete data normalization and mapping workshop before migration.',
        source: 'Sablecrest Identified',
      },
      {
        id: 'brf-001-risk-2',
        category: 'Organizational',
        description: 'Payroll team has limited availability during seasonal hiring months.',
        likelihood: 'Medium',
        impact: 'Medium',
        mitigation: 'Schedule payroll configuration sprints outside peak hiring weeks.',
        source: 'Sablecrest Identified',
      },
    ]),
    intakeResponses: {
      'current-erp': 'QuickBooks Enterprise with custom Excel job cost trackers',
      'user-count': 210,
      'modules-needed': [
        'Financials / GL',
        'Project accounting',
        'Payroll',
        'Procurement',
        'Reporting / BI',
      ],
      integrations: ['Project management (Procore, etc.)', 'HR / benefits', 'Timekeeping / field capture'],
      'multi-entity': 'Yes',
    },
    advisorId: 'mock-advisor-001',
    advisorNotes:
      "Discovery call went well. CFO is the decision maker. They had a failed Viewpoint attempt in 2022. High urgency - fiscal year deadline.",
    discoveryDate: '2026-01-15T15:00:00Z',
    discoveryNotes:
      'Met with CFO and Controller on Jan 15. Currently on QuickBooks + spreadsheets. Payroll reconciliation is 2 days per cycle. 6 PMs need field access.',
    clientReviewStartedAt: undefined,
    clientReviewCompletedAt: undefined,
    fieldSources: buildFieldSources(brief1FieldPaths, {
      source: 'advisor',
      confirmedByClient: false,
      markedForClientInput: [
        'businessContext.currentState',
        'businessContext.desiredOutcome',
        'constraints.budget',
      ],
    }),
    clientNotes: {},
    lockedAt: undefined,
    lockedBy: undefined,
    ownerId,
    createdAt: '2026-01-12T15:10:00.000Z',
    updatedAt: '2026-02-05T14:22:00.000Z',
  },
  {
    id: 'brief-002',
    workspaceId,
    title: 'Procore Rollout Phase 2',
    projectTypeId: 'pm-software',
    status: 'Client Review',
    currentVersion: 2,
    businessContext: buildBusinessContext({
      companyName: 'Oakline Homes',
      companySize: '85 employees',
      industry: 'Residential Builder',
      currentState:
        'Procore is used inconsistently for RFIs, while daily logs and submittals are still handled through email and spreadsheets by site teams.',
      desiredOutcome:
        'Expand Procore adoption across daily logs and submittals with consistent field usage and clear owner visibility reporting.',
      keyStakeholders:
        'VP Construction (sponsor), Director of Operations, IT Lead, 12 Superintendents, 4 Project Coordinators',
      decisionTimeline: 'Within 2 weeks',
    }),
    requirements: [
      {
        id: 'brf-002-req-1',
        category: 'Functional',
        priority: 'Must Have',
        description: 'Standardize daily log templates and required fields for all active communities.',
        acceptanceCriteria: '100% of active projects submit daily logs through Procore by week 8.',
        source: 'User',
      },
      {
        id: 'brf-002-req-2',
        category: 'Support',
        priority: 'Should Have',
        description: 'Provide post-launch office hours for superintendents and coordinators.',
        acceptanceCriteria: 'Support response SLA under 1 business day for first 60 days.',
        source: 'Template',
      },
    ],
    successCriteria: buildSuccessCriteria([
      {
        id: 'brf-002-sc-1',
        metric: 'Field user adoption for daily logs and submittals',
        baseline: '35% active weekly usage',
        target: '90% active weekly usage',
        measurementMethod: 'Adoption Analytics',
        timeframe: '90 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: false,
        weight: 9,
      },
      {
        id: 'brf-002-sc-2',
        metric: 'Average RFI response turnaround',
        baseline: '6.2 days',
        target: '3 days',
        measurementMethod: 'System Report',
        timeframe: '30 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: false,
        weight: 7,
      },
    ]),
    constraints: buildConstraints({
      budget: {
        min: 50000,
        max: 100000,
        flexibility: 'Flexible',
      },
      timeline: {
        urgency: 'Within 2 weeks',
        hardDeadline: '2026-04-30',
        reason: 'Need stabilized workflows before spring build cycle peak.',
      },
      sensitivity: {
        level: 'Standard',
        concerns: [],
      },
      technical: {
        mustIntegrate: ['Procore'],
        cannotChange: ['Current owner portal reporting format'],
        preferences: ['Mobile-first training materials'],
      },
    }),
    riskFactors: buildRiskFactors([
      {
        id: 'brf-002-risk-1',
        category: 'Organizational',
        description: 'Superintendent adoption may lag without field-specific training cadence.',
        likelihood: 'Medium',
        impact: 'High',
        mitigation: 'Run phased enablement by region with on-site champions.',
        source: 'Sablecrest Identified',
      },
      {
        id: 'brf-002-risk-2',
        category: 'Timeline',
        description: 'Parallel projects may reduce availability for phase 2 training.',
        likelihood: 'Medium',
        impact: 'Medium',
        mitigation: 'Stagger training with site-level super user coverage.',
        source: 'User',
      },
    ]),
    intakeResponses: {
      'project-volume': 65,
      'field-users': 42,
      'workflow-priorities': ['Daily logs', 'Submittals', 'RFIs'],
      'document-control': 'Procore Drawings with some legacy files in SharePoint',
      'owner-visibility': 'Sometimes',
    },
    advisorId: 'mock-advisor-001',
    advisorNotes:
      'Client is well-organized. IT team is capable. Main risk is change management with field crews.',
    discoveryDate: '2026-01-28T16:00:00Z',
    discoveryNotes:
      'Phase 1 went live 6 months ago. Field adoption at 60%. Phase 2 covers RFIs, submittals, and schedule integration.',
    clientReviewStartedAt: '2026-02-05T14:00:00Z',
    clientReviewCompletedAt: undefined,
    fieldSources: buildFieldSources(brief2FieldPaths, {
      source: 'advisor',
      confirmedByClient: false,
      markedForClientInput: [
        'businessContext.keyStakeholders',
        'intakeResponses.workflow-priorities',
        'intakeResponses.owner-visibility',
      ],
    }),
    clientNotes: {},
    lockedAt: undefined,
    lockedBy: undefined,
    ownerId,
    createdAt: '2026-01-20T10:45:00.000Z',
    updatedAt: '2026-02-05T14:01:00.000Z',
  },
  {
    id: 'brief-003',
    workspaceId,
    title: 'BIM Standards & Workflow Design',
    projectTypeId: 'bim-vdc',
    status: 'In Review',
    currentVersion: 3,
    businessContext: buildBusinessContext({
      companyName: 'Arcfield Studio',
      companySize: '40 employees',
      industry: 'Architecture Firm',
      currentState:
        'Teams use Revit across projects but there is no firm-wide BIM execution plan, naming standards, or consistent clash coordination workflow.',
      desiredOutcome:
        'Define and operationalize BIM standards, clash detection governance, and model coordination workflows across all project teams.',
      keyStakeholders:
        'Managing Principal, BIM Manager, QA Director, 5 Project Architects, 8 BIM Modelers',
      decisionTimeline: 'Within 1 month',
    }),
    requirements: [
      {
        id: 'brf-003-req-1',
        category: 'Technical',
        priority: 'Must Have',
        description: 'Create firm-wide BIM execution plan templates for DD, CD, and CA phases.',
        acceptanceCriteria: 'Templates approved by QA Director and used in next 3 active projects.',
        source: 'User',
      },
      {
        id: 'brf-003-req-2',
        category: 'Support',
        priority: 'Should Have',
        description: 'Set up recurring clash review cadence with documented ownership.',
        acceptanceCriteria: 'Weekly clash meetings and issue logs active for all pilot projects.',
        source: 'AI Suggested',
      },
    ],
    successCriteria: buildSuccessCriteria([
      {
        id: 'brf-003-sc-1',
        metric: 'Projects launched with approved BIM execution plan',
        baseline: '0 of 12 active projects',
        target: '100% of new projects',
        measurementMethod: 'Manual Audit',
        timeframe: 'Phase 1 Go-Live',
        source: 'client',
        confirmedByClient: true,
        weight: 8,
      },
      {
        id: 'brf-003-sc-2',
        metric: 'Average clash resolution time',
        baseline: '10 business days',
        target: '5 business days',
        measurementMethod: 'System Report',
        timeframe: '90 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: true,
        weight: 7,
      },
      {
        id: 'brf-003-sc-3',
        metric: 'Model rework hours per project',
        baseline: '120 hours',
        target: '70 hours',
        measurementMethod: 'Time Study',
        timeframe: '6 Months Post-Deployment',
        source: 'advisor',
        confirmedByClient: true,
        weight: 6,
      },
    ]),
    constraints: buildConstraints({
      budget: {
        min: 75000,
        max: 150000,
        flexibility: 'Flexible',
      },
      timeline: {
        urgency: 'Within 1 month',
        hardDeadline: '2026-05-15',
        reason: 'Need standards finalized before two healthcare projects enter coordination.',
      },
      sensitivity: {
        level: 'Confidential',
        concerns: ['Client IP protection in shared model environments', 'Controlled access to federated models'],
      },
      technical: {
        mustIntegrate: ['Revit', 'Navisworks'],
        cannotChange: ['Existing Revit family library ownership'],
        preferences: ['Template-first rollout before automation tooling'],
      },
    }),
    riskFactors: buildRiskFactors([
      {
        id: 'brf-003-risk-1',
        category: 'Commercial',
        description: 'Client contract terms restrict model sharing and may slow coordination setup.',
        likelihood: 'Medium',
        impact: 'High',
        mitigation: 'Validate data-sharing clauses before defining CDE access standards.',
        source: 'User',
      },
      {
        id: 'brf-003-risk-2',
        category: 'Timeline',
        description: 'Competing deadlines could delay BIM manager availability.',
        likelihood: 'Medium',
        impact: 'Medium',
        mitigation: 'Assign deputy BIM lead for standards documentation and approvals.',
        source: 'Sablecrest Identified',
      },
    ]),
    intakeResponses: {
      'bim-maturity': 'Project-based',
      'design-tools': ['Revit', 'Navisworks', 'AutoCAD'],
      'collaboration-needs': ['Clash detection', 'Design coordination', 'Owner deliverables'],
      'model-ownership': 'Shared / TBD',
      'cde-platform': 'Evaluating',
    },
    advisorId: 'mock-advisor-002',
    advisorNotes:
      "Client added 2 new requirements I didn't anticipate. Need to assess if this changes matching.",
    discoveryDate: '2026-01-22T11:00:00Z',
    discoveryNotes:
      'Initial discovery focused on standards governance. Client requested stronger owner handoff artifacts during review.',
    clientReviewStartedAt: '2026-02-01T10:00:00Z',
    clientReviewCompletedAt: '2026-02-03T16:30:00Z',
    fieldSources: {
      ...brief3BaseFieldSources,
      'businessContext.currentState': {
        ...brief3BaseFieldSources['businessContext.currentState'],
        source: 'client',
      },
      'successCriteria.0': {
        ...brief3BaseFieldSources['successCriteria.0'],
        source: 'client',
      },
    },
    clientNotes: {
      'businessContext.currentState':
        'We also have a Revit template library that needs migration.',
      'successCriteria.0': 'We want to track template adoption rate too.',
    },
    lockedAt: undefined,
    lockedBy: undefined,
    ownerId,
    createdAt: '2026-01-10T09:20:00.000Z',
    updatedAt: '2026-02-03T16:30:00.000Z',
  },
  {
    id: 'brief-004',
    workspaceId,
    title: 'ERP-Procore Integration',
    projectTypeId: 'system-integration',
    status: 'Locked',
    currentVersion: 4,
    businessContext: buildBusinessContext({
      companyName: 'Ironcrest Civil',
      companySize: '300 employees',
      industry: 'Civil/Heavy',
      currentState:
        'Viewpoint Vista and Procore operate in silos. PMs and accounting teams manually re-enter commitments, change orders, and cost updates in both systems.',
      desiredOutcome:
        'Implement a stable bidirectional integration so project and finance teams operate from synchronized cost and contract data.',
      keyStakeholders:
        'COO, Controller, PMO Director, Integration Architect, 14 Project Managers, AP Supervisor',
      decisionTimeline: 'Immediate',
    }),
    requirements: [
      {
        id: 'brf-004-req-1',
        category: 'Integration',
        priority: 'Must Have',
        description: 'Sync commitments, change orders, and vendor invoices between Vista and Procore.',
        acceptanceCriteria: '95% of eligible records sync without manual intervention.',
        source: 'User',
      },
      {
        id: 'brf-004-req-2',
        category: 'Technical',
        priority: 'Must Have',
        description: 'Provide integration monitoring with alerting for failed jobs and retries.',
        acceptanceCriteria: 'Operations receives alerts within 10 minutes for failed sync events.',
        source: 'AI Suggested',
      },
    ],
    successCriteria: buildSuccessCriteria([
      {
        id: 'brf-004-sc-1',
        metric: 'Duplicate data entry effort per week',
        baseline: '24 staff hours',
        target: 'Under 4 staff hours',
        measurementMethod: 'Time Study',
        timeframe: '90 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: true,
        weight: 8,
      },
      {
        id: 'brf-004-sc-2',
        metric: 'Sync accuracy for commitments and change orders',
        baseline: '72% accurate transfer',
        target: '98% accurate transfer',
        measurementMethod: 'System Report',
        timeframe: '30 Days Post-Deployment',
        source: 'client',
        confirmedByClient: true,
        weight: 9,
      },
    ]),
    constraints: buildConstraints({
      budget: {
        min: 40000,
        max: 80000,
        flexibility: 'Flexible',
      },
      timeline: {
        urgency: 'Immediate',
        hardDeadline: '2026-03-31',
        reason: 'Manual re-entry issues are impacting monthly billing and cash flow.',
      },
      sensitivity: {
        level: 'Standard',
        concerns: ['AP approval integrity during cutover'],
      },
      technical: {
        mustIntegrate: ['Viewpoint Vista', 'Procore'],
        cannotChange: ['Existing Vista chart of accounts structure'],
        preferences: ['Near real-time sync for cost commitments'],
      },
    }),
    riskFactors: buildRiskFactors([
      {
        id: 'brf-004-risk-1',
        category: 'Technical',
        description: 'API rate limits could delay large nightly sync batches.',
        likelihood: 'Medium',
        impact: 'High',
        mitigation: 'Implement queueing, throttling, and delta-based sync strategy.',
        source: 'Sablecrest Identified',
      },
      {
        id: 'brf-004-risk-2',
        category: 'Timeline',
        description: 'Cutover window is narrow due to end-of-quarter reporting needs.',
        likelihood: 'High',
        impact: 'High',
        mitigation: 'Run dry-run migration and fallback plan one week before cutover.',
        source: 'User',
      },
    ]),
    intakeResponses: {
      'systems-to-connect': ['ERP / job cost', 'Project management', 'Document management'],
      'sync-frequency': 'Real-time',
      'data-domains': ['Commitments / subcontracts', 'Change orders', 'Invoices / AP', 'RFIs and submittals'],
      'mapping-complexity': 'Complex',
      'integration-platform': 'Yes',
    },
    advisorId: 'mock-advisor-001',
    advisorNotes:
      'Integration scope is stable. Recommend a provider with heavy Vista connector experience and cutover governance playbooks.',
    discoveryDate: '2026-01-26T13:00:00Z',
    discoveryNotes:
      'Finance and PMO are aligned. Their main issue is billing delay from reconciliation gaps between systems.',
    clientReviewStartedAt: '2026-02-02T09:15:00Z',
    clientReviewCompletedAt: '2026-02-05T18:10:00Z',
    fieldSources: buildFieldSources(brief4FieldPaths, {
      source: 'advisor',
      confirmedByClient: true,
      confirmedAt: '2026-02-05T18:10:00Z',
    }),
    clientNotes: {
      'constraints.timeline': 'Quarter-close date is not movable.',
    },
    lockedAt: '2026-02-06T09:00:00Z',
    lockedBy: 'mock-advisor-001',
    ownerId,
    createdAt: '2026-01-18T11:05:00.000Z',
    updatedAt: '2026-02-06T09:00:00.000Z',
  },
  {
    id: 'brief-005',
    workspaceId,
    title: 'AI Takeoff Pilot',
    projectTypeId: 'ai-automation',
    status: 'Shortlisted',
    currentVersion: 5,
    businessContext: buildBusinessContext({
      companyName: 'Beacon Electric Group',
      companySize: '50 employees',
      industry: 'Specialty Contractor',
      currentState:
        'Estimators perform manual quantity takeoffs in Bluebeam and spreadsheets, creating bottlenecks when multiple bid packages land at the same time.',
      desiredOutcome:
        'Run a controlled pilot of AI-assisted takeoff across three projects to reduce estimating cycle time without compromising accuracy.',
      keyStakeholders:
        'President, Chief Estimator, Preconstruction Manager, IT Coordinator, 4 Estimators',
      decisionTimeline: 'Within 2 weeks',
    }),
    requirements: [
      {
        id: 'brf-005-req-1',
        category: 'Functional',
        priority: 'Must Have',
        description: 'Pilot AI extraction for conduit, fixture, and panel schedule quantities on 3 representative jobs.',
        acceptanceCriteria: 'Pilot outputs validated against manual takeoff with <= 5% variance.',
        source: 'User',
      },
      {
        id: 'brf-005-req-2',
        category: 'Support',
        priority: 'Should Have',
        description: 'Set up estimator feedback loop and model retraining checkpoints.',
        acceptanceCriteria: 'Feedback captured weekly and reflected in model tuning recommendations.',
        source: 'AI Suggested',
      },
    ],
    successCriteria: buildSuccessCriteria([
      {
        id: 'brf-005-sc-1',
        metric: 'Average takeoff turnaround time per bid package',
        baseline: '16 hours',
        target: '8 hours',
        measurementMethod: 'Time Study',
        timeframe: '90 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: true,
        weight: 8,
      },
      {
        id: 'brf-005-sc-2',
        metric: 'Takeoff accuracy variance vs. final awarded quantities',
        baseline: '12% variance',
        target: '5% variance or less',
        measurementMethod: 'Financial Reconciliation',
        timeframe: '6 Months Post-Deployment',
        source: 'client',
        confirmedByClient: true,
        weight: 7,
      },
    ]),
    constraints: buildConstraints({
      budget: {
        min: 30000,
        max: 60000,
        flexibility: 'Flexible',
      },
      timeline: {
        urgency: 'Within 1 month',
        hardDeadline: '2026-03-20',
        reason: 'Pilot needed before annual estimating process review.',
      },
      sensitivity: {
        level: 'Standard',
        concerns: ['Bid package confidentiality'],
      },
      technical: {
        mustIntegrate: ['Bluebeam'],
        cannotChange: ['Existing bid submission QA checklist'],
        preferences: ['Human-in-the-loop approval before final export'],
      },
    }),
    riskFactors: buildRiskFactors([
      {
        id: 'brf-005-risk-1',
        category: 'Technical',
        description: 'Drawing quality varies across GCs and may reduce extraction accuracy.',
        likelihood: 'Medium',
        impact: 'Medium',
        mitigation: 'Segment pilot by drawing quality profile and tune model thresholds.',
        source: 'Sablecrest Identified',
      },
      {
        id: 'brf-005-risk-2',
        category: 'Commercial',
        description: 'Estimators may distrust AI outputs without transparent validation reports.',
        likelihood: 'Medium',
        impact: 'Medium',
        mitigation: 'Publish side-by-side comparison reports for each pilot project.',
        source: 'User',
      },
    ]),
    intakeResponses: {
      'primary-use-case':
        'AI-assisted electrical takeoff for conduit runs, fixtures, and panel schedules on 3 pilot projects.',
      'data-readiness': 'Good',
      'data-sources': ['Document management', 'Project management'],
      'integration-points': ['BI dashboards', 'Email'],
      'risk-tolerance': 'High-risk only',
    },
    advisorId: 'mock-advisor-002',
    advisorNotes:
      'Shortlist includes two specialist AI takeoff firms and one ERP-adjacent analytics provider for fallback options.',
    discoveryDate: '2026-01-14T10:30:00Z',
    discoveryNotes:
      'Client wants measurable cycle-time gains without risking bid quality; pilot governance and QA controls are mandatory.',
    clientReviewStartedAt: '2026-01-29T09:00:00Z',
    clientReviewCompletedAt: '2026-01-31T15:20:00Z',
    fieldSources: buildFieldSources(brief5FieldPaths, {
      source: 'advisor',
      confirmedByClient: true,
      confirmedAt: '2026-01-31T15:20:00Z',
    }),
    clientNotes: {
      'constraints.technical': 'Keep estimator sign-off mandatory for every pilot package.',
    },
    lockedAt: '2026-02-01T08:45:00Z',
    lockedBy: 'mock-advisor-002',
    ownerId,
    createdAt: '2026-01-08T08:30:00.000Z',
    updatedAt: '2026-02-07T12:10:00.000Z',
  },
  {
    id: 'brief-006',
    workspaceId,
    title: 'Estimating System Upgrade',
    projectTypeId: 'estimating-takeoff',
    status: 'Completed',
    currentVersion: 6,
    businessContext: buildBusinessContext({
      companyName: 'Northpoint Mechanical',
      companySize: '140 employees',
      industry: 'Mechanical Contractor',
      currentState:
        'Estimators rely on disconnected spreadsheets and legacy desktop databases, creating handoff friction to project controls after award.',
      desiredOutcome:
        'Deploy a modern estimating and digital takeoff stack with reusable assemblies, bid comparison workflows, and ERP integration.',
      keyStakeholders:
        'CEO, VP Preconstruction, Estimating Manager, Controller, 7 Estimators, 3 Project Controls Analysts',
      decisionTimeline: 'Within 3 months',
    }),
    requirements: [
      {
        id: 'brf-006-req-1',
        category: 'Functional',
        priority: 'Must Have',
        description: 'Create standardized assemblies and cost libraries for HVAC and piping scopes.',
        acceptanceCriteria: 'All new bids use standardized assemblies with version history enabled.',
        source: 'User',
      },
      {
        id: 'brf-006-req-2',
        category: 'Integration',
        priority: 'Must Have',
        description: 'Sync awarded estimate structures into ERP job setup workflows.',
        acceptanceCriteria: 'Awarded bids generate ERP job setup package in under 30 minutes.',
        source: 'User',
      },
      {
        id: 'brf-006-req-3',
        category: 'Training',
        priority: 'Should Have',
        description: 'Run role-based training for estimators, project controls, and finance teams.',
        acceptanceCriteria: 'At least 95% completion before cutover with post-training competency checks.',
        source: 'Template',
      },
    ],
    successCriteria: buildSuccessCriteria([
      {
        id: 'brf-006-sc-1',
        metric: 'Average bid turnaround time',
        baseline: '11 business days',
        target: '6 business days',
        measurementMethod: 'System Report',
        timeframe: '90 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: true,
        weight: 9,
      },
      {
        id: 'brf-006-sc-2',
        metric: 'Awarded job setup handoff time',
        baseline: '3 business days',
        target: 'Same business day',
        measurementMethod: 'Time Study',
        timeframe: '30 Days Post-Deployment',
        source: 'client',
        confirmedByClient: true,
        weight: 8,
      },
      {
        id: 'brf-006-sc-3',
        metric: 'Estimate variance vs. final project cost',
        baseline: '15% variance',
        target: '8% variance',
        measurementMethod: 'Financial Reconciliation',
        timeframe: '6 Months Post-Deployment',
        source: 'advisor',
        confirmedByClient: true,
        weight: 7,
      },
    ]),
    constraints: buildConstraints({
      budget: {
        min: 120000,
        max: 240000,
        flexibility: 'Firm',
      },
      timeline: {
        urgency: 'Within 3 months',
        hardDeadline: '2026-01-31',
        reason: 'Executive team required rollout before FY planning lock.',
      },
      sensitivity: {
        level: 'Confidential',
        concerns: ['Unit pricing and bid strategy confidentiality'],
      },
      technical: {
        mustIntegrate: ['Trimble', 'Sage 300 CRE'],
        cannotChange: ['Existing approval thresholds for final bid signoff'],
        preferences: ['Cloud deployment with SSO'],
      },
    }),
    riskFactors: buildRiskFactors([
      {
        id: 'brf-006-risk-1',
        category: 'Organizational',
        description: 'Senior estimators may resist standardized assemblies early in rollout.',
        likelihood: 'Medium',
        impact: 'Medium',
        mitigation: 'Use pilot champions and weekly calibration sessions for first 8 weeks.',
        source: 'Sablecrest Identified',
      },
      {
        id: 'brf-006-risk-2',
        category: 'Technical',
        description: 'Legacy estimate data has inconsistent coding and units.',
        likelihood: 'High',
        impact: 'High',
        mitigation: 'Run data normalization pass before full migration and validate with QA samples.',
        source: 'Sablecrest Identified',
      },
    ]),
    intakeResponses: {
      'estimate-volume': 42,
      'trade-type': 'Mechanical',
      'current-tools': ['Excel', 'Trimble Estimation', 'Bluebeam'],
      'cost-database': 'Partially maintained, inconsistent coding across teams',
      'integration-needs': ['ERP / job cost', 'Document management', 'BI dashboards'],
    },
    advisorId: 'mock-advisor-001',
    advisorNotes:
      'Engagement completed successfully. Provider exceeded adoption targets and delivered integration with minimal post-go-live defects.',
    discoveryDate: '2025-08-12T14:00:00Z',
    discoveryNotes:
      'Initial call surfaced estimating bottlenecks and downstream handoff delays; leadership prioritized measurable cycle-time reduction.',
    clientReviewStartedAt: '2025-08-20T13:00:00Z',
    clientReviewCompletedAt: '2025-08-24T17:00:00Z',
    fieldSources: buildFieldSources(brief6FieldPaths, {
      source: 'advisor',
      confirmedByClient: true,
      confirmedAt: '2025-08-24T17:00:00Z',
    }),
    clientNotes: {
      'successCriteria.1': 'Please include setup handoff SLA in provider SOW language.',
      'requirements.2': 'Training needs a dedicated session for finance approvals.',
    },
    lockedAt: '2025-08-26T09:00:00Z',
    lockedBy: 'mock-advisor-001',
    ownerId,
    createdAt: '2025-08-10T09:00:00.000Z',
    updatedAt: '2026-01-30T17:15:00.000Z',
  },
];

export function getMockBriefById(id: string): ImplementationBrief | undefined {
  return mockBriefs.find((brief) => brief.id === id);
}
