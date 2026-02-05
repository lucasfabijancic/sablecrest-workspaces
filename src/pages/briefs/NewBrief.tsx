import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Save } from 'lucide-react';
import { aecProjectTypes } from '@/data/aecProjectTypes';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const { currentWorkspace } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Step 1 - Project Type
  const [selectedProjectTypeId, setSelectedProjectTypeId] = useState('');

  // Step 2 - Context
  const [businessContext] = useState<BusinessContextDraft>({
    companyName: '',
    companySize: '',
    industry: '',
    currentState: '',
    desiredOutcome: '',
    keyStakeholders: '',
    decisionTimeline: '',
  });

  // Step 3 - Requirements (intake responses)
  const [intakeResponses] = useState<Record<string, string | number | string[]>>({});

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

  const isStepValid = () => {
    if (currentStep === 1) {
      return Boolean(selectedProjectTypeId);
    }
    return true;
  };

  const handleContinue = () => {
    if (!isStepValid()) {
      setValidationErrors({ projectType: 'Select a project type to continue.' });
      return;
    }
    setValidationErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSaveDraft = () => {
    setValidationErrors((prev) => ({ ...prev }));
  };

  const handleLockBrief = () => {
    setValidationErrors((prev) => ({ ...prev }));
  };

  const handleSelectProjectType = (projectTypeId: string) => {
    setSelectedProjectTypeId(projectTypeId);
    setValidationErrors((prev) => {
      if (!prev.projectType) return prev;
      const { projectType, ...rest } = prev;
      return rest;
    });
  };

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
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                  <p className="text-foreground font-medium mb-2">Coming soon</p>
                  Business context questions will live here.
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                  <p className="text-foreground font-medium mb-2">Coming soon</p>
                  Project-type intake questions will appear here.
                </div>
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
                  <Button variant="outline" onClick={handleSaveDraft}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                )}

                {currentStep < steps.length ? (
                  <Button onClick={handleContinue} disabled={!isStepValid()}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleLockBrief} disabled={!isStepValid()}>
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
