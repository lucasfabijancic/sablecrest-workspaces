import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { aecProjectTypes, type AECProjectType } from '@/data/aecProjectTypes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  ProjectTypeStep,
  BusinessContextStep,
  RequirementsStep,
  SuccessCriteriaStep,
  ConstraintsStep,
} from '@/components/briefs/intake';
import { INITIAL_FORM_DATA, type BriefFormData, type BriefStepProps } from '@/types/briefForm';
import type {
  FieldSource,
  ImplementationBrief,
  RiskFactor,
  SuccessCriterion,
  BriefRequirement,
  BriefStatus,
} from '@/types/brief';
import type { ClientProfile } from '@/types/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface ClientProfileRow {
  id: string;
  workspace_id: string;
  company_legal_name: string;
  company_dba: string | null;
  annual_revenue_range: string | null;
  employee_count: number | null;
  office_field_split: string | null;
  active_project_count: number | null;
  geographic_footprint: string | null;
  growth_trajectory: ClientProfile['growthTrajectory'] | null;
  current_systems: string[] | null;
  it_maturity: ClientProfile['itMaturity'] | null;
  previous_implementations: string | null;
  assigned_advisor_id: string | null;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_role: string | null;
  discovery_call_date: string | null;
  discovery_call_notes: string | null;
  documents_received: string[] | null;
  onboarding_status: ClientProfile['onboardingStatus'] | null;
  created_at: string;
  updated_at: string;
}

interface ClientOption {
  row: ClientProfileRow;
  profile: ClientProfile;
}

type SaveMode = 'draft' | 'clientReview';
type SaveStatus = Extract<BriefStatus, 'Advisor Draft' | 'Client Review'>;

const CONTEXT_FIELD_TOGGLES = [
  { path: 'businessContext.companyName', label: 'Company Name' },
  { path: 'businessContext.companySize', label: 'Company Size' },
  { path: 'businessContext.industry', label: 'Industry Segment' },
  { path: 'businessContext.currentState', label: 'Current State' },
  { path: 'businessContext.desiredOutcome', label: 'Desired Outcome' },
  { path: 'businessContext.keyStakeholders', label: 'Key Stakeholders' },
  { path: 'businessContext.decisionTimeline', label: 'Decision Timeline' },
] as const;

const CONSTRAINT_FIELD_TOGGLES = [
  { path: 'constraints.budget.min', label: 'Budget Minimum' },
  { path: 'constraints.budget.max', label: 'Budget Maximum' },
  { path: 'constraints.budget.flexibility', label: 'Budget Flexibility' },
  { path: 'constraints.timeline.urgency', label: 'Timeline Urgency' },
  { path: 'constraints.timeline.hardDeadline', label: 'Hard Deadline' },
  { path: 'constraints.timeline.reason', label: 'Deadline Reason' },
  { path: 'constraints.sensitivity.level', label: 'Sensitivity Level' },
  { path: 'constraints.sensitivity.concerns', label: 'Sensitivity Concerns' },
  { path: 'constraints.technical.mustIntegrate', label: 'Must Integrate Systems' },
  { path: 'constraints.technical.cannotChange', label: 'Cannot Change Systems' },
  { path: 'constraints.technical.preferences', label: 'Technical Preferences' },
] as const;

const RISK_CATEGORIES: RiskFactor['category'][] = [
  'Technical',
  'Organizational',
  'Commercial',
  'Timeline',
];
const RISK_LEVELS: RiskFactor['likelihood'][] = ['Low', 'Medium', 'High'];

const EMPLOYEE_SIZE_BUCKETS: Array<{ max: number; value: string }> = [
  { max: 10, value: '1-10' },
  { max: 50, value: '11-50' },
  { max: 200, value: '51-200' },
  { max: 500, value: '201-500' },
];

const isFilledValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).some(isFilledValue);
  return true;
};

