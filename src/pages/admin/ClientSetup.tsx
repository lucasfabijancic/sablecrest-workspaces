import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { ToastAction } from '@/components/ui/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type GrowthTrajectory =
  | 'Stable'
  | 'Moderate Growth'
  | 'Rapid Growth'
  | 'Acquisition-Driven'
  | 'Contraction';

type ItMaturity = 'No IT Staff' | 'IT Generalist' | 'IT Team' | 'IT Department';

interface ClientSetupFormData {
  companyLegalName: string;
  companyDba: string;
  annualRevenueRange: string;
  employeeCount: string;
  officeFieldSplit: string;
  activeProjectCount: string;
  geographicFootprint: string;
  growthTrajectory: GrowthTrajectory | '';
  industrySegment: string;
  otherIndustrySegment: string;
  currentSystems: string[];
  currentSystemInput: string;
  itMaturity: ItMaturity | '';
  previousImplementations: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactRole: string;
  discoveryCallDate: string;
  discoveryCallNotes: string;
  documentsReceived: string;
  assignedAdvisorName: string;
}

const ANNUAL_REVENUE_OPTIONS = [
  '$5M - $30M',
  '$30M - $100M',
  '$100M - $250M',
  '$250M - $500M',
  '$500M+',
] as const;

const GROWTH_TRAJECTORY_OPTIONS: GrowthTrajectory[] = [
  'Stable',
  'Moderate Growth',
  'Rapid Growth',
  'Acquisition-Driven',
  'Contraction',
];

const INDUSTRY_SEGMENT_OPTIONS = [
  'General Contractor',
  'Specialty Contractor',
  'Civil/Heavy',
  'Residential Builder',
  'Commercial Developer',
  'Engineering Firm',
  'Architecture Firm',
  'Owner/Operator',
  'Other',
] as const;

const IT_MATURITY_OPTIONS: ItMaturity[] = ['No IT Staff', 'IT Generalist', 'IT Team', 'IT Department'];

const CURRENT_SYSTEM_SUGGESTIONS = [
  'Sage 300 CRE',
  'Viewpoint Vista',
  'CMiC',
  'Procore',
  'PlanGrid',
  'Bluebeam',
  'QuickBooks',
  'ADP',
  'Paylocity',
  'Foundation Software',
  'Trimble',
  'Autodesk',
  'Microsoft Dynamics',
  'SAP',
  'Spectrum',
  'Jonas Construction',
] as const;

