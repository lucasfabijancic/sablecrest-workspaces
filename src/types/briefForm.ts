import type {
  BriefConstraints,
  BusinessContext,
  RiskFactor,
  SuccessCriterion,
} from '@/types/brief';
import type { SensitivityLevel, TimelineUrgency } from '@/types/database';

export interface BriefFormData {
  projectTypeId: string | null;
  customProjectType?: string;
  businessContext: BusinessContext;
  intakeResponses: Record<string, any>;
  successCriteria: SuccessCriterion[];
  constraints: BriefConstraints;
  riskFactors: RiskFactor[];
}

export interface BriefStepProps {
  formData: BriefFormData;
  updateFormData: (updates: Partial<BriefFormData>) => void;
  isValid: boolean;
  setIsValid: (valid: boolean) => void;
}

const EMPTY_TIMELINE_URGENCY = '' as TimelineUrgency;
const EMPTY_SENSITIVITY_LEVEL = '' as SensitivityLevel;

export const INITIAL_FORM_DATA: BriefFormData = {
  projectTypeId: null,
  customProjectType: undefined,
  businessContext: {
    companyName: '',
    companySize: '',
    industry: '',
    currentState: '',
    desiredOutcome: '',
    keyStakeholders: '',
    decisionTimeline: '',
  },
  intakeResponses: {},
  successCriteria: [],
  constraints: {
    budget: {
      min: undefined,
      max: undefined,
      flexibility: 'Flexible',
    },
    timeline: {
      urgency: EMPTY_TIMELINE_URGENCY,
      hardDeadline: '',
      reason: '',
    },
    sensitivity: {
      level: EMPTY_SENSITIVITY_LEVEL,
      concerns: [],
    },
    technical: {
      mustIntegrate: [],
      cannotChange: [],
      preferences: [],
    },
  },
  riskFactors: [],
};

export const BRIEF_STEPS = [
  { id: 1, title: 'Project Type', description: 'Select the AEC implementation type' },
  { id: 2, title: 'Context', description: 'Business context' },
  { id: 3, title: 'Requirements', description: 'Project-specific intake' },
  { id: 4, title: 'Success Criteria', description: 'Define outcomes' },
  { id: 5, title: 'Constraints', description: 'Budget and technical limits' },
  { id: 6, title: 'Review', description: 'Confirm and lock' },
] as const;
