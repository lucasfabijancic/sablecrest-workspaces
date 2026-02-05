import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Save } from 'lucide-react';
import { aecProjectTypes } from '@/data/aecProjectTypes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, title: 'Project Type', description: 'Select the AEC implementation type' },
  { id: 2, title: 'Context', description: 'Business context' },
  { id: 3, title: 'Requirements', description: 'Project-specific intake' },
  { id: 4, title: 'Success Criteria', description: 'Define outcomes' },
  { id: 5, title: 'Constraints', description: 'Budget and technical limits' },
  { id: 6, title: 'Review', description: 'Confirm and lock' },
];

type ValidationErrors = Record<string, string>;

type BusinessContextDraft = {
  companyName: string;
  companySize: string;
  industry: string;
  currentState: string;
  desiredOutcome: string;
  keyStakeholders: string;
  decisionTimeline: string;
};

type SuccessCriterionDraft = {
  metric: string;
  target: string;
  measurementMethod: string;
  timeframe: string;
};

type ConstraintsDraft = {
  budget: { min?: number; max?: number; flexibility: 'Firm' | 'Flexible' };
  timeline: { urgency: string; hardDeadline?: string; reason?: string };
  sensitivity: { level: string; concerns: string[] };
  technical: { mustIntegrate: string[]; cannotChange: string[]; preferences: string[] };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export default function NewBrief() {
  const { currentWorkspace, user, isUiShellMode } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [briefId, setBriefId] = useState<string | null>(null);

  // Step 1 - Project Type
  const [selectedProjectTypeId, setSelectedProjectTypeId] = useState('');

  // Step 2 - Context
  const [businessContext, setBusinessContext] = useState<BusinessContextDraft>({
    companyName: '',
    companySize: '',
    industry: '',
    currentState: '',
    desiredOutcome: '',
    keyStakeholders: '',
    decisionTimeline: '',
  });

  // Step 3 - Requirements (intake responses)
  const [intakeResponses, setIntakeResponses] = useState<Record<string, string | number | string[]>>({});

  // Step 4 - Success Criteria
  const [successCriteria] = useState<SuccessCriterionDraft[]>([]);

  // Step 5 - Constraints
  const [constraints] = useState<ConstraintsDraft>({
    budget: { min: undefined, max: undefined, flexibility: 'Flexible' },
    timeline: { urgency: '', hardDeadline: '', reason: '' },
    sensitivity: { level: '', concerns: [] },
    technical: { mustIntegrate: [], cannotChange: [], preferences: [] },
  });

  const selectedProjectType = useMemo(
    () => aecProjectTypes.find((type) => type.id === selectedProjectTypeId),
    [selectedProjectTypeId]
  );
  const intakeQuestions = selectedProjectType?.intakeQuestions ?? [];

  const isQuestionAnswered = (question: (typeof intakeQuestions)[number], value: unknown) => {
    switch (question.type) {
      case 'multiselect':
        return Array.isArray(value) && value.length > 0;
      case 'number':
        if (value === '' || value === null || value === undefined) return false;
        if (typeof value === 'number') return !Number.isNaN(value);
        if (typeof value === 'string') return value.trim().length > 0 && !Number.isNaN(Number(value));
        return false;
      case 'select':
      case 'text':
      case 'textarea':
        return typeof value === 'string' && value.trim().length > 0;
      default:
        return Boolean(value);
    }
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      return Boolean(selectedProjectTypeId);
    }
    if (currentStep === 2) {
      return (
        businessContext.companyName.trim().length > 0 &&
        businessContext.currentState.trim().length > 0 &&
        businessContext.desiredOutcome.trim().length > 0
      );
    }
    if (currentStep === 3) {
      return intakeQuestions.every((question) => {
        if (!question.required) return true;
        return isQuestionAnswered(question, intakeResponses[question.id]);
      });
    }
    return true;
  };

  const buildBriefTitle = () => {
    const projectLabel = selectedProjectType?.name || 'Implementation Brief';
    const companyLabel = businessContext.companyName.trim();
    if (companyLabel) {
      return `${companyLabel} — ${projectLabel}`;
    }
    return projectLabel;
  };

  const buildBriefPayload = (status: 'Draft' | 'Locked') => ({
    workspace_id: currentWorkspace?.id ?? '',
    title: buildBriefTitle(),
    project_type_id: selectedProjectTypeId,
    status,
    business_context: businessContext,
    requirements: [],
    success_criteria: successCriteria,
    constraints,
    risk_factors: [],
    intake_responses: intakeResponses,
    locked_at: status === 'Locked' ? new Date().toISOString() : null,
    locked_by: status === 'Locked' ? user?.id ?? null : null,
    owner_id: user?.id ?? null,
  });

  const handleContinue = () => {
    if (!isStepValid()) {
      if (currentStep === 1) {
        setValidationErrors({ projectType: 'Select a project type to continue.' });
      } else if (currentStep === 2) {
        setValidationErrors({
          companyName: businessContext.companyName.trim()
            ? ''
            : 'Company name is required.',
          currentState: businessContext.currentState.trim()
            ? ''
            : 'Describe the current state.',
          desiredOutcome: businessContext.desiredOutcome.trim()
            ? ''
            : 'Define the desired outcome.',
        });
      } else if (currentStep === 3) {
        const nextErrors: ValidationErrors = {};
        intakeQuestions.forEach((question) => {
          if (question.required && !isQuestionAnswered(question, intakeResponses[question.id])) {
            nextErrors[question.id] = 'This field is required.';
          }
        });
        setValidationErrors(nextErrors);
      }
      return;
    }
    setValidationErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSaveDraft = async () => {
    if (isUiShellMode) {
      toast({
        title: 'Not available in UI shell mode',
        description: 'Connect a workspace to save drafts.',
      });
      return;
    }

    if (!user || !currentWorkspace) {
      toast({
        title: 'Missing workspace',
        description: 'Please select a workspace first.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedProjectTypeId) {
      setValidationErrors({ projectType: 'Select a project type to save a draft.' });
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    try {
      const payload = buildBriefPayload('Draft');
      const { data, error } = briefId
        ? await supabase
            .from('implementation_briefs')
            .update(payload)
            .eq('id', briefId)
            .select('id')
            .single()
        : await supabase
            .from('implementation_briefs')
            .insert(payload)
            .select('id')
            .single();

      if (error) throw error;

      if (data?.id) {
        setBriefId(data.id);
      }

      toast({
        title: 'Draft saved',
        description: 'Your implementation brief draft has been saved.',
      });
      navigate('/briefs');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save draft.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLockBrief = async () => {
    if (isUiShellMode) {
      toast({
        title: 'Not available in UI shell mode',
        description: 'Connect a workspace to lock briefs.',
      });
      return;
    }

    if (!user || !currentWorkspace) {
      toast({
        title: 'Missing workspace',
        description: 'Please select a workspace first.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedProjectTypeId) {
      setValidationErrors({ projectType: 'Select a project type to continue.' });
      setCurrentStep(1);
      return;
    }

    if (
      !businessContext.companyName.trim() ||
      !businessContext.currentState.trim() ||
      !businessContext.desiredOutcome.trim()
    ) {
      setValidationErrors({
        companyName: businessContext.companyName.trim()
          ? ''
          : 'Company name is required.',
        currentState: businessContext.currentState.trim()
          ? ''
          : 'Describe the current state.',
        desiredOutcome: businessContext.desiredOutcome.trim()
          ? ''
          : 'Define the desired outcome.',
      });
      setCurrentStep(2);
      return;
    }

    setLoading(true);
    try {
      const payload = buildBriefPayload('Locked');
      const { data, error } = briefId
        ? await supabase
            .from('implementation_briefs')
            .update(payload)
            .eq('id', briefId)
            .select('id')
            .single()
        : await supabase
            .from('implementation_briefs')
            .insert(payload)
            .select('id')
            .single();

      if (error) throw error;

      if (data?.id) {
        setBriefId(data.id);
      }

      toast({
        title: 'Brief locked',
        description: 'Your implementation brief has been locked for matching.',
      });
      navigate('/briefs');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to lock brief.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProjectType = (projectTypeId: string) => {
    setSelectedProjectTypeId(projectTypeId);
    setValidationErrors((prev) => {
      if (!prev.projectType) return prev;
      const { projectType, ...rest } = prev;
      return rest;
    });
  };

  const updateBusinessContext = (updates: Partial<BusinessContextDraft>) => {
    setBusinessContext((prev) => {
      const next = { ...prev, ...updates };
      setValidationErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        if (updates.companyName !== undefined && next.companyName.trim()) {
          delete nextErrors.companyName;
        }
        if (updates.currentState !== undefined && next.currentState.trim()) {
          delete nextErrors.currentState;
        }
        if (updates.desiredOutcome !== undefined && next.desiredOutcome.trim()) {
          delete nextErrors.desiredOutcome;
        }
        return nextErrors;
      });
      return next;
    });
  };

  const updateIntakeResponse = (
    question: (typeof intakeQuestions)[number],
    value: string | number | string[]
  ) => {
    setIntakeResponses((prev) => ({ ...prev, [question.id]: value }));
    if (question.required && isQuestionAnswered(question, value)) {
      setValidationErrors((prevErrors) => {
        if (!prevErrors[question.id]) return prevErrors;
        const nextErrors = { ...prevErrors };
        delete nextErrors[question.id];
        return nextErrors;
      });
    }
  };

  const projectTypeLabel = selectedProjectType?.name ?? 'implementation';

  if (!currentWorkspace) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Please select a workspace first.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link to="/briefs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to briefs
      </Link>

      <h1 className="text-xl font-semibold text-foreground mb-2">New Implementation Brief</h1>
      <p className="text-muted-foreground mb-6">Create a new brief in {currentWorkspace.name}</p>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md',
                currentStep === step.id && 'bg-primary/10',
                currentStep > step.id && 'text-success'
              )}
            >
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium',
                  currentStep === step.id && 'bg-primary text-primary-foreground',
                  currentStep > step.id && 'bg-success text-success-foreground',
                  currentStep < step.id && 'bg-muted text-muted-foreground'
                )}
              >
                {currentStep > step.id ? <Check className="h-3 w-3" /> : step.id}
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  currentStep === step.id && 'text-foreground',
                  currentStep !== step.id && 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-lg p-6">
            {currentStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Select a project type</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose the AEC implementation category that best fits this brief.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aecProjectTypes.map((projectType) => {
                    const isSelected = projectType.id === selectedProjectTypeId;
                    return (
                      <button
                        key={projectType.id}
                        type="button"
                        onClick={() => handleSelectProjectType(projectType.id)}
                        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
                      >
                        <Card
                          className={cn(
                            'h-full transition border',
                            isSelected
                              ? 'border-primary/60 ring-2 ring-primary/30'
                              : 'hover:border-muted-foreground/40'
                          )}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <CardTitle className="text-base">{projectType.name}</CardTitle>
                                <CardDescription className="mt-1">
                                  {projectType.category}
                                </CardDescription>
                              </div>
                              {isSelected && (
                                <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                                  Selected
                                </span>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              {projectType.description}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Budget</span>
                              <span className="text-foreground">
                                {formatCurrency(projectType.typicalBudgetMin)} -{' '}
                                {formatCurrency(projectType.typicalBudgetMax)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Timeline</span>
                              <span className="text-foreground">
                                {projectType.typicalTimelineWeeks.min}-{projectType.typicalTimelineWeeks.max} weeks
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {projectType.commonCapabilities.slice(0, 3).map((capability) => (
                                <span
                                  key={capability}
                                  className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground"
                                >
                                  {capability}
                                </span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </button>
                    );
                  })}
                </div>

                {validationErrors.projectType && (
                  <p className="text-sm text-destructive">{validationErrors.projectType}</p>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Business context</h3>
                  <p className="text-sm text-muted-foreground">
                    Capture the high-level context so we can tailor providers and scope.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="companyName">Company name *</Label>
                    <Input
                      id="companyName"
                      value={businessContext.companyName}
                      onChange={(event) => updateBusinessContext({ companyName: event.target.value })}
                      placeholder="e.g., North Ridge Constructors"
                    />
                    {validationErrors.companyName && (
                      <p className="text-xs text-destructive">{validationErrors.companyName}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label>Company size</Label>
                    <Select
                      value={businessContext.companySize}
                      onValueChange={(value) => updateBusinessContext({ companySize: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size..." />
                      </SelectTrigger>
                      <SelectContent>
                        {['1-10', '11-50', '51-200', '201-500', '500+'].map((size) => (
                          <SelectItem key={size} value={size}>
                            {size} employees
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Industry segment</Label>
                    <Select
                      value={businessContext.industry}
                      onValueChange={(value) => updateBusinessContext({ industry: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select segment..." />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'General Contractor',
                          'Specialty Contractor',
                          'Civil/Heavy',
                          'Residential Builder',
                          'Commercial Developer',
                          'Engineering Firm',
                          'Architecture Firm',
                          'Owner/Operator',
                        ].map((segment) => (
                          <SelectItem key={segment} value={segment}>
                            {segment}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Decision timeline</Label>
                    <Select
                      value={businessContext.decisionTimeline}
                      onValueChange={(value) => updateBusinessContext({ decisionTimeline: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline..." />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'Ready to decide now',
                          'Within 2 weeks',
                          'Within 1 month',
                          'Within 3 months',
                          'Just exploring',
                        ].map((timeline) => (
                          <SelectItem key={timeline} value={timeline}>
                            {timeline}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="currentState">Current state *</Label>
                  <Textarea
                    id="currentState"
                    value={businessContext.currentState}
                    onChange={(event) => updateBusinessContext({ currentState: event.target.value })}
                    placeholder="Describe your current systems and processes..."
                    className="min-h-[110px]"
                  />
                  {validationErrors.currentState && (
                    <p className="text-xs text-destructive">{validationErrors.currentState}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="desiredOutcome">Desired outcome *</Label>
                  <Textarea
                    id="desiredOutcome"
                    value={businessContext.desiredOutcome}
                    onChange={(event) => updateBusinessContext({ desiredOutcome: event.target.value })}
                    placeholder="What does success look like?"
                    className="min-h-[110px]"
                  />
                  {validationErrors.desiredOutcome && (
                    <p className="text-xs text-destructive">{validationErrors.desiredOutcome}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="keyStakeholders">Key stakeholders</Label>
                  <Input
                    id="keyStakeholders"
                    value={businessContext.keyStakeholders}
                    onChange={(event) => updateBusinessContext({ keyStakeholders: event.target.value })}
                    placeholder="Who will be involved in this project?"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Tell us about your {projectTypeLabel} project
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    These questions help us tailor the provider match to your requirements.
                  </p>
                </div>

                {intakeQuestions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                    No intake questions available for this project type yet.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {intakeQuestions.map((question) => {
                      const value = intakeResponses[question.id];
                      const hasError = Boolean(validationErrors[question.id]);
                      return (
                        <div key={question.id} className="space-y-2">
                          <Label htmlFor={question.id} className="text-sm">
                            {question.question}
                            {question.required && <span className="text-destructive"> *</span>}
                          </Label>

                          {question.type === 'text' && (
                            <Input
                              id={question.id}
                              value={typeof value === 'string' ? value : ''}
                              onChange={(event) => updateIntakeResponse(question, event.target.value)}
                              placeholder="Enter your response..."
                            />
                          )}

                          {question.type === 'number' && (
                            <Input
                              id={question.id}
                              type="number"
                              value={value === undefined || value === null ? '' : String(value)}
                              onChange={(event) => {
                                const nextValue =
                                  event.target.value === '' ? '' : Number(event.target.value);
                                updateIntakeResponse(question, nextValue);
                              }}
                              placeholder="Enter a number..."
                            />
                          )}

                          {question.type === 'textarea' && (
                            <Textarea
                              id={question.id}
                              value={typeof value === 'string' ? value : ''}
                              onChange={(event) => updateIntakeResponse(question, event.target.value)}
                              placeholder="Add details..."
                              className="min-h-[110px]"
                            />
                          )}

                          {question.type === 'select' && (
                            <Select
                              value={typeof value === 'string' ? value : ''}
                              onValueChange={(nextValue) => updateIntakeResponse(question, nextValue)}
                            >
                              <SelectTrigger id={question.id}>
                                <SelectValue placeholder="Select an option..." />
                              </SelectTrigger>
                              <SelectContent>
                                {(question.options || []).map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {question.type === 'multiselect' && (
                            <div className="space-y-2">
                              {(question.options || []).map((option) => {
                                const selectedValues = Array.isArray(value) ? value : [];
                                const checked = selectedValues.includes(option);
                                return (
                                  <label
                                    key={option}
                                    className="flex items-start gap-2 text-sm text-foreground"
                                  >
                                    <Checkbox
                                      id={`${question.id}-${option}`}
                                      checked={checked}
                                      onCheckedChange={(checkedState) => {
                                        const isChecked = checkedState === true;
                                        const nextValues = isChecked
                                          ? [...selectedValues, option]
                                          : selectedValues.filter((item) => item !== option);
                                        updateIntakeResponse(question, nextValues);
                                      }}
                                      className="mt-0.5"
                                    />
                                    <span>{option}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {question.helpText && (
                            <p className="text-xs text-muted-foreground">{question.helpText}</p>
                          )}
                          {hasError && (
                            <p className="text-xs text-destructive">{validationErrors[question.id]}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                  <p className="text-foreground font-medium mb-2">Coming soon</p>
                  Success criteria definitions will appear here.
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                  <p className="text-foreground font-medium mb-2">Coming soon</p>
                  Budget, timeline, sensitivity, and technical constraints will appear here.
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                  <p className="text-foreground font-medium mb-2">Review</p>
                  A full summary and lock step will appear here.
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              <div className="flex items-center gap-3">
                {currentStep >= 2 && (
                  <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                )}

                {currentStep < steps.length ? (
                  <Button onClick={handleContinue} disabled={loading || !isStepValid()}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleLockBrief} disabled={loading}>
                    Lock Brief
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg p-6 sticky top-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Preview</h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Project type</p>
                <p className="text-sm font-medium text-foreground">
                  {selectedProjectType?.name || 'Not selected'}
                </p>
                {selectedProjectType && (
                  <p className="text-xs text-muted-foreground">{selectedProjectType.category}</p>
                )}
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Step</span>
                  <span className="text-foreground">{currentStep} of {steps.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Context</span>
                  <span className="text-foreground">
                    {businessContext.companyName ? 'Started' : 'Not started'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Requirements</span>
                  <span className="text-foreground">
                    {Object.keys(intakeResponses).length > 0 ? 'In progress' : 'Not started'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Success criteria</span>
                  <span className="text-foreground">
                    {successCriteria.length > 0 ? `${successCriteria.length} defined` : 'Not started'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Constraints</span>
                  <span className="text-foreground">
                    {constraints.timeline.urgency ? 'Started' : 'Not started'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
