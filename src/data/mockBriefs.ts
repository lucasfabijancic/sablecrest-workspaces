import type {
  BriefConstraints,
  BusinessContext,
  FieldSource,
  ImplementationBrief,
  RiskFactor,
  SuccessCriterion,
} from '@/types/brief';

const workspaceId = 'mock-workspace-001';
const ownerId = 'mock-owner-001';

const BUSINESS_CONTEXT_PATHS = [
  'businessContext.companyName',
  'businessContext.companySize',
  'businessContext.industry',
  'businessContext.currentState',
  'businessContext.desiredOutcome',
  'businessContext.keyStakeholders',
  'businessContext.decisionTimeline',
];

const CONSTRAINT_PATHS = [
  'constraints.budget.min',
  'constraints.budget.max',
  'constraints.budget.flexibility',
  'constraints.timeline.urgency',
  'constraints.timeline.hardDeadline',
  'constraints.timeline.reason',
  'constraints.sensitivity.level',
  'constraints.sensitivity.concerns',
  'constraints.technical.mustIntegrate',
  'constraints.technical.cannotChange',
  'constraints.technical.preferences',
];

const ERP_INTAKE_IDS = ['current-erp', 'user-count', 'modules-needed', 'integrations', 'multi-entity'];
const PM_INTAKE_IDS = ['project-volume', 'field-users', 'workflow-priorities', 'document-control', 'owner-visibility'];
const BIM_INTAKE_IDS = ['bim-maturity', 'design-tools', 'collaboration-needs', 'model-ownership', 'cde-platform'];
const INTEGRATION_INTAKE_IDS = ['systems-to-connect', 'sync-frequency', 'data-domains', 'mapping-complexity', 'integration-platform'];
const AI_INTAKE_IDS = ['primary-use-case', 'data-readiness', 'data-sources', 'integration-points', 'risk-tolerance'];
const ESTIMATING_INTAKE_IDS = ['estimate-volume', 'trade-type', 'current-tools', 'cost-database', 'integration-needs'];

interface BuildFieldSourceOptions {
  source?: FieldSource['source'];
  confirmedByClient?: boolean;
  confirmedAt?: string;
  markedForClientInput?: string[];
  notesByPath?: Record<string, string>;
}

const buildFieldPaths = (
  intakeIds: string[],
  requirementCount: number,
  successCriteriaCount: number
): string[] => {
  const requirementPaths = Array.from({ length: requirementCount }, (_, index) => `requirements.${index}`);
  const successPaths = Array.from(
    { length: successCriteriaCount },
    (_, index) => `successCriteria.${index}`
  );
  const intakePaths = intakeIds.map((id) => `intakeResponses.${id}`);

  return [...BUSINESS_CONTEXT_PATHS, ...CONSTRAINT_PATHS, ...requirementPaths, ...successPaths, ...intakePaths];
};

const buildFieldSources = (
  paths: string[],
  options: BuildFieldSourceOptions = {}
): Record<string, FieldSource> => {
  const {
    source = 'advisor',
    confirmedByClient = false,
    confirmedAt,
    markedForClientInput = [],
    notesByPath = {},
  } = options;

  return paths.reduce<Record<string, FieldSource>>((result, path) => {
    result[path] = {
      source,
      confirmedByClient,
      confirmedAt,
      clientNotes: notesByPath[path],
      markedForClientInput: markedForClientInput.includes(path),
    };
    return result;
  }, {});
};

const buildBusinessContext = (context: BusinessContext): BusinessContext => context;
const buildConstraints = (constraints: BriefConstraints): BriefConstraints => constraints;
const buildSuccessCriteria = (criteria: SuccessCriterion[]): SuccessCriterion[] => criteria;
const buildRiskFactors = (riskFactors: RiskFactor[]): RiskFactor[] => riskFactors;