const toClientProfile = (row: ClientProfileRow): ClientProfile => ({
  id: row.id,
  workspaceId: row.workspace_id,
  companyLegalName: row.company_legal_name,
  companyDba: row.company_dba ?? undefined,
  annualRevenueRange: row.annual_revenue_range ?? '',
  employeeCount: row.employee_count ?? undefined,
  officeFieldSplit: row.office_field_split ?? undefined,
  activeProjectCount: row.active_project_count ?? undefined,
  geographicFootprint: row.geographic_footprint ?? '',
  growthTrajectory: row.growth_trajectory ?? undefined,
  currentSystems: row.current_systems ?? [],
  itMaturity: row.it_maturity ?? undefined,
  previousImplementations: row.previous_implementations ?? undefined,
  assignedAdvisorId: row.assigned_advisor_id ?? '',
  primaryContactName: row.primary_contact_name,
  primaryContactEmail: row.primary_contact_email,
  primaryContactRole: row.primary_contact_role ?? undefined,
  discoveryCallDate: row.discovery_call_date ?? undefined,
  discoveryCallNotes: row.discovery_call_notes ?? undefined,
  documentsReceived: row.documents_received ?? undefined,
  onboardingStatus: row.onboarding_status ?? 'Pending Setup',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapEmployeeCountToCompanySize = (count: number | null): string => {
  if (typeof count !== 'number' || Number.isNaN(count) || count < 1) return '';
  const bucket = EMPLOYEE_SIZE_BUCKETS.find((item) => count <= item.max);
  return bucket?.value ?? '500+';
};

const extractIndustryFromNotes = (notes: string | null): string => {
  if (!notes) return '';
  const match = notes.match(/Industry Segment:\s*(.+)/i);
  return match?.[1]?.trim() ?? '';
};

const normalizeIntakeValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(', ');
  }
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return JSON.stringify(value);
  return '';
};

const inferRequirementCategory = (questionId: string): BriefRequirement['category'] => {
  const normalized = questionId.toLowerCase();
  if (normalized.includes('integrat')) return 'Integration';
  if (normalized.includes('training')) return 'Training';
  if (normalized.includes('support')) return 'Support';
  if (
    normalized.includes('technical') ||
    normalized.includes('system') ||
    normalized.includes('data') ||
    normalized.includes('platform')
  ) {
    return 'Technical';
  }
  return 'Functional';
};

const createRiskFactor = (): RiskFactor => ({
  id: globalThis.crypto?.randomUUID?.() ?? `risk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  category: 'Technical',
  description: '',
  likelihood: 'Medium',
  impact: 'Medium',
  mitigation: '',
  source: 'Sablecrest Identified',
});

const buildFieldSources = (formData: BriefFormData): Record<string, FieldSource> => {
  const fieldSources: Record<string, FieldSource> = {};
  const markedForClient = formData.fieldMarkedForClient ?? {};

  const addFieldSource = (path: string, value: unknown) => {
    if (!isFilledValue(value)) return;
    fieldSources[path] = {
      source: 'advisor',
      confirmedByClient: false,
      markedForClientInput: Boolean(markedForClient[path]),
    };
  };

  addFieldSource('projectTypeId', formData.projectTypeId);
  addFieldSource('customProjectType', formData.customProjectType);
  addFieldSource('advisorNotes', formData.advisorNotes);
  addFieldSource('discoveryNotes', formData.discoveryNotes);

  Object.entries(formData.businessContext).forEach(([key, value]) =>
    addFieldSource(`businessContext.${key}`, value)
  );
  Object.entries(formData.intakeResponses).forEach(([key, value]) =>
    addFieldSource(`intakeResponses.${key}`, value)
  );

  addFieldSource('constraints.budget.min', formData.constraints.budget.min);
  addFieldSource('constraints.budget.max', formData.constraints.budget.max);
  addFieldSource('constraints.budget.flexibility', formData.constraints.budget.flexibility);
  addFieldSource('constraints.timeline.urgency', formData.constraints.timeline.urgency);
  addFieldSource('constraints.timeline.hardDeadline', formData.constraints.timeline.hardDeadline);
  addFieldSource('constraints.timeline.reason', formData.constraints.timeline.reason);
  addFieldSource('constraints.sensitivity.level', formData.constraints.sensitivity.level);
  addFieldSource('constraints.sensitivity.concerns', formData.constraints.sensitivity.concerns);
  addFieldSource('constraints.technical.mustIntegrate', formData.constraints.technical.mustIntegrate);
  addFieldSource('constraints.technical.cannotChange', formData.constraints.technical.cannotChange);
  addFieldSource('constraints.technical.preferences', formData.constraints.technical.preferences);

  formData.successCriteria.forEach((criterion, index) =>
    addFieldSource(`successCriteria.${index}`, criterion)
  );
  formData.riskFactors.forEach((risk, index) => addFieldSource(`riskFactors.${index}`, risk));

  return fieldSources;
};

const buildRequirementsFromIntake = (
  projectType: AECProjectType | null,
  formData: BriefFormData
): BriefRequirement[] => {
  if (formData.projectTypeId === 'other') {
    const freeformRequirement = formData.intakeResponses['general-requirements'];
    if (typeof freeformRequirement !== 'string' || freeformRequirement.trim().length === 0) {
      return [];
    }

    return [
      {
        id: globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}-custom`,
        category: 'Functional',
        priority: 'Must Have',
        description: freeformRequirement.trim(),
        source: 'User',
      },
    ];
  }

  if (!projectType) return [];

  return projectType.intakeQuestions
    .map((question) => {
      const answer = formData.intakeResponses[question.id];
      const normalizedAnswer = normalizeIntakeValue(answer).trim();
      if (normalizedAnswer.length === 0) return null;

      return {
        id: globalThis.crypto?.randomUUID?.() ?? `req-${question.id}-${Math.random().toString(36).slice(2, 8)}`,
        category: inferRequirementCategory(question.id),
        priority: (question.required ? 'Must Have' : 'Should Have') as BriefRequirement['priority'],
        description: `${question.question}: ${normalizedAnswer}`,
        source: 'User' as const,
      } satisfies BriefRequirement;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null) as BriefRequirement[];
};

