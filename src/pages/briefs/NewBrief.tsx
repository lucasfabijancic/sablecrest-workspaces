import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Save } from 'lucide-react';
import { aecProjectTypes } from '@/data/aecProjectTypes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useBriefAutoSave } from '@/hooks/useBriefAutoSave';
import { BRIEF_STEPS, INITIAL_FORM_DATA, type BriefFormData } from '@/types/briefForm';
import { ProjectTypeStep } from '@/components/briefs/steps/ProjectTypeStep';
import { BusinessContextStep } from '@/components/briefs/steps/BusinessContextStep';
import { RequirementsStep } from '@/components/briefs/steps/RequirementsStep';
import { SuccessCriteriaStep, ConstraintsStep } from '@/components/briefs/intake';

type ValidationErrors = Record<string, string>;
type IntakeQuestion = (typeof aecProjectTypes)[number]['intakeQuestions'][number];

const isQuestionAnswered = (question: IntakeQuestion, value: unknown) => {
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

export default function NewBrief() {
  const { currentWorkspace, user, isUiShellMode } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [briefId, setBriefId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BriefFormData>(INITIAL_FORM_DATA);
  const [stepValidity, setStepValidity] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: true,
    4: true,
    5: true,
    6: true,
  });

  const selectedProjectType = useMemo(
    () => aecProjectTypes.find((type) => type.id === formData.projectTypeId),
    [formData.projectTypeId]
  );
  const intakeQuestions = selectedProjectType?.intakeQuestions ?? [];

  const updateFormData = useCallback((updates: Partial<BriefFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearValidationError = useCallback((fieldKey: string) => {
    setValidationErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, []);

  const setCurrentStepValidity = useCallback(
    (valid: boolean) => {
      setStepValidity((prev) => ({ ...prev, [currentStep]: valid }));
    },
    [currentStep]
  );

  const isStepValid = useCallback(() => {
    if (currentStep === 1) {
      return Boolean(formData.projectTypeId);
    }
    if (currentStep === 2) {
      return (
        formData.businessContext.companyName.trim().length > 0 &&
        formData.businessContext.currentState.trim().length > 0 &&
        formData.businessContext.desiredOutcome.trim().length > 0
      );
    }
    if (currentStep === 3) {
      return intakeQuestions.every((question) => {
        if (!question.required) return true;
        return isQuestionAnswered(question, formData.intakeResponses[question.id]);
      });
    }
    return true;
  }, [currentStep, formData, intakeQuestions]);

  const buildBriefTitle = useCallback(() => {
    const projectLabel = selectedProjectType?.name || 'Implementation Brief';
    const companyLabel = formData.businessContext.companyName.trim();
    if (companyLabel) {
      return `${companyLabel} — ${projectLabel}`;
    }
    return projectLabel;
  }, [formData.businessContext.companyName, selectedProjectType?.name]);

  const buildBriefPayload = useCallback(
    (status: 'Draft' | 'Locked') => ({
      workspace_id: currentWorkspace?.id ?? '',
      title: buildBriefTitle(),
      project_type_id: formData.projectTypeId ?? '',
      status,
      business_context: formData.businessContext,
      requirements: [],
      success_criteria: formData.successCriteria,
      constraints: formData.constraints,
      risk_factors: formData.riskFactors,
      intake_responses: formData.intakeResponses,
      locked_at: status === 'Locked' ? new Date().toISOString() : null,
      locked_by: status === 'Locked' ? user?.id ?? null : null,
      owner_id: user?.id ?? null,
    }),
    [buildBriefTitle, currentWorkspace?.id, formData, user?.id]
  );

  const upsertBrief = useCallback(
    async (status: 'Draft' | 'Locked'): Promise<string | null> => {
      if (!currentWorkspace || !user || !formData.projectTypeId) {
        return null;
      }

      const payload = buildBriefPayload(status);
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
        return data.id;
      }

      return null;
    },
    [briefId, buildBriefPayload, currentWorkspace, formData.projectTypeId, user]
  );

  const autosaveSignature = useMemo(() => JSON.stringify(formData), [formData]);

  const saveDraftSilently = useCallback(
    async (): Promise<boolean> => {
      if (isUiShellMode || !currentWorkspace || !user || !formData.projectTypeId) {
        return false;
      }

      try {
        const id = await upsertBrief('Draft');
        return Boolean(id);
      } catch {
        return false;
      }
    },
    [currentWorkspace, formData.projectTypeId, isUiShellMode, upsertBrief, user]
  );

  const { markSignatureAsSaved } = useBriefAutoSave({
    enabled:
      !loading &&
      currentStep >= 2 &&
      !isUiShellMode &&
      Boolean(currentWorkspace && user && formData.projectTypeId),
    signature: autosaveSignature,
    onSave: saveDraftSilently,
  });

  const handleContinue = () => {
    if (!isStepValid()) {
      if (currentStep === 1) {
        setValidationErrors({ projectType: 'Select a project type to continue.' });
      } else if (currentStep === 2) {
        setValidationErrors({
          companyName: formData.businessContext.companyName.trim() ? '' : 'Company name is required.',
          currentState: formData.businessContext.currentState.trim() ? '' : 'Describe the current state.',
          desiredOutcome: formData.businessContext.desiredOutcome.trim() ? '' : 'Define the desired outcome.',
        });
      } else if (currentStep === 3) {
        const nextErrors: ValidationErrors = {};
        intakeQuestions.forEach((question) => {
          if (question.required && !isQuestionAnswered(question, formData.intakeResponses[question.id])) {
            nextErrors[question.id] = 'This field is required.';
          }
        });
        setValidationErrors(nextErrors);
      }
      return;
    }

    setValidationErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, BRIEF_STEPS.length));
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

    if (!formData.projectTypeId) {
      setValidationErrors({ projectType: 'Select a project type to save a draft.' });
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    try {
      const id = await upsertBrief('Draft');
      if (!id) throw new Error('Failed to save draft.');

      markSignatureAsSaved(autosaveSignature);
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

    if (!formData.projectTypeId) {
      setValidationErrors({ projectType: 'Select a project type to continue.' });
      setCurrentStep(1);
      return;
    }

    if (
      !formData.businessContext.companyName.trim() ||
      !formData.businessContext.currentState.trim() ||
      !formData.businessContext.desiredOutcome.trim()
    ) {
      setValidationErrors({
        companyName: formData.businessContext.companyName.trim() ? '' : 'Company name is required.',
        currentState: formData.businessContext.currentState.trim() ? '' : 'Describe the current state.',
        desiredOutcome: formData.businessContext.desiredOutcome.trim() ? '' : 'Define the desired outcome.',
      });
      setCurrentStep(2);
      return;
    }

    setLoading(true);
    try {
      const id = await upsertBrief('Locked');
      if (!id) throw new Error('Failed to lock brief.');

      markSignatureAsSaved(autosaveSignature);
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

  if (!currentWorkspace) {
    return <div className="p-6 text-center text-muted-foreground">Please select a workspace first.</div>;
  }

  const currentStepValid = stepValidity[currentStep] ?? true;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link to="/briefs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to briefs
      </Link>

      <h1 className="text-xl font-semibold text-foreground mb-2">New Implementation Brief</h1>
      <p className="text-muted-foreground mb-6">Create a new brief in {currentWorkspace.name}</p>

      <div className="flex items-center gap-4 mb-8">
        {BRIEF_STEPS.map((step, index) => (
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
            {index < BRIEF_STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-lg p-6">
            {currentStep === 1 && (
              <ProjectTypeStep
                formData={formData}
                updateFormData={updateFormData}
                isValid={currentStepValid}
                setIsValid={setCurrentStepValidity}
                projectTypeError={validationErrors.projectType}
                clearProjectTypeError={() => clearValidationError('projectType')}
              />
            )}

            {currentStep === 2 && (
              <BusinessContextStep
                formData={formData}
                updateFormData={updateFormData}
                isValid={currentStepValid}
                setIsValid={setCurrentStepValidity}
                validationErrors={validationErrors}
                clearValidationError={clearValidationError}
              />
            )}

            {currentStep === 3 && (
              <RequirementsStep
                formData={formData}
                updateFormData={updateFormData}
                isValid={currentStepValid}
                setIsValid={setCurrentStepValidity}
                validationErrors={validationErrors}
                clearValidationError={clearValidationError}
              />
            )}

            {currentStep === 4 && (
              <SuccessCriteriaStep
                formData={formData}
                updateFormData={updateFormData}
                isValid={currentStepValid}
                setIsValid={setCurrentStepValidity}
              />
            )}

            {currentStep === 5 && (
              <ConstraintsStep
                formData={formData}
                updateFormData={updateFormData}
                isValid={currentStepValid}
                setIsValid={setCurrentStepValidity}
              />
            )}

            {currentStep === 6 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                  <p className="text-foreground font-medium mb-2">Review</p>
                  A full summary and lock step will appear here.
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1}>
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

                {currentStep < BRIEF_STEPS.length ? (
                  <Button onClick={handleContinue} disabled={loading || !currentStepValid}>
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

        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg p-6 sticky top-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Preview</h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Project type</p>
                <p className="text-sm font-medium text-foreground">{selectedProjectType?.name || 'Not selected'}</p>
                {selectedProjectType && <p className="text-xs text-muted-foreground">{selectedProjectType.category}</p>}
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Step</span>
                  <span className="text-foreground">
                    {currentStep} of {BRIEF_STEPS.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Context</span>
                  <span className="text-foreground">
                    {formData.businessContext.companyName ? 'Started' : 'Not started'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Requirements</span>
                  <span className="text-foreground">
                    {Object.keys(formData.intakeResponses).length > 0 ? 'In progress' : 'Not started'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Success criteria</span>
                  <span className="text-foreground">
                    {formData.successCriteria.length > 0 ? `${formData.successCriteria.length} defined` : 'Not started'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Constraints</span>
                  <span className="text-foreground">
                    {formData.constraints.timeline.urgency ? 'Started' : 'Not started'}
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
