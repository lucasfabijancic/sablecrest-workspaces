export interface IntakeQuestion {
  id: string;
  question: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea';
  options?: string[];
  required: boolean;
  helpText?: string;
}

export interface AECProjectType {
  id: string;
  name: string;
  category: 'Software' | 'Integration' | 'Process' | 'Digital';
  description: string;
  typicalBudgetMin: number;
  typicalBudgetMax: number;
  typicalTimelineWeeks: { min: number; max: number };
  commonCapabilities: string[];
  intakeQuestions: IntakeQuestion[];
  commonRisks: string[];
}

export const aecProjectTypes: AECProjectType[] = [
  {
    id: 'erp-implementation',
    name: 'Construction ERP Implementation',
    category: 'Software',
    description:
      'Selection and deployment of a construction ERP platform such as Sage 300 CRE, Viewpoint, or CMiC, including finance, project controls, and payroll.',
    typicalBudgetMin: 250000,
    typicalBudgetMax: 2000000,
    typicalTimelineWeeks: { min: 20, max: 52 },
    commonCapabilities: [
      'General ledger and job cost setup',
      'Payroll and labor compliance',
      'Project accounting and billing',
      'Equipment and fixed asset tracking',
      'Multi-entity and consolidation reporting',
      'Integrations to field and estimating tools',
    ],
    intakeQuestions: [
      {
        id: 'current-erp',
        question: 'What ERP or accounting system are you using today?',
        type: 'text',
        required: true,
        helpText: 'Include version and any major customizations.',
      },
      {
        id: 'user-count',
        question: 'How many total users will need access (office + field)?',
        type: 'number',
        required: true,
      },
      {
        id: 'modules-needed',
        question: 'Which ERP modules are in scope?',
        type: 'multiselect',
        options: [
          'Financials / GL',
          'Project accounting',
          'Payroll',
          'Equipment',
          'Procurement',
          'Service management',
          'HR / timekeeping',
          'Reporting / BI',
        ],
        required: true,
      },
      {
        id: 'integrations',
        question: 'What systems need to integrate with the ERP?',
        type: 'multiselect',
        options: [
          'Project management (Procore, etc.)',
          'Estimating',
          'Timekeeping / field capture',
          'HR / benefits',
          'AP automation',
          'CRM',
          'Document management',
        ],
        required: false,
      },
      {
        id: 'multi-entity',
        question: 'Do you operate multiple companies or cost centers that require consolidation?',
        type: 'select',
        options: ['Yes', 'No', 'Not sure'],
        required: true,
      },
    ],
    commonRisks: [
      'Data migration complexity and legacy data quality',
      'Underestimated payroll and tax configuration effort',
      'Change management for finance and field teams',
      'Integration scope creep across multiple systems',
    ],
  },
  {
    id: 'pm-software',
    name: 'Project Management Software',
    category: 'Software',
    description:
      'Implementation of project management platforms like Procore, PlanGrid, or Buildertrend for field execution, RFIs, submittals, and inspections.',
    typicalBudgetMin: 50000,
    typicalBudgetMax: 300000,
    typicalTimelineWeeks: { min: 8, max: 20 },
    commonCapabilities: [
      'RFI and submittal workflows',
      'Punch lists and inspections',
      'Daily logs and field reports',
      'Drawings and document control',
      'Change order management',
      'Mobile field enablement',
    ],
    intakeQuestions: [
      {
        id: 'project-volume',
        question: 'How many active projects do you manage per year?',
        type: 'number',
        required: true,
      },
      {
        id: 'field-users',
        question: 'How many field users need mobile access?',
        type: 'number',
        required: true,
      },
      {
        id: 'workflow-priorities',
        question: 'Which workflows are the highest priority to digitize?',
        type: 'multiselect',
        options: [
          'RFIs',
          'Submittals',
          'Daily logs',
          'Punch lists',
          'Inspections',
          'Change orders',
          'Meeting minutes',
        ],
        required: true,
      },
      {
        id: 'document-control',
        question: 'Where are project drawings and specs managed today?',
        type: 'text',
        required: true,
      },
      {
        id: 'owner-visibility',
        question: 'Do owners require access or reporting from the system?',
        type: 'select',
        options: ['Yes', 'No', 'Sometimes'],
        required: true,
      },
    ],
    commonRisks: [
      'Low field adoption due to training gaps',
      'Incomplete workflows mapped to the tool',
      'Document version control issues during rollout',
      'Misalignment between project and accounting teams',
    ],
  },
  {
    id: 'bim-vdc',
    name: 'BIM / VDC Implementation',
    category: 'Digital',
    description:
      'Deployment of BIM and VDC processes, tooling, and standards to improve coordination, clash detection, and model-based collaboration.',
    typicalBudgetMin: 80000,
    typicalBudgetMax: 500000,
    typicalTimelineWeeks: { min: 12, max: 32 },
    commonCapabilities: [
      'BIM execution planning (BEP)',
      'Model coordination and clash detection',
      '4D/5D integration with schedule and cost',
      'Model-based quantity takeoff',
      'Common data environment setup',
      'VDC standards and templates',
    ],
    intakeQuestions: [
      {
        id: 'bim-maturity',
        question: 'How would you describe your current BIM maturity?',
        type: 'select',
        options: ['Ad hoc', 'Project-based', 'Standardized', 'Optimized'],
        required: true,
      },
      {
        id: 'design-tools',
        question: 'Which design/modeling tools are in use today?',
        type: 'multiselect',
        options: ['Revit', 'Navisworks', 'AutoCAD', 'Civil 3D', 'Tekla', 'Rhino', 'Other'],
        required: true,
      },
      {
        id: 'collaboration-needs',
        question: 'What collaboration outcomes are most important?',
        type: 'multiselect',
        options: [
          'Clash detection',
          'Model handoff to field',
          'Design coordination',
          'Owner deliverables',
          'Fabrication modeling',
          '4D/5D planning',
        ],
        required: true,
      },
      {
        id: 'model-ownership',
        question: 'Who owns the federated model and coordination process?',
        type: 'select',
        options: ['GC / CM', 'Design team', 'Trade partner', 'Shared / TBD'],
        required: true,
      },
      {
        id: 'cde-platform',
        question: 'Do you have a common data environment (CDE) platform in place?',
        type: 'select',
        options: ['Yes', 'No', 'Evaluating'],
        required: true,
      },
    ],
    commonRisks: [
      'Inconsistent modeling standards across teams',
      'Late engagement of trade partners in coordination',
      'Under-resourced VDC staffing and governance',
      'Tool sprawl without a clear CDE strategy',
    ],
  },
  {
    id: 'estimating-takeoff',
    name: 'Estimating & Takeoff Systems',
    category: 'Software',
    description:
      'Implementation of estimating and digital takeoff tools to improve bid accuracy, speed, and historical cost analysis.',
    typicalBudgetMin: 40000,
    typicalBudgetMax: 250000,
    typicalTimelineWeeks: { min: 6, max: 16 },
    commonCapabilities: [
      'Digital quantity takeoff',
      'Assemblies and cost database management',
      'Bid leveling and comparison',
      'Historical cost analytics',
      'Integration to ERP and project controls',
    ],
    intakeQuestions: [
      {
        id: 'estimate-volume',
        question: 'Approximately how many estimates are produced per month?',
        type: 'number',
        required: true,
      },
      {
        id: 'trade-type',
        question: 'Which trade or market segment best describes your estimating needs?',
        type: 'select',
        options: [
          'General contractor',
          'Civil / infrastructure',
          'MEP subcontractor',
          'Specialty trade',
          'Design-build',
        ],
        required: true,
      },
      {
        id: 'current-tools',
        question: 'What tools are used for estimating and takeoff today?',
        type: 'text',
        required: true,
      },
      {
        id: 'cost-database',
        question: 'Do you maintain a centralized cost database or assemblies library?',
        type: 'select',
        options: ['Yes', 'No', 'Partially'],
        required: true,
      },
      {
        id: 'integration-needs',
        question: 'Which downstream systems should receive estimate data?',
        type: 'multiselect',
        options: ['ERP / job cost', 'Project management', 'Scheduling', 'Procurement', 'CRM'],
        required: false,
      },
    ],
    commonRisks: [
      'Inconsistent estimating standards across estimators',
      'Low adoption of cost database discipline',
      'Underestimating integration and data cleanup effort',
      'Overreliance on spreadsheets during transition',
    ],
  },
  {
    id: 'ai-automation',
    name: 'AI & Automation for Construction',
    category: 'Digital',
    description:
      'AI-assisted workflows and automation across preconstruction, project controls, and field operations to reduce manual effort.',
    typicalBudgetMin: 75000,
    typicalBudgetMax: 600000,
    typicalTimelineWeeks: { min: 10, max: 26 },
    commonCapabilities: [
      'Document classification and extraction',
      'RFI and submittal triage',
      'Schedule and cost risk detection',
      'Automated report generation',
      'Field data quality checks',
      'Workflow automation and routing',
    ],
    intakeQuestions: [
      {
        id: 'primary-use-case',
        question: 'What is the primary AI or automation use case you want to solve?',
        type: 'textarea',
        required: true,
      },
      {
        id: 'data-readiness',
        question: 'How would you rate the quality and consistency of your project data?',
        type: 'select',
        options: ['Poor', 'Fair', 'Good', 'Excellent'],
        required: true,
      },
      {
        id: 'data-sources',
        question: 'Which systems will provide data to the AI workflows?',
        type: 'multiselect',
        options: [
          'ERP / job cost',
          'Project management',
          'Document management',
          'Scheduling',
          'Field capture',
          'Email / collaboration',
        ],
        required: true,
      },
      {
        id: 'integration-points',
        question: 'Where should automated outputs be delivered?',
        type: 'multiselect',
        options: ['PM platform', 'ERP', 'Email', 'BI dashboards', 'Mobile apps'],
        required: true,
      },
      {
        id: 'risk-tolerance',
        question: 'What level of human review is required before automation actions?',
        type: 'select',
        options: ['Every action', 'High-risk only', 'Sampling', 'Minimal'],
        required: true,
      },
    ],
    commonRisks: [
      'Insufficient or inconsistent data for training',
      'Lack of clear ownership for AI governance',
      'Integration gaps limiting automation impact',
      'User mistrust of AI-generated outputs',
    ],
  },
  {
    id: 'system-integration',
    name: 'Construction System Integration',
    category: 'Integration',
    description:
      'Connecting multiple construction systems to synchronize data across ERP, PM, estimating, and field tools.',
    typicalBudgetMin: 60000,
    typicalBudgetMax: 500000,
    typicalTimelineWeeks: { min: 8, max: 24 },
    commonCapabilities: [
      'Bidirectional data synchronization',
      'Master data governance',
      'API and middleware configuration',
      'Data mapping and transformation',
      'Integration monitoring and alerts',
      'Field-to-office data flow',
    ],
    intakeQuestions: [
      {
        id: 'systems-to-connect',
        question: 'Which systems need to be connected?',
        type: 'multiselect',
        options: [
          'ERP / job cost',
          'Project management',
          'Estimating',
          'Scheduling',
          'Timekeeping',
          'Document management',
          'CRM',
        ],
        required: true,
      },
      {
        id: 'sync-frequency',
        question: 'How frequently should data be synchronized?',
        type: 'select',
        options: ['Real-time', 'Hourly', 'Daily', 'Weekly'],
        required: true,
      },
      {
        id: 'data-domains',
        question: 'Which data domains are most critical to integrate?',
        type: 'multiselect',
        options: [
          'Projects and cost codes',
          'Commitments / subcontracts',
          'Change orders',
          'Invoices / AP',
          'RFIs and submittals',
          'Timesheets',
        ],
        required: true,
      },
      {
        id: 'mapping-complexity',
        question: 'How complex are the data mappings between systems?',
        type: 'select',
        options: ['Simple', 'Moderate', 'Complex', 'Unknown'],
        required: true,
      },
      {
        id: 'integration-platform',
        question: 'Do you already use an integration platform or middleware?',
        type: 'select',
        options: ['Yes', 'No', 'Evaluating'],
        required: false,
      },
    ],
    commonRisks: [
      'API limitations or vendor restrictions',
      'Master data inconsistencies across systems',
      'Hidden edge cases in field workflows',
      'Lack of monitoring for failed syncs',
    ],
  },
];