const brief001Paths = buildFieldPaths(ERP_INTAKE_IDS, 2, 0);
const brief002Paths = buildFieldPaths(PM_INTAKE_IDS, 3, 2);
const brief003Paths = buildFieldPaths(BIM_INTAKE_IDS, 3, 3);
const brief004Paths = buildFieldPaths(INTEGRATION_INTAKE_IDS, 2, 2);
const brief005Paths = buildFieldPaths(AI_INTAKE_IDS, 3, 2);
const brief006Paths = buildFieldPaths(ESTIMATING_INTAKE_IDS, 3, 3);

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
        'The accounting team runs QuickBooks and spreadsheet job-cost trackers. Payroll and project financials are manually reconciled every pay cycle.',
      desiredOutcome:
        'Standardize finance, job costing, payroll, and reporting in Sage 300 CRE with less manual reconciliation and better PM visibility.',
      keyStakeholders:
        'CFO, Controller, Payroll Manager, Director of Operations, IT Manager',
      decisionTimeline: 'Within 1 month',
    }),
    requirements: [
      {
        id: 'brief-001-req-1',
        category: 'Functional',
        priority: 'Must Have',
        description: 'Support multi-entity accounting with consolidated reporting.',
        acceptanceCriteria: 'Finance can run consolidated WIP and margin reports by entity and project.',
        source: 'User',
      },
      {
        id: 'brief-001-req-2',
        category: 'Integration',
        priority: 'Must Have',
        description: 'Integrate Procore commitments and change orders into ERP job cost.',
        acceptanceCriteria: 'Approved commitments and COs sync to Sage within 15 minutes.',
        source: 'User',
      },
    ],
    successCriteria: buildSuccessCriteria([]),
    constraints: buildConstraints({
      budget: {
        min: 250000,
        max: undefined,
        flexibility: 'Flexible',
      },
      timeline: {
        urgency: 'Within 1 month',
        hardDeadline: '2026-07-01',
        reason: 'Fiscal year close and payroll stabilization target.',
      },
      sensitivity: {
        level: 'Confidential',
        concerns: ['Payroll data handling', 'Historical financial migration quality'],
      },
      technical: {
        mustIntegrate: ['Procore', 'ADP'],
        cannotChange: ['Field reporting process in Procore during phase 1'],
        preferences: ['Cloud-hosted deployment'],
      },
    }),
    riskFactors: buildRiskFactors([
      {
        id: 'brief-001-risk-1',
        category: 'Technical',
        description: 'Legacy COA and job-cost structures are inconsistent across entities.',
        likelihood: 'High',
        impact: 'High',
        mitigation: 'Run chart-of-accounts and job-cost normalization workshops before migration.',
        source: 'Sablecrest Identified',
      },
      {
        id: 'brief-001-risk-2',
        category: 'Organizational',
        description: 'Payroll team has limited implementation bandwidth during hiring season.',
        likelihood: 'Medium',
        impact: 'Medium',
        mitigation: 'Phase payroll design and testing around known peak periods.',
        source: 'Sablecrest Identified',
      },
    ]),
    intakeResponses: {
      'current-erp': 'QuickBooks Enterprise with spreadsheet-based job cost tracking',
      'user-count': 210,
      'modules-needed': ['Financials / GL', 'Project accounting', 'Payroll', 'Reporting / BI'],
    },
    advisorId: 'mock-advisor-001',
    advisorNotes:
      'Discovery call went well. CFO is the decision maker. They had a failed Viewpoint attempt in 2022.',
    discoveryDate: '2026-01-15T16:00:00Z',
    discoveryNotes:
      'Client has strong finance leadership but inconsistent source data. PM team needs cleaner job-cost visibility without heavy manual exports.',
    clientReviewStartedAt: undefined,
    clientReviewCompletedAt: undefined,
    fieldSources: buildFieldSources(brief001Paths, {
      source: 'advisor',
      confirmedByClient: false,
      markedForClientInput: [
        'businessContext.currentState',
        'businessContext.desiredOutcome',
        'businessContext.keyStakeholders',
        'constraints.budget.max',
        'intakeResponses.modules-needed',
      ],
    }),
    clientNotes: {},
    lockedAt: undefined,
    lockedBy: undefined,
    ownerId,
    createdAt: '2026-01-16T10:00:00Z',
    updatedAt: '2026-02-05T13:00:00Z',
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
      companySize: '95 employees',
      industry: 'Residential Builder',
      currentState:
        'Phase 1 Procore deployment covered document management only. Field teams still run RFIs and submittals through email and spreadsheets.',
      desiredOutcome:
        'Roll out RFIs, submittals, and schedule workflows with measurable field adoption and consistent reporting.',
      keyStakeholders:
        'VP Construction, Director of Operations, IT Manager, 14 Superintendents, 4 Coordinators',
      decisionTimeline: 'Within 2 weeks',
    }),
    requirements: [
      {
        id: 'brief-002-req-1',
        category: 'Functional',
        priority: 'Must Have',
        description: 'Standardize RFI and submittal workflow templates across projects.',
        acceptanceCriteria: 'All active projects use standardized templates by week 6.',
        source: 'User',
      },
      {
        id: 'brief-002-req-2',
        category: 'Training',
        priority: 'Must Have',
        description: 'Deliver role-specific field and office training.',
        acceptanceCriteria: '90% of target users complete training before go-live.',
        source: 'Template',
      },
      {
        id: 'brief-002-req-3',
        category: 'Support',
        priority: 'Should Have',
        description: 'Provide hypercare and office-hours support for 60 days.',
        acceptanceCriteria: 'Support response SLA under one business day during hypercare.',
        source: 'Template',
      },
    ],
    successCriteria: buildSuccessCriteria([
      {
        id: 'brief-002-success-1',
        metric: 'Weekly active field users in Procore',
        baseline: '60%',
        target: '90%',
        measurementMethod: 'Adoption Analytics',
        timeframe: '90 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: false,
        weight: 9,
      },
      {
        id: 'brief-002-success-2',
        metric: 'Average RFI cycle time',
        baseline: '8 business days',
        target: '4 business days',
        measurementMethod: 'System Report',
        timeframe: '90 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: false,
        weight: 8,
      },
    ]),
    constraints: buildConstraints({
      budget: {
        min: 80000,
        max: 180000,
        flexibility: 'Flexible',
      },
      timeline: {
        urgency: 'Within 2 weeks',
        hardDeadline: '2026-05-31',
        reason: 'Field season starts in June and requires standardized workflows.',
      },
      sensitivity: {
        level: 'Standard',
        concerns: ['Field mobile adoption', 'Change-management fatigue'],
      },
      technical: {
        mustIntegrate: ['Procore', 'Sage 300 CRE'],
        cannotChange: ['Existing owner reporting templates'],
        preferences: ['Mobile-first field experience'],
      },
    }),
    riskFactors: buildRiskFactors([
      {
        id: 'brief-002-risk-1',
        category: 'Organizational',
        description: 'Superintendent adoption may lag without on-site reinforcement.',
        likelihood: 'Medium',
        impact: 'High',
        mitigation: 'Assign field champions and schedule weekly adoption check-ins.',
        source: 'Sablecrest Identified',
      },
      {
        id: 'brief-002-risk-2',
        category: 'Timeline',
        description: 'Template standardization could slip due to active project load.',
        likelihood: 'Medium',
        impact: 'Medium',
        mitigation: 'Time-box template decisions and use pilot project validation.',
        source: 'Sablecrest Identified',
      },
    ]),
    intakeResponses: {
      'project-volume': 55,
      'field-users': 68,
      'workflow-priorities': ['RFIs', 'Submittals', 'Daily logs', 'Inspections'],
      'document-control': 'Drawings are stored in Procore, specs are still email-distributed.',
      'owner-visibility': 'Sometimes',
    },
    advisorId: 'mock-advisor-001',
    advisorNotes:
      'Advisor draft completed and structured for client confirmation. Main risk is field change management during active jobs.',
    discoveryDate: '2026-01-28T18:00:00Z',
    discoveryNotes:
      'Phase 1 launched 6 months ago. Adoption stalled at 60% and leadership wants consistent daily log and submittal execution.',
    clientReviewStartedAt: '2026-02-05T14:00:00Z',
    clientReviewCompletedAt: undefined,
    fieldSources: buildFieldSources(brief002Paths, {
      source: 'advisor',
      confirmedByClient: false,
      markedForClientInput: [
        'businessContext.keyStakeholders',
        'intakeResponses.document-control',
        'intakeResponses.owner-visibility',
      ],
    }),
    clientNotes: {},
    lockedAt: undefined,
    lockedBy: undefined,
    ownerId,
    createdAt: '2026-01-30T09:30:00Z',
    updatedAt: '2026-02-05T14:00:00Z',
  },
  {
    id: 'brief-003',
    workspaceId,
    title: 'BIM Standards & Workflow Design',
    projectTypeId: 'bim-vdc',
    status: 'In Review',
    currentVersion: 3,
    businessContext: buildBusinessContext({
      companyName: 'Northline Build Group',
      companySize: '240 employees',
      industry: 'Commercial Construction',
      currentState:
        'BIM standards vary by project and team. Coordination is mostly reactive and model handoff to field is inconsistent.',
      desiredOutcome:
        'Establish a unified BIM execution model, standards library, and coordination rhythm across all active projects.',
      keyStakeholders:
        'Director of VDC, Design Manager, Operations VP, 3 BIM Managers, 7 PMs',
      decisionTimeline: 'Within 1 month',
    }),
    requirements: [
      {
        id: 'brief-003-req-1',
        category: 'Functional',
        priority: 'Must Have',
        description: 'Define enterprise BIM standards and template governance model.',
        acceptanceCriteria: 'Formal BIM standards handbook and template governance process approved.',
        source: 'User',
      },
      {
        id: 'brief-003-req-2',
        category: 'Technical',
        priority: 'Must Have',
        description: 'Implement clash detection and issue-resolution workflow across disciplines.',
        acceptanceCriteria: 'Weekly clash cycle established with issue ownership and SLA tracking.',
        source: 'User',
      },
      {
        id: 'brief-003-req-3',
        category: 'Training',
        priority: 'Should Have',
        description: 'Train project teams on standards adoption and model handoff routines.',
        acceptanceCriteria: 'All BIM coordinators complete standards and handoff training.',
        source: 'Template',
      },
    ],
    successCriteria: buildSuccessCriteria([
      {
        id: 'brief-003-success-1',
        metric: 'Projects following enterprise BIM standards',
        baseline: '25%',
        target: '90%',
        measurementMethod: 'Manual Audit',
        timeframe: '6 Months Post-Deployment',
        source: 'advisor',
        confirmedByClient: true,
        weight: 9,
      },
      {
        id: 'brief-003-success-2',
        metric: 'Average clash resolution cycle time',
        baseline: '10 days',
        target: '4 days',
        measurementMethod: 'System Report',
        timeframe: '90 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: true,
        weight: 8,
      },
      {
        id: 'brief-003-success-3',
        metric: 'Template adoption rate across active projects',
        baseline: 'No standardized measurement',
        target: '85% by quarter end',
        measurementMethod: 'Manual Audit',
        timeframe: 'Full Deployment',
        source: 'client',
        confirmedByClient: true,
        weight: 7,
      },
    ]),
    constraints: buildConstraints({
      budget: {
        min: 120000,
        max: 260000,
        flexibility: 'Flexible',
      },
      timeline: {
        urgency: 'Within 1 month',
        hardDeadline: '2026-09-01',
        reason: 'Need standards in place before two major precon projects start.',
      },
      sensitivity: {
        level: 'Confidential',
        concerns: ['Owner model-access requirements', 'Template IP protection'],
      },
      technical: {
        mustIntegrate: ['Revit', 'Navisworks', 'Autodesk Construction Cloud'],
        cannotChange: ['Owner-mandated model deliverable format'],
        preferences: ['Common data environment governance model'],
      },
    }),
    riskFactors: buildRiskFactors([
      {
        id: 'brief-003-risk-1',
        category: 'Organizational',
        description: 'Project teams may continue project-specific standards despite enterprise push.',
        likelihood: 'Medium',
        impact: 'High',
        mitigation: 'Tie standards adherence to stage-gate approvals and governance reviews.',
        source: 'Sablecrest Identified',
      },
      {
        id: 'brief-003-risk-2',
        category: 'Technical',
        description: 'Template migration scope may expand once family-library dependencies are surfaced.',
        likelihood: 'Medium',
        impact: 'Medium',
        mitigation: 'Run template dependency audit before implementation planning.',
        source: 'Sablecrest Identified',
      },
    ]),
    intakeResponses: {
      'bim-maturity': 'Project-based',
      'design-tools': ['Revit', 'Navisworks', 'AutoCAD'],
      'collaboration-needs': ['Clash detection', 'Design coordination', 'Model handoff to field'],
      'model-ownership': 'GC / CM',
      'cde-platform': 'Yes',
    },
    advisorId: 'mock-advisor-002',
    advisorNotes:
      'Client submitted additional requirements around template migration and adoption tracking. Review whether this changes provider prioritization.',
    discoveryDate: '2026-01-20T17:00:00Z',
    discoveryNotes:
      'Strong VDC team but no enterprise process discipline. Leadership aligned on governance if supported by the right enablement plan.',
    clientReviewStartedAt: '2026-02-01T10:00:00Z',
    clientReviewCompletedAt: '2026-02-03T16:30:00Z',
    fieldSources: {
      ...buildFieldSources(brief003Paths, {
        source: 'advisor',
        confirmedByClient: true,
        confirmedAt: '2026-02-03T16:30:00Z',
      }),
      'businessContext.currentState': {
        source: 'client',
        confirmedByClient: true,
        confirmedAt: '2026-02-03T16:30:00Z',
        clientNotes: 'Include Revit template library migration scope.',
        markedForClientInput: false,
      },
      'successCriteria.2': {
        source: 'client',
        confirmedByClient: true,
        confirmedAt: '2026-02-03T16:30:00Z',
        clientNotes: 'Track adoption rate by project and region.',
        markedForClientInput: false,
      },
    },
    clientNotes: {
      'businessContext.currentState': 'We also need to migrate an existing Revit template library.',
      'successCriteria.2': 'Please track template adoption by project type.',
    },
    lockedAt: undefined,
    lockedBy: undefined,
    ownerId,
    createdAt: '2026-01-22T12:00:00Z',
    updatedAt: '2026-02-03T16:30:00Z',
  },
  {
    id: 'brief-004',
    workspaceId,
    title: 'ERP-Procore Integration',
    projectTypeId: 'system-integration',
    status: 'Locked',
    currentVersion: 4,
    businessContext: buildBusinessContext({
      companyName: 'Granite Peak Contractors',
      companySize: '320 employees',
      industry: 'Civil & Infrastructure',
      currentState:
        'ERP and Procore data are manually reconciled weekly, causing lagging project cost and billing visibility.',
      desiredOutcome:
        'Deliver reliable near-real-time sync between ERP and Procore for core project financial objects.',
      keyStakeholders:
        'CIO, Controller, PMO Director, Integration Architect, 12 Project Accountants',
      decisionTimeline: 'Within 2 weeks',
    }),
    requirements: [
      {
        id: 'brief-004-req-1',
        category: 'Integration',
        priority: 'Must Have',
        description: 'Bi-directional sync for commitments, change orders, and approved costs.',
        acceptanceCriteria: 'Financial objects sync within 30 minutes with error logging and retry.',
        source: 'User',
      },
      {
        id: 'brief-004-req-2',
        category: 'Technical',
        priority: 'Must Have',
        description: 'Establish mapping governance and data ownership model.',
        acceptanceCriteria: 'RACI and mapping dictionary approved before build kickoff.',
        source: 'Template',
      },
    ],
    successCriteria: buildSuccessCriteria([
      {
        id: 'brief-004-success-1',
        metric: 'Manual reconciliation hours per month',
        baseline: '160 hours',
        target: '40 hours',
        measurementMethod: 'Time Study',
        timeframe: '90 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: true,
        weight: 9,
      },
      {
        id: 'brief-004-success-2',
        metric: 'Integration data error rate',
        baseline: '12% record exception rate',
        target: 'Under 2%',
        measurementMethod: 'System Report',
        timeframe: '30 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: true,
        weight: 8,
      },
    ]),
    constraints: buildConstraints({
      budget: {
        min: 180000,
        max: 320000,
        flexibility: 'Firm',
      },
      timeline: {
        urgency: 'Within 2 weeks',
        hardDeadline: '2026-08-15',
        reason: 'Need clean data flow before enterprise reporting refresh.',
      },
      sensitivity: {
        level: 'Highly Confidential',
        concerns: ['Commercial pricing data', 'Audit trails and change logs'],
      },
      technical: {
        mustIntegrate: ['Sage 300 CRE', 'Procore', 'Azure AD'],
        cannotChange: ['Existing ERP chart of accounts'],
        preferences: ['Managed iPaaS', 'API-first architecture'],
      },
    }),
    riskFactors: buildRiskFactors([
      {
        id: 'brief-004-risk-1',
        category: 'Commercial',
        description: 'Scope creep risk around downstream analytics and dashboard asks.',
        likelihood: 'Medium',
        impact: 'High',
        mitigation: 'Lock phase-1 object scope before SOW finalization.',
        source: 'Sablecrest Identified',
      },
      {
        id: 'brief-004-risk-2',
        category: 'Technical',
        description: 'Legacy data-quality issues may increase mapping effort.',
        likelihood: 'Medium',
        impact: 'Medium',
        mitigation: 'Run pre-build data profiling on all target entities.',
        source: 'Sablecrest Identified',
      },
    ]),
    intakeResponses: {
      'systems-to-connect': ['ERP', 'Project management platform', 'Document management'],
      'sync-frequency': 'Real-time / event-driven',
      'data-domains': ['Cost codes', 'Commitments', 'Change orders', 'Invoices'],
      'mapping-complexity': 'Medium',
      'integration-platform': 'Evaluating',
    },
    advisorId: 'mock-advisor-001',
    advisorNotes:
      'Client and advisor aligned on scope boundaries. Brief has been approved and locked for matching.',
    discoveryDate: '2026-01-11T15:30:00Z',
    discoveryNotes:
      'Finance and operations both committed to integration governance model. Strong executive sponsorship from CIO.',
    clientReviewStartedAt: '2026-01-27T12:00:00Z',
    clientReviewCompletedAt: '2026-01-30T17:00:00Z',
    fieldSources: buildFieldSources(brief004Paths, {
      source: 'advisor',
      confirmedByClient: true,
      confirmedAt: '2026-01-30T17:00:00Z',
    }),
    clientNotes: {},
    lockedAt: '2026-02-06T09:00:00Z',
    lockedBy: 'mock-advisor-001',
    ownerId,
    createdAt: '2026-01-13T09:00:00Z',
    updatedAt: '2026-02-06T09:00:00Z',
  },
  {
    id: 'brief-005',
    workspaceId,
    title: 'AI Takeoff Pilot',
    projectTypeId: 'ai-automation',
    status: 'Shortlisted',
    currentVersion: 5,
    businessContext: buildBusinessContext({
      companyName: 'Stonebridge Specialty Contractors',
      companySize: '130 employees',
      industry: 'Specialty Trade Contractor',
      currentState:
        'Estimators manually process drawings and quantity takeoffs with inconsistent historical assumptions.',
      desiredOutcome:
        'Pilot AI-assisted takeoff on selected bid packages to improve speed and confidence in estimates.',
      keyStakeholders:
        'Chief Estimator, Precon Director, COO, IT Generalist',
      decisionTimeline: 'Within 2 weeks',
    }),
    requirements: [
      {
        id: 'brief-005-req-1',
        category: 'Functional',
        priority: 'Must Have',
        description: 'Support pilot workflow for quantity extraction on mechanical scopes.',
        acceptanceCriteria: 'Pilot outputs accepted by estimating team for at least three live bids.',
        source: 'User',
      },
      {
        id: 'brief-005-req-2',
        category: 'Technical',
        priority: 'Must Have',
        description: 'Integrate pilot outputs into current estimating workbook process.',
        acceptanceCriteria: 'Pilot outputs consumed without manual rework beyond defined threshold.',
        source: 'Template',
      },
      {
        id: 'brief-005-req-3',
        category: 'Support',
        priority: 'Should Have',
        description: 'Provide model governance and exception review process.',
        acceptanceCriteria: 'Exception review SOP adopted by preconstruction team.',
        source: 'Template',
      },
    ],
    successCriteria: buildSuccessCriteria([
      {
        id: 'brief-005-success-1',
        metric: 'Takeoff cycle time per bid package',
        baseline: '16 hours',
        target: '8 hours',
        measurementMethod: 'Time Study',
        timeframe: '90 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: true,
        weight: 9,
      },
      {
        id: 'brief-005-success-2',
        metric: 'Variance between pilot and final awarded quantities',
        baseline: 'No baseline',
        target: 'Under 5% variance',
        measurementMethod: 'Financial Reconciliation',
        timeframe: 'Phase 1 Go-Live',
        source: 'client',
        confirmedByClient: true,
        weight: 8,
      },
    ]),
    constraints: buildConstraints({
      budget: {
        min: 60000,
        max: 140000,
        flexibility: 'Flexible',
      },
      timeline: {
        urgency: 'Within 2 weeks',
        hardDeadline: '2026-06-15',
        reason: 'Pilot must complete before annual bidding surge.',
      },
      sensitivity: {
        level: 'Confidential',
        concerns: ['Bid pricing confidentiality', 'Model-output explainability'],
      },
      technical: {
        mustIntegrate: ['Bluebeam', 'Excel', 'SharePoint'],
        cannotChange: ['Current bid approval sign-off workflow'],
        preferences: ['Fast pilot deployment', 'Clear human override controls'],
      },
    }),
    riskFactors: buildRiskFactors([
      {
        id: 'brief-005-risk-1',
        category: 'Technical',
        description: 'Training data quality may limit accuracy on complex details.',
        likelihood: 'Medium',
        impact: 'High',
        mitigation: 'Constrain pilot scope and include structured estimator validation loops.',
        source: 'Sablecrest Identified',
      },
      {
        id: 'brief-005-risk-2',
        category: 'Commercial',
        description: 'Pilot success criteria could drift without clear baseline governance.',
        likelihood: 'Low',
        impact: 'Medium',
        mitigation: 'Finalize KPI baselines before kickoff and lock scorecard definitions.',
        source: 'Sablecrest Identified',
      },
    ]),
    intakeResponses: {
      'primary-use-case': 'Estimate acceleration for mechanical bid packages',
      'data-readiness': 'Moderate - historical files exist but inconsistent tagging',
      'data-sources': ['Plan sheets', 'Historical estimates', 'RFIs'],
      'integration-points': ['Estimating workbook', 'Document repository'],
      'risk-tolerance': 'Medium',
    },
    advisorId: 'mock-advisor-002',
    advisorNotes:
      'Matching complete and shortlist prepared. Client prioritized providers with construction AI pilot experience and clear validation workflows.',
    discoveryDate: '2026-01-19T16:30:00Z',
    discoveryNotes:
      'Client wants speed gains without sacrificing estimator trust. Pilot governance and explainability are critical to adoption.',
    clientReviewStartedAt: '2026-01-25T11:00:00Z',
    clientReviewCompletedAt: '2026-01-28T15:00:00Z',
    fieldSources: buildFieldSources(brief005Paths, {
      source: 'advisor',
      confirmedByClient: true,
      confirmedAt: '2026-01-28T15:00:00Z',
    }),
    clientNotes: {},
    lockedAt: '2026-01-29T10:00:00Z',
    lockedBy: 'mock-advisor-002',
    ownerId,
    createdAt: '2026-01-20T09:30:00Z',
    updatedAt: '2026-02-08T12:30:00Z',
  },
  {
    id: 'brief-006',
    workspaceId,
    title: 'Estimating System Upgrade',
    projectTypeId: 'estimating-takeoff',
    status: 'Completed',
    currentVersion: 6,
    businessContext: buildBusinessContext({
      companyName: 'Harborline Builders',
      companySize: '260 employees',
      industry: 'Commercial General Contractor',
      currentState:
        'Estimating process is split across legacy desktop tools and manually curated cost databases.',
      desiredOutcome:
        'Modernize estimating workflow with digital takeoff, shared cost database governance, and faster bid turnaround.',
      keyStakeholders:
        'Chief Estimator, CFO, Precon Manager, IT Director, 11 Estimators',
      decisionTimeline: 'Within 3 months',
    }),
    requirements: [
      {
        id: 'brief-006-req-1',
        category: 'Functional',
        priority: 'Must Have',
        description: 'Implement digital takeoff and standardized assemblies.',
        acceptanceCriteria: 'All estimators use shared assemblies and digital takeoff workflows.',
        source: 'User',
      },
      {
        id: 'brief-006-req-2',
        category: 'Integration',
        priority: 'Should Have',
        description: 'Integrate approved estimate outputs into ERP pre-job workflows.',
        acceptanceCriteria: 'Estimate handoff to ERP pre-job package is automated.',
        source: 'Template',
      },
      {
        id: 'brief-006-req-3',
        category: 'Training',
        priority: 'Must Have',
        description: 'Deliver onboarding and SOP rollout for all estimating roles.',
        acceptanceCriteria: '100% of estimating team trained on new SOPs and tooling.',
        source: 'Template',
      },
    ],
    successCriteria: buildSuccessCriteria([
      {
        id: 'brief-006-success-1',
        metric: 'Estimate turnaround time',
        baseline: '12 calendar days',
        target: '6 calendar days',
        measurementMethod: 'System Report',
        timeframe: '90 Days Post-Deployment',
        source: 'advisor',
        confirmedByClient: true,
        weight: 9,
      },
      {
        id: 'brief-006-success-2',
        metric: 'Variance between estimate and awarded cost',
        baseline: '11%',
        target: 'Under 5%',
        measurementMethod: 'Financial Reconciliation',
        timeframe: '6 Months Post-Deployment',
        source: 'client',
        confirmedByClient: true,
        weight: 8,
      },
      {
        id: 'brief-006-success-3',
        metric: 'Cost database refresh cycle',
        baseline: 'Quarterly ad-hoc',
        target: 'Monthly governed refresh',
        measurementMethod: 'Manual Audit',
        timeframe: 'Full Deployment',
        source: 'advisor',
        confirmedByClient: true,
        weight: 7,
      },
    ]),
    constraints: buildConstraints({
      budget: {
        min: 200000,
        max: 400000,
        flexibility: 'Firm',
      },
      timeline: {
        urgency: 'Within 3 months',
        hardDeadline: '2026-10-31',
        reason: 'Target full operational use before next fiscal planning cycle.',
      },
      sensitivity: {
        level: 'Standard',
        concerns: ['Bid history normalization', 'Cost-code governance consistency'],
      },
      technical: {
        mustIntegrate: ['Estimating platform', 'ERP', 'Document management'],
        cannotChange: ['Corporate approval workflow for bid sign-off'],
        preferences: ['Cloud-native collaboration', 'Role-based permissions'],
      },
    }),
    riskFactors: buildRiskFactors([
      {
        id: 'brief-006-risk-1',
        category: 'Timeline',
        description: 'Historical database cleanup could extend migration timeline.',
        likelihood: 'Medium',
        impact: 'Medium',
        mitigation: 'Define migration scope boundaries and archive policy early.',
        source: 'Sablecrest Identified',
      },
      {
        id: 'brief-006-risk-2',
        category: 'Organizational',
        description: 'Estimator behavior change may lag without strong leadership reinforcement.',
        likelihood: 'Low',
        impact: 'Medium',
        mitigation: 'Track adoption KPIs weekly with leadership follow-up cadence.',
        source: 'Sablecrest Identified',
      },
    ]),
    intakeResponses: {
      'estimate-volume': 46,
      'trade-type': 'Commercial mixed-use and municipal projects',
      'current-tools': ['Bluebeam', 'Excel', 'Legacy takeoff desktop software'],
      'cost-database': 'Shared spreadsheet with inconsistent updates by team',
      'integration-needs': ['ERP pre-job setup', 'Document management'],
    },
    advisorId: 'mock-advisor-001',
    advisorNotes:
      'Engagement completed successfully. Client selected provider from curated shortlist and implementation outcomes met target KPI thresholds.',
    discoveryDate: '2025-12-10T17:00:00Z',
    discoveryNotes:
      'Client needed a full estimating modernization roadmap. Governance and training were critical factors in provider selection.',
    clientReviewStartedAt: '2025-12-18T11:00:00Z',
    clientReviewCompletedAt: '2025-12-22T16:45:00Z',
    fieldSources: buildFieldSources(brief006Paths, {
      source: 'advisor',
      confirmedByClient: true,
      confirmedAt: '2025-12-22T16:45:00Z',
    }),
    clientNotes: {
      'constraints.timeline.hardDeadline': 'We can tolerate up to 2 weeks slip if go-live quality is protected.',
    },
    lockedAt: '2026-01-05T09:15:00Z',
    lockedBy: 'mock-advisor-001',
    ownerId,
    createdAt: '2025-12-11T09:00:00Z',
    updatedAt: '2026-02-09T10:30:00Z',
  },
];

export function getMockBriefById(id: string): ImplementationBrief | undefined {
  return mockBriefs.find((brief) => brief.id === id);
}