export default function AdminBriefCreator() {
  const navigate = useNavigate();
  const { clientId: routeClientId } = useParams<{ clientId?: string }>();
  const { user, loading: authLoading, isOpsOrAdmin } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<BriefFormData>(INITIAL_FORM_DATA);
  const [stepValidity, setStepValidity] = useState<Record<string, boolean>>({
    projectType: true,
    businessContext: true,
    requirements: true,
    successCriteria: true,
    constraints: true,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(routeClientId ?? '');
  const [clientSearch, setClientSearch] = useState('');
  const [prefilledClientId, setPrefilledClientId] = useState<string | null>(null);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<SaveMode | null>(null);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [lastSavedBrief, setLastSavedBrief] = useState<Pick<ImplementationBrief, 'id' | 'status'> | null>(null);

  const selectedProjectType = useMemo(
    () => aecProjectTypes.find((projectType) => projectType.id === formData.projectTypeId) ?? null,
    [formData.projectTypeId]
  );

  const filteredClientOptions = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return clientOptions;
    return clientOptions.filter((option) => {
      const company = option.profile.companyLegalName.toLowerCase();
      const email = option.profile.primaryContactEmail.toLowerCase();
      return company.includes(query) || email.includes(query);
    });
  }, [clientOptions, clientSearch]);

  const selectedClientOption = useMemo(
    () => clientOptions.find((option) => option.profile.id === selectedClientId) ?? null,
    [clientOptions, selectedClientId]
  );

  const selectedClientName = selectedClientOption?.profile.companyLegalName ?? '';
  const selectedWorkspaceId = selectedClientOption?.profile.workspaceId ?? '';

  const requirementToggleFields = useMemo(() => {
    if (formData.projectTypeId === 'other') {
      return [{ path: 'intakeResponses.general-requirements', label: 'General Requirements' }];
    }

    if (!selectedProjectType) return [];

    return selectedProjectType.intakeQuestions.map((question) => ({
      path: `intakeResponses.${question.id}`,
      label: question.question,
    }));
  }, [formData.projectTypeId, selectedProjectType]);

  const subtitle = routeClientId
    ? selectedClientName
      ? `for ${selectedClientName}`
      : 'for selected client'
    : 'Create and prepare a client-ready implementation brief.';

  const updateFormData = useCallback((updates: Partial<BriefFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const setStepIsValid = useCallback((step: string, value: boolean) => {
    setStepValidity((prev) => {
      if (prev[step] === value) return prev;
      return { ...prev, [step]: value };
    });
  }, []);

  const clearValidationError = useCallback((fieldKey: string) => {
    setValidationErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, []);

  const updateFieldNeedsClientInput = useCallback(
    (fieldPath: string, checked: boolean) => {
      updateFormData({
        fieldMarkedForClient: {
          ...(formData.fieldMarkedForClient ?? {}),
          [fieldPath]: checked,
        },
      });
    },
    [formData.fieldMarkedForClient, updateFormData]
  );

  const isFieldMarkedForClientInput = useCallback(
    (fieldPath: string) => Boolean(formData.fieldMarkedForClient?.[fieldPath]),
    [formData.fieldMarkedForClient]
  );

  const prefillFromClient = useCallback(
    (clientRow: ClientProfileRow) => {
      const inferredIndustry = extractIndustryFromNotes(clientRow.discovery_call_notes);

      setFormData((prev) => ({
        ...prev,
        businessContext: {
          ...prev.businessContext,
          companyName: clientRow.company_legal_name || prev.businessContext.companyName,
          companySize: mapEmployeeCountToCompanySize(clientRow.employee_count) || prev.businessContext.companySize,
          industry: inferredIndustry || prev.businessContext.industry,
        },
        discoveryNotes: clientRow.discovery_call_notes ?? prev.discoveryNotes ?? '',
        constraints: {
          ...prev.constraints,
          technical: {
            ...prev.constraints.technical,
            mustIntegrate:
              clientRow.current_systems && clientRow.current_systems.length > 0
                ? clientRow.current_systems
                : prev.constraints.technical.mustIntegrate,
          },
        },
      }));
    },
    []
  );

  const fetchClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const db = supabase as any;
      const { data, error } = await db
        .from('client_profiles')
        .select('*')
        .order('company_legal_name', { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as ClientProfileRow[];
      const options = rows.map((row) => ({
        row,
        profile: toClientProfile(row),
      }));

      setClientOptions(options);

      if (routeClientId) {
        const routeClient = options.find((option) => option.profile.id === routeClientId);
        if (routeClient) {
          setSelectedClientId(routeClient.profile.id);
        } else {
          toast({
            title: 'Client not found',
            description: 'The requested client profile could not be loaded.',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Unable to load clients',
        description: error?.message ?? 'Failed to load client profiles.',
        variant: 'destructive',
      });
    } finally {
      setClientsLoading(false);
    }
  }, [routeClientId, toast]);

  useEffect(() => {
    if (authLoading) return;
    if (!isOpsOrAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isOpsOrAdmin, navigate]);

  useEffect(() => {
    if (authLoading || !isOpsOrAdmin) return;
    void fetchClients();
  }, [authLoading, fetchClients, isOpsOrAdmin]);

  useEffect(() => {
    if (!selectedClientOption) return;
    if (prefilledClientId === selectedClientOption.profile.id) return;

    prefillFromClient(selectedClientOption.row);
    setPrefilledClientId(selectedClientOption.profile.id);
  }, [prefilledClientId, prefillFromClient, selectedClientOption]);

  useEffect(() => {
    const hasNonAdvisorSource = formData.successCriteria.some((criterion) => criterion.source !== 'advisor');
    if (!hasNonAdvisorSource) return;

    updateFormData({
      successCriteria: formData.successCriteria.map((criterion) => ({
        ...criterion,
        source: 'advisor',
      })),
    });
  }, [formData.successCriteria, updateFormData]);

  const addRisk = () => {
    updateFormData({ riskFactors: [...formData.riskFactors, createRiskFactor()] });
  };

  const removeRisk = (riskId: string) => {
    updateFormData({ riskFactors: formData.riskFactors.filter((risk) => risk.id !== riskId) });
  };

  const updateRisk = (riskId: string, updates: Partial<RiskFactor>) => {
    updateFormData({
      riskFactors: formData.riskFactors.map((risk) =>
        risk.id === riskId
          ? {
              ...risk,
              ...updates,
              source: 'Sablecrest Identified',
            }
          : risk
      ),
    });
  };

  const resolveOwnerId = useCallback(
    async (clientRow: ClientProfileRow): Promise<string> => {
      if (!user) return '';
      const contactEmail = clientRow.primary_contact_email?.trim().toLowerCase();
      if (!contactEmail) return user.id;

      try {
        const db = supabase as any;
        const { data } = await db
          .from('profiles')
          .select('id')
          .eq('email', contactEmail)
          .maybeSingle();

        return data?.id ?? user.id;
      } catch {
        return user.id;
      }
    },
    [user]
  );

  const buildBriefTitle = useCallback(() => {
    const companyName =
      formData.businessContext.companyName.trim() || selectedClientOption?.profile.companyLegalName || 'Client';
    const projectName =
      formData.projectTypeId === 'other'
        ? formData.customProjectType?.trim()
        : selectedProjectType?.name;

    if (projectName && projectName.length > 0) {
      return `${companyName} — ${projectName}`;
    }
    return `${companyName} — Implementation Brief`;
  }, [
    formData.businessContext.companyName,
    formData.customProjectType,
    formData.projectTypeId,
    selectedClientOption?.profile.companyLegalName,
    selectedProjectType?.name,
  ]);

  const saveBrief = useCallback(
    async (status: SaveStatus) => {
      if (!user) {
        toast({
          title: 'Sign in required',
          description: 'You must be signed in to create a brief.',
          variant: 'destructive',
        });
        return;
      }

      if (!selectedClientOption || !selectedWorkspaceId) {
        toast({
          title: 'Client required',
          description: 'Select a client workspace before saving.',
          variant: 'destructive',
        });
        return;
      }

      if (!formData.projectTypeId) {
        setValidationErrors((prev) => ({
          ...prev,
          projectTypeId: 'Select a project type before saving.',
        }));
        toast({
          title: 'Project type required',
          description: 'Select a project type before saving.',
          variant: 'destructive',
        });
        return;
      }

      const mode: SaveMode = status === 'Advisor Draft' ? 'draft' : 'clientReview';
      setSaveMode(mode);

      try {
        const ownerId = await resolveOwnerId(selectedClientOption.row);
        const requirements = buildRequirementsFromIntake(selectedProjectType, formData);
        const successCriteria: SuccessCriterion[] = formData.successCriteria.map((criterion) => ({
          ...criterion,
          source: 'advisor',
          confirmedByClient: false,
        }));
        const riskFactors: RiskFactor[] = formData.riskFactors.map((risk) => ({
          ...risk,
          source: 'Sablecrest Identified',
        }));
        const fieldSources = buildFieldSources(formData);

        const payload = {
          workspace_id: selectedWorkspaceId,
          title: buildBriefTitle(),
          project_type_id:
            formData.projectTypeId === 'other'
              ? formData.customProjectType?.trim() || 'other'
              : formData.projectTypeId,
          status,
          business_context: formData.businessContext,
          requirements,
          success_criteria: successCriteria,
          constraints: formData.constraints,
          risk_factors: riskFactors,
          intake_responses: formData.intakeResponses,
          advisor_id: user.id,
          owner_id: ownerId || user.id,
          advisor_notes: formData.advisorNotes?.trim() || null,
          discovery_notes: formData.discoveryNotes?.trim() || null,
          discovery_date: selectedClientOption.row.discovery_call_date || null,
          field_sources: fieldSources,
          client_review_started_at: status === 'Client Review' ? new Date().toISOString() : null,
        };

        const db = supabase as any;
        const { data, error } = briefId
          ? await db
              .from('implementation_briefs')
              .update(payload)
              .eq('id', briefId)
              .select('id,status')
              .single()
          : await db.from('implementation_briefs').insert(payload).select('id,status').single();

        if (error) throw error;

        const nextId = data?.id ?? briefId;
        if (!nextId) {
          throw new Error('Could not determine the saved brief id.');
        }

        setBriefId(nextId);
        setLastSavedBrief({
          id: nextId,
          status: (data?.status ?? status) as ImplementationBrief['status'],
        });

        toast({
          title: status === 'Advisor Draft' ? 'Advisor draft saved' : 'Brief sent to client',
          description:
            status === 'Advisor Draft'
              ? 'The brief is saved as an internal advisor draft.'
              : 'The brief is now visible to the client for guided review.',
        });

        navigate(`/briefs/${nextId}`);
      } catch (error: any) {
        toast({
          title: 'Save failed',
          description: error?.message ?? 'Unable to save the implementation brief.',
          variant: 'destructive',
        });
      } finally {
        setSaveMode(null);
      }
    },
    [
      briefId,
      buildBriefTitle,
      formData,
      navigate,
      resolveOwnerId,
      selectedClientOption,
      selectedProjectType,
      selectedWorkspaceId,
      toast,
      user,
    ]
  );

  const renderFieldToggleRow = (fieldPath: string, label: string) => {
    const checked = isFieldMarkedForClientInput(fieldPath);
    return (
      <div
        key={fieldPath}
        className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{label}</span>
          {checked && <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`toggle-${fieldPath}`} className="text-xs text-muted-foreground">
            Needs client input
          </Label>
          <Switch
            id={`toggle-${fieldPath}`}
            checked={checked}
            onCheckedChange={(value) => updateFieldNeedsClientInput(fieldPath, value)}
            className="h-5 w-9"
          />
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Create Implementation Brief" description="Loading advisor context..." />
      </div>
    );
  }

  if (!isOpsOrAdmin) {
    return null;
  }

  return (
    <div className="page-container">
      <PageHeader title="Create Implementation Brief" description={subtitle} />

      <div className="page-content pb-28 space-y-6">
        {!routeClientId && (
          <Card>
            <CardHeader>
              <CardTitle>Client Selection</CardTitle>
              <CardDescription>
                Pick the client workspace where this brief will be created.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="client-search">Search clients</Label>
                <Input
                  id="client-search"
                  value={clientSearch}
                  onChange={(event) => setClientSearch(event.target.value)}
                  placeholder="Search by company or contact email..."
                />
              </div>
              <div className="space-y-1">
                <Label>Select client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={clientsLoading ? 'Loading clients...' : 'Select a client profile...'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClientOptions.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No clients available
                      </SelectItem>
                    ) : (
                      filteredClientOptions.map((option) => (
                        <SelectItem key={option.profile.id} value={option.profile.id}>
                          {option.profile.companyLegalName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        <Accordion
          type="multiple"
          defaultValue={[
            'project-type',
            'business-context',
            'requirements',
            'success-criteria',
            'constraints',
            'risk-assessment',
            'advisor-notes',
          ]}
          className="rounded-lg border border-border bg-card px-4"
        >
          <AccordionItem value="project-type">
            <AccordionTrigger>Section 1: Project Type</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <ProjectTypeStep
                formData={formData}
                updateFormData={updateFormData}
                isValid={stepValidity.projectType}
                setIsValid={(value) => setStepIsValid('projectType', value)}
                projectTypeError={validationErrors.projectTypeId}
                clearProjectTypeError={() => clearValidationError('projectTypeId')}
              />

              <div className="space-y-1">
                <Label htmlFor="project-type-rationale">Project Type Rationale (internal)</Label>
                <Textarea
                  id="project-type-rationale"
                  value={formData.advisorNotes ?? ''}
                  onChange={(event) => updateFormData({ advisorNotes: event.target.value })}
                  placeholder="Why this project type best fits the discovery call context..."
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="business-context">
            <AccordionTrigger>Section 2: Business Context</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <BusinessContextStep
                formData={formData}
                updateFormData={updateFormData}
                isValid={stepValidity.businessContext}
                setIsValid={(value) => setStepIsValid('businessContext', value)}
                validationErrors={validationErrors}
                clearValidationError={clearValidationError}
              />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Client confirmation flags</CardTitle>
                  <CardDescription className="text-xs">
                    Mark fields that need client confirmation during guided review.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {CONTEXT_FIELD_TOGGLES.map((field) => renderFieldToggleRow(field.path, field.label))}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="requirements">
            <AccordionTrigger>Section 3: Requirements</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <RequirementsStep
                formData={formData}
                updateFormData={updateFormData}
                isValid={stepValidity.requirements}
                setIsValid={(value) => setStepIsValid('requirements', value)}
                validationErrors={validationErrors}
                clearValidationError={clearValidationError}
              />

              {requirementToggleFields.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Client confirmation flags</CardTitle>
                    <CardDescription className="text-xs">
                      Flag intake items that should be confirmed by the client.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {requirementToggleFields.map((field) =>
                      renderFieldToggleRow(field.path, field.label)
                    )}
                  </CardContent>
                </Card>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="success-criteria">
            <AccordionTrigger>Section 4: Success Criteria</AccordionTrigger>
            <AccordionContent>
              <SuccessCriteriaStep
                formData={formData}
                updateFormData={updateFormData}
                isValid={stepValidity.successCriteria}
                setIsValid={(value) => setStepIsValid('successCriteria', value)}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="constraints">
            <AccordionTrigger>Section 5: Constraints</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <ConstraintsStep
                formData={formData}
                updateFormData={updateFormData}
                isValid={stepValidity.constraints}
                setIsValid={(value) => setStepIsValid('constraints', value)}
              />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Client confirmation flags</CardTitle>
                  <CardDescription className="text-xs">
                    Flag constraints that should be validated by the client.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {CONSTRAINT_FIELD_TOGGLES.map((field) => renderFieldToggleRow(field.path, field.label))}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="risk-assessment">
            <AccordionTrigger>Section 6: Risk Assessment</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">Risk Assessment</h3>
                <p className="text-sm text-muted-foreground">
                  Based on the discovery call, identify potential risks for this implementation. These
                  are internal and will inform matching, but the descriptions may be shared with the
                  client.
                </p>
              </div>

              <div className="space-y-4">
                {formData.riskFactors.map((risk) => (
                  <Card key={risk.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Risk Item</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRisk(risk.id)}
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                          <Label>Category</Label>
                          <Select
                            value={risk.category}
                            onValueChange={(value) =>
                              updateRisk(risk.id, { category: value as RiskFactor['category'] })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                            <SelectContent>
                              {RISK_CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label>Likelihood</Label>
                          <Select
                            value={risk.likelihood}
                            onValueChange={(value) =>
                              updateRisk(risk.id, { likelihood: value as RiskFactor['likelihood'] })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select likelihood..." />
                            </SelectTrigger>
                            <SelectContent>
                              {RISK_LEVELS.map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label>Impact</Label>
                          <Select
                            value={risk.impact}
                            onValueChange={(value) =>
                              updateRisk(risk.id, { impact: value as RiskFactor['impact'] })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select impact..." />
                            </SelectTrigger>
                            <SelectContent>
                              {RISK_LEVELS.map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label>Description</Label>
                        <Textarea
                          value={risk.description}
                          onChange={(event) =>
                            updateRisk(risk.id, { description: event.target.value })
                          }
                          placeholder="Describe the risk and why it matters."
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Mitigation (optional)</Label>
                        <Textarea
                          value={risk.mitigation ?? ''}
                          onChange={(event) =>
                            updateRisk(risk.id, { mitigation: event.target.value })
                          }
                          placeholder="Suggested mitigation approach."
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button type="button" variant="outline" onClick={addRisk}>
                Add Risk
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="advisor-notes">
            <AccordionTrigger>Section 7: Advisor Notes</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="advisor-discovery-notes">Discovery Call Notes</Label>
                <Textarea
                  id="advisor-discovery-notes"
                  rows={10}
                  value={formData.discoveryNotes ?? ''}
                  onChange={(event) => updateFormData({ discoveryNotes: event.target.value })}
                  placeholder="Paste discovery call notes, context, priorities, and constraints."
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="advisor-assessment">Advisor Assessment</Label>
                <Textarea
                  id="advisor-assessment"
                  value={formData.advisorNotes ?? ''}
                  onChange={(event) => updateFormData({ advisorNotes: event.target.value })}
                  placeholder="Your overall assessment: engagement complexity, client readiness, risk flags, initial provider ideas, recommended approach."
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="sticky bottom-0 z-20 border-t bg-background/95 backdrop-blur">
        <div className="page-content py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {lastSavedBrief
                ? `Last saved brief: ${lastSavedBrief.id} (${lastSavedBrief.status})`
                : 'Brief status: Not yet saved'}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={saveMode !== null}>
                Cancel
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmSendOpen(true)}
                disabled={saveMode !== null || !selectedClientOption}
              >
                {saveMode === 'clientReview' ? 'Saving...' : 'Save & Send to Client'}
              </Button>

              <Button
                type="button"
                onClick={() => void saveBrief('Advisor Draft')}
                disabled={saveMode !== null || !selectedClientOption}
              >
                {saveMode === 'draft' ? 'Saving...' : 'Save as Advisor Draft'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send brief to client review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the brief visible to the client for review. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void saveBrief('Client Review');
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
