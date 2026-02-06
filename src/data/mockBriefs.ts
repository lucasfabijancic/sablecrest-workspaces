import type {
  ImplementationBrief,
  BusinessContext,
  SuccessCriterion,
  BriefConstraints,
  RiskFactor,
} from '@/types/brief';

const workspaceId = 'mock-workspace-001';
const ownerId = 'mock-user-001';

const buildBusinessContext = (context: BusinessContext): BusinessContext => context;
const buildSuccessCriteria = (criteria: SuccessCriterion[]): SuccessCriterion[] => criteria;
const buildConstraints = (constraints: BriefConstraints): BriefConstraints => constraints;
const buildRiskFactors = (riskFactors: RiskFactor[]): RiskFactor[] => riskFactors;

export const mockBriefs: ImplementationBrief[] = [
  {
    id: 'brief-001',
    workspaceId,
    title: 'Sage 300 CRE Implementation',
    projectTypeId: 'erp-implementation',
    status: 'Draft',
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
        weight: 8,
      },
      {
        id: 'brf-001-sc-2',
        metric: 'Purchase order processing cycle time',
        baseline: '4.5 days average',
        target: '2 days average',
        measurementMethod: 'System Report',
        timeframe: 'Full Deployment',
        weight: 6,
      },
      {
        id: 'brf-001-sc-3',
        metric: 'Duplicate project cost entry incidents per month',
        baseline: '30+ duplicate entries',
        target: '0 duplicate entries',
        measurementMethod: 'Manual Audit',
        timeframe: '30 Days Post-Deployment',
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
        source: 'AI Identified',
      },
      {
        id: 'brf-001-risk-2',
        category: 'Organizational',
        description: 'Payroll team has limited availability during seasonal hiring months.',
        likelihood: 'Medium',
        impact: 'Medium',
        mitigation: 'Schedule payroll configuration sprints outside peak hiring weeks.',
        source: 'User',
      },
    ]),
    intakeResponses: {
      'current-erp': 'QuickBooks Enterprise with custom Excel job cost trackers',
      'user-count': 210,
      'modules-needed': ['Financials / GL', 'Project accounting', 'Payroll', 'Procurement', 'Reporting / BI'],
      'integrations': ['Project management (Procore, etc.)', 'HR / benefits', 'Timekeeping / field capture'],
      'multi-entity': 'Yes',
    },
    ownerId,
    createdAt: '2026-01-12T15:10:00.000Z',
    updatedAt: '2026-02-05T14:22:00.000Z',
  },
  {
    id: 'brief-002',
    workspaceId,
    title: 'Procore Rollout Phase 2',
    projectTypeId: 'pm-software',
    status: 'In Review',
    currentVersion: 1,
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
      decisionTimeline: 'Ready to decide now',
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
        weight: 9,
      },
      {
        id: 'brf-002-sc-2',
        metric: 'Average RFI response turnaround',
        baseline: '6.2 days',
        target: '3 days',
        measurementMethod: 'System Report',
        timeframe: '30 Days Post-Deployment',
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
    ownerId,
    createdAt: '2026-01-20T10:45:00.000Z',
    updatedAt: '2026-02-03T16:30:00.000Z',
  },
  {
    id: 'brief-003',
    workspaceId,
    title: 'BIM Standards & Workflow Design',
    projectTypeId: 'bim-vdc',
    status: 'Locked',
    currentVersion: 1,
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
        weight: 8,
      },
      {
        id: 'brf-003-sc-2',
        metric: 'Average clash resolution time',
        baseline: '10 business days',
        target: '5 business days',
        measurementMethod: 'System Report',
        timeframe: '90 Days Post-Deployment',
        weight: 7,
      },
      {
        id: 'brf-003-sc-3',
        metric: 'Model rework hours per project',
        baseline: '120 hours',
        target: '70 hours',
        measurementMethod: 'Time Study',
        timeframe: '6 Months Post-Deployment',
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
        source: 'AI Identified',
      },
    ]),
    intakeResponses: {
      'bim-maturity': 'Project-based',
      'design-tools': ['Revit', 'Navisworks', 'AutoCAD'],
      'collaboration-needs': ['Clash detection', 'Design coordination', 'Owner deliverables'],
      'model-ownership': 'Shared / TBD',
      'cde-platform': 'Evaluating',
    },
    lockedAt: '2026-02-01T12:00:00.000Z',
    lockedBy: 'mock-user-002',
    ownerId,
    createdAt: '2026-01-10T09:20:00.000Z',
    updatedAt: '2026-02-01T12:00:00.000Z',
  },
  {
    id: 'brief-004',
    workspaceId,
    title: 'ERP-Procore Integration',
    projectTypeId: 'system-integration',
    status: 'In Execution',
    currentVersion: 1,
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
      decisionTimeline: 'Ready to decide now',
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
        weight: 8,
      },
      {
        id: 'brf-004-sc-2',
        metric: 'Sync accuracy for commitments and change orders',
        baseline: '72% accurate transfer',
        target: '98% accurate transfer',
        measurementMethod: 'System Report',
        timeframe: '30 Days Post-Deployment',
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
        source: 'AI Identified',
      },
    ]),
    intakeResponses: {
      'systems-to-connect': ['ERP / job cost', 'Project management', 'Document management'],
      'sync-frequency': 'Real-time',
      'data-domains': ['Commitments / subcontracts', 'Change orders', 'Invoices / AP', 'RFIs and submittals'],
      'mapping-complexity': 'Complex',
      'integration-platform': 'Yes',
    },
    ownerId,
    createdAt: '2026-01-18T11:05:00.000Z',
    updatedAt: '2026-02-04T13:40:00.000Z',
  },
  {
    id: 'brief-005',
    workspaceId,
    title: 'AI Takeoff Pilot',
    projectTypeId: 'ai-automation',
    status: 'Completed',
    currentVersion: 1,
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
        weight: 8,
      },
      {
        id: 'brf-005-sc-2',
        metric: 'Takeoff accuracy variance vs. final awarded quantities',
        baseline: '12% variance',
        target: '5% variance or less',
        measurementMethod: 'Financial Reconciliation',
        timeframe: '6 Months Post-Deployment',
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
        hardDeadline: '2026-01-20',
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
        source: 'AI Identified',
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
      'primary-use-case': 'AI-assisted electrical takeoff for conduit runs, fixtures, and panel schedules on 3 pilot projects.',
      'data-readiness': 'Good',
      'data-sources': ['Document management', 'Project management'],
      'integration-points': ['BI dashboards', 'Email'],
      'risk-tolerance': 'High-risk only',
    },
    ownerId,
    createdAt: '2026-01-08T08:30:00.000Z',
    updatedAt: '2026-01-30T17:15:00.000Z',
  },
];

export function getMockBriefById(id: string): ImplementationBrief | undefined {
  return mockBriefs.find((brief) => brief.id === id);
}