const INITIAL_FORM_DATA: ClientSetupFormData = {
  companyLegalName: '',
  companyDba: '',
  annualRevenueRange: '',
  employeeCount: '',
  officeFieldSplit: '',
  activeProjectCount: '',
  geographicFootprint: '',
  growthTrajectory: '',
  industrySegment: '',
  otherIndustrySegment: '',
  currentSystems: [],
  currentSystemInput: '',
  itMaturity: '',
  previousImplementations: '',
  primaryContactName: '',
  primaryContactEmail: '',
  primaryContactRole: '',
  discoveryCallDate: '',
  discoveryCallNotes: '',
  documentsReceived: '',
  assignedAdvisorName: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const toNullIfEmpty = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseDelimitedList = (value: string): string[] =>
  value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export default function ClientSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isOpsOrAdmin, refreshWorkspaces, setCurrentWorkspace } = useAuth();

  const [formData, setFormData] = useState<ClientSetupFormData>(INITIAL_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isOpsOrAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isOpsOrAdmin, navigate]);

  const suggestedSystems = useMemo(
    () =>
      CURRENT_SYSTEM_SUGGESTIONS.filter(
        (suggestion) =>
          !formData.currentSystems.some((system) => system.toLowerCase() === suggestion.toLowerCase())
      ),
    [formData.currentSystems]
  );

  const updateForm = <K extends keyof ClientSetupFormData>(field: K, value: ClientSetupFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const addCurrentSystem = (value: string) => {
    const nextValue = value.trim();
    if (!nextValue) return;

    const alreadyExists = formData.currentSystems.some(
      (system) => system.toLowerCase() === nextValue.toLowerCase()
    );

    if (alreadyExists) {
      updateForm('currentSystemInput', '');
      return;
    }

    updateForm('currentSystems', [...formData.currentSystems, nextValue]);
    updateForm('currentSystemInput', '');
  };

  const removeCurrentSystem = (value: string) => {
    updateForm(
      'currentSystems',
      formData.currentSystems.filter((system) => system !== value)
    );
  };

  const handleCurrentSystemKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addCurrentSystem(formData.currentSystemInput);
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.companyLegalName.trim()) {
      nextErrors.companyLegalName = 'Company Legal Name is required.';
    }
    if (!formData.primaryContactName.trim()) {
      nextErrors.primaryContactName = 'Contact Name is required.';
    }
    if (!formData.primaryContactEmail.trim()) {
      nextErrors.primaryContactEmail = 'Contact Email is required.';
    } else if (!EMAIL_REGEX.test(formData.primaryContactEmail.trim())) {
      nextErrors.primaryContactEmail = 'Enter a valid email address.';
    }
    if (formData.industrySegment === 'Other' && !formData.otherIndustrySegment.trim()) {
      nextErrors.otherIndustrySegment = 'Please specify the industry segment.';
    }

    return nextErrors;
  };

  const buildDiscoveryCallNotes = () => {
    const notes: string[] = [];
    const selectedIndustry =
      formData.industrySegment === 'Other'
        ? formData.otherIndustrySegment.trim()
        : formData.industrySegment.trim();

    if (selectedIndustry) {
      notes.push(`Industry Segment: ${selectedIndustry}`);
    }
    if (formData.assignedAdvisorName.trim()) {
      notes.push(`Assigned Advisor: ${formData.assignedAdvisorName.trim()}`);
    }
    if (formData.discoveryCallNotes.trim()) {
      if (notes.length > 0) {
        notes.push('');
      }
      notes.push(formData.discoveryCallNotes.trim());
    }

    return notes.join('\n');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error('You must be signed in to create a client workspace.');
      }

      const workspaceName = formData.companyDba.trim() || formData.companyLegalName.trim();

      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({ name: workspaceName })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      const { error: membershipError } = await supabase.from('memberships').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'admin',
      });

      if (membershipError) throw membershipError;

      const db = supabase as any;
      const discoveryNotes = buildDiscoveryCallNotes();

      const { error: profileError } = await db.from('client_profiles').insert({
        workspace_id: workspace.id,
        company_legal_name: formData.companyLegalName.trim(),
        company_dba: toNullIfEmpty(formData.companyDba),
        annual_revenue_range: toNullIfEmpty(formData.annualRevenueRange),
        employee_count: parseOptionalNumber(formData.employeeCount),
        office_field_split: toNullIfEmpty(formData.officeFieldSplit),
        active_project_count: parseOptionalNumber(formData.activeProjectCount),
        geographic_footprint: toNullIfEmpty(formData.geographicFootprint),
        growth_trajectory: formData.growthTrajectory || null,
        current_systems: formData.currentSystems,
        it_maturity: formData.itMaturity || null,
        previous_implementations: toNullIfEmpty(formData.previousImplementations),
        assigned_advisor_id: user.id,
        primary_contact_name: formData.primaryContactName.trim(),
        primary_contact_email: formData.primaryContactEmail.trim().toLowerCase(),
        primary_contact_role: toNullIfEmpty(formData.primaryContactRole),
        discovery_call_date: formData.discoveryCallDate
          ? new Date(`${formData.discoveryCallDate}T00:00:00Z`).toISOString()
          : null,
        discovery_call_notes: discoveryNotes || null,
        documents_received: parseDelimitedList(formData.documentsReceived),
        onboarding_status: 'Brief In Progress',
      });

      if (profileError) throw profileError;

      await refreshWorkspaces();
      setCurrentWorkspace({
        id: workspace.id,
        name: workspace.name,
        created_at: workspace.created_at,
      });

      toast({
        title: 'Client workspace created',
        description: 'Workspace and client profile were created from discovery notes.',
        action: (
          <ToastAction altText="Create Implementation Brief" onClick={() => navigate('/briefs/new')}>
            Create Implementation Brief for this client
          </ToastAction>
        ),
      });

      navigate('/dashboard');
    } catch (error: any) {
      const message = error?.message || 'Failed to create client workspace.';
      setValidationErrors((prev) => ({ ...prev, submit: message }));
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="page-container">
        <PageHeader
          title="New Client Setup"
          description="Create a workspace and profile from discovery call notes."
        />
        <div className="page-content">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Checking access...</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isOpsOrAdmin) {
    return null;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="New Client Setup"
        description="Create a workspace and profile from discovery call notes."
      />

      <div className="page-content">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Core firmographics used to initialize the workspace.</CardDescription>
                </div>
                <Badge variant="outline">Required</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="companyLegalName">Company Legal Name *</Label>
                <Input
                  id="companyLegalName"
                  value={formData.companyLegalName}
                  onChange={(event) => updateForm('companyLegalName', event.target.value)}
                />
                {validationErrors.companyLegalName && (
                  <p className="text-xs text-destructive">{validationErrors.companyLegalName}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="companyDba">DBA / Trade Name</Label>
                <Input
                  id="companyDba"
                  value={formData.companyDba}
                  onChange={(event) => updateForm('companyDba', event.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Annual Revenue Range</Label>
                <Select
                  value={formData.annualRevenueRange || undefined}
                  onValueChange={(value) => updateForm('annualRevenueRange', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select annual revenue range..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ANNUAL_REVENUE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="employeeCount">Employee Count</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  min={0}
                  value={formData.employeeCount}
                  onChange={(event) => updateForm('employeeCount', event.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="officeFieldSplit">Office / Field Split</Label>
                <Input
                  id="officeFieldSplit"
                  value={formData.officeFieldSplit}
                  onChange={(event) => updateForm('officeFieldSplit', event.target.value)}
                  placeholder="e.g., 40 office / 160 field"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="activeProjectCount">Active Project Count</Label>
                <Input
                  id="activeProjectCount"
                  type="number"
                  min={0}
                  value={formData.activeProjectCount}
                  onChange={(event) => updateForm('activeProjectCount', event.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="geographicFootprint">Geographic Footprint</Label>
                <Input
                  id="geographicFootprint"
                  value={formData.geographicFootprint}
                  onChange={(event) => updateForm('geographicFootprint', event.target.value)}
                  placeholder="e.g., Southeast US, 3 states"
                />
              </div>

              <div className="space-y-1">
                <Label>Growth Trajectory</Label>
                <Select
                  value={formData.growthTrajectory || undefined}
                  onValueChange={(value) => updateForm('growthTrajectory', value as GrowthTrajectory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select growth trajectory..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GROWTH_TRAJECTORY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Industry Segment</Label>
                <Select
                  value={formData.industrySegment || undefined}
                  onValueChange={(value) => updateForm('industrySegment', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry segment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_SEGMENT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.industrySegment === 'Other' && (
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="otherIndustrySegment">Specify Industry Segment</Label>
                  <Input
                    id="otherIndustrySegment"
                    value={formData.otherIndustrySegment}
                    onChange={(event) => updateForm('otherIndustrySegment', event.target.value)}
                    placeholder="Enter industry segment..."
                  />
                  {validationErrors.otherIndustrySegment && (
                    <p className="text-xs text-destructive">{validationErrors.otherIndustrySegment}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technology Landscape</CardTitle>
              <CardDescription>Capture systems and implementation history.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="currentSystems">Current Systems</Label>
                <div className="flex gap-2">
                  <Input
                    id="currentSystems"
                    value={formData.currentSystemInput}
                    onChange={(event) => updateForm('currentSystemInput', event.target.value)}
                    onKeyDown={handleCurrentSystemKeyDown}
                    placeholder="Type a system and press Enter..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addCurrentSystem(formData.currentSystemInput)}
                  >
                    Add
                  </Button>
                </div>

                {formData.currentSystems.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.currentSystems.map((system) => (
                      <Badge key={system} variant="secondary" className="gap-1 pr-1">
                        {system}
                        <button
                          type="button"
                          onClick={() => removeCurrentSystem(system)}
                          className="rounded px-1 text-xs hover:bg-muted"
                          aria-label={`Remove ${system}`}
                        >
                          x
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestedSystems.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() => addCurrentSystem(suggestion)}
                      className="rounded"
                    >
                      <Badge variant="outline">{suggestion}</Badge>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label>IT Maturity</Label>
                <Select
                  value={formData.itMaturity || undefined}
                  onValueChange={(value) => updateForm('itMaturity', value as ItMaturity)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select IT maturity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {IT_MATURITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="previousImplementations">Previous Implementations</Label>
                <Textarea
                  id="previousImplementations"
                  value={formData.previousImplementations}
                  onChange={(event) => updateForm('previousImplementations', event.target.value)}
                  placeholder="Describe any past implementation attempts, especially failures or challenges..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Primary Contact</CardTitle>
              <CardDescription>Main client contact for guided review and coordination.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="primaryContactName">Contact Name *</Label>
                <Input
                  id="primaryContactName"
                  value={formData.primaryContactName}
                  onChange={(event) => updateForm('primaryContactName', event.target.value)}
                />
                {validationErrors.primaryContactName && (
                  <p className="text-xs text-destructive">{validationErrors.primaryContactName}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="primaryContactEmail">Contact Email *</Label>
                <Input
                  id="primaryContactEmail"
                  type="email"
                  value={formData.primaryContactEmail}
                  onChange={(event) => updateForm('primaryContactEmail', event.target.value)}
                />
                {validationErrors.primaryContactEmail && (
                  <p className="text-xs text-destructive">{validationErrors.primaryContactEmail}</p>
                )}
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="primaryContactRole">Contact Role</Label>
                <Input
                  id="primaryContactRole"
                  value={formData.primaryContactRole}
                  onChange={(event) => updateForm('primaryContactRole', event.target.value)}
                  placeholder="e.g., VP of Operations, CFO, IT Director"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discovery Call</CardTitle>
              <CardDescription>Source notes and artifacts for advisor-led brief creation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="discoveryCallDate">Discovery Call Date</Label>
                <Input
                  id="discoveryCallDate"
                  type="date"
                  value={formData.discoveryCallDate}
                  onChange={(event) => updateForm('discoveryCallDate', event.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="discoveryCallNotes">Discovery Call Notes</Label>
                <Textarea
                  id="discoveryCallNotes"
                  rows={10}
                  value={formData.discoveryCallNotes}
                  onChange={(event) => updateForm('discoveryCallNotes', event.target.value)}
                  placeholder="Paste or write your call notes here. Include: what they need, pain points, budget discussions, timeline drivers, decision makers, non-negotiables, risk flags, and your advisor assessment."
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="documentsReceived">Documents Received</Label>
                <Textarea
                  id="documentsReceived"
                  value={formData.documentsReceived}
                  onChange={(event) => updateForm('documentsReceived', event.target.value)}
                  placeholder="List any documents the client has sent: org charts, vendor proposals, system lists, etc."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advisor Assignment</CardTitle>
              <CardDescription>
                For MVP this is a free-text field. Team-member assignment will become a selector later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <Label htmlFor="assignedAdvisorName">Assigned Advisor</Label>
                <Input
                  id="assignedAdvisorName"
                  value={formData.assignedAdvisorName}
                  onChange={(event) => updateForm('assignedAdvisorName', event.target.value)}
                  placeholder="Advisor name"
                />
              </div>
            </CardContent>
          </Card>

          {validationErrors.submit && (
            <p className="text-sm text-destructive">{validationErrors.submit}</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Client Workspace'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
