import { Pencil, Save, Send } from 'lucide-react';
import { aecProjectTypes } from '@/data/aecProjectTypes';
import type { BriefConstraints, BusinessContext, SuccessCriterion } from '@/types/brief';
import type { BriefFormData } from '@/types/briefForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ReviewStepProps {
  formData: BriefFormData;
  briefId: string | null;
  onSaveDraft: () => Promise<void>;
  onSubmitBrief: () => Promise<void>;
  isSubmitting: boolean;
  onJumpToStep: (step: number) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const hasResponse = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value === 'boolean') return true;
  return value !== null && value !== undefined;
};

const renderResponseValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value ?? '');
};

const isMostlyEmptyConstraints = (constraints: BriefConstraints): boolean => {
  const hasBudget =
    typeof constraints.budget.min === 'number' || typeof constraints.budget.max === 'number';
  const hasTimeline =
    Boolean(constraints.timeline.urgency) ||
    Boolean(constraints.timeline.hardDeadline) ||
    Boolean(constraints.timeline.reason);
  const hasSensitivity =
    Boolean(constraints.sensitivity.level) ||
    Boolean(constraints.sensitivity.concerns?.length);
  const hasTechnical =
    constraints.technical.mustIntegrate.length > 0 ||
    constraints.technical.cannotChange.length > 0 ||
    Boolean(constraints.technical.preferences?.length);

  return !(hasBudget || hasTimeline || hasSensitivity || hasTechnical);
};

const DefinitionRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 py-2">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="text-sm font-medium text-foreground whitespace-pre-wrap">{value}</div>
  </div>
);

const SectionHeader = ({
  title,
  step,
  onJumpToStep,
}: {
  title: string;
  step: number;
  onJumpToStep: (step: number) => void;
}) => (
  <CardHeader className="flex flex-row items-center justify-between space-y-0">
    <CardTitle>{title}</CardTitle>
    <Button variant="ghost" size="sm" onClick={() => onJumpToStep(step)}>
      <Pencil className="h-4 w-4 mr-1" />
      Edit
    </Button>
  </CardHeader>
);

const renderContextRows = (businessContext: BusinessContext) => {
  const rows = [
    { label: 'Company Name', value: businessContext.companyName },
    { label: 'Company Size', value: businessContext.companySize },
    { label: 'Industry Segment', value: businessContext.industry },
    { label: 'Current State', value: businessContext.currentState },
    { label: 'Desired Outcome', value: businessContext.desiredOutcome },
    { label: 'Key Stakeholders', value: businessContext.keyStakeholders },
    { label: 'Decision Timeline', value: businessContext.decisionTimeline },
  ].filter((row) => row.value && row.value.trim().length > 0);

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No business context captured.</p>;
  }

  return rows.map((row) => <DefinitionRow key={row.label} label={row.label} value={row.value} />);
};

const renderSuccessCriteriaRows = (criteria: SuccessCriterion[]) => {
  if (criteria.length === 0) {
    return <p className="text-sm text-muted-foreground">No success criteria defined.</p>;
  }

  return criteria.map((criterion, index) => (
    <div key={criterion.id} className="space-y-2">
      <p className="text-sm font-medium text-foreground">Criterion {index + 1}</p>
      <DefinitionRow label="Metric" value={criterion.metric || 'Not specified'} />
      <DefinitionRow
        label="Baseline -> Target"
        value={criterion.baseline ? `${criterion.baseline} -> ${criterion.target || 'Not specified'}` : criterion.target || 'Not specified'}
      />
      <DefinitionRow label="Measurement Method" value={criterion.measurementMethod || 'Not specified'} />
      <DefinitionRow label="Timeframe" value={criterion.timeframe || 'Not specified'} />
      <DefinitionRow label="Importance" value={`${criterion.weight}/10`} />
      {index < criteria.length - 1 && <Separator />}
    </div>
  ));
};

const renderConstraintsRows = (constraints: BriefConstraints) => {
  if (isMostlyEmptyConstraints(constraints)) {
    return <p className="text-sm text-muted-foreground">No constraints specified.</p>;
  }

  const budgetMin = typeof constraints.budget.min === 'number' ? formatCurrency(constraints.budget.min) : null;
  const budgetMax = typeof constraints.budget.max === 'number' ? formatCurrency(constraints.budget.max) : null;
  const budgetRange = budgetMin || budgetMax ? `${budgetMin ?? 'Not set'} - ${budgetMax ?? 'Not set'}` : null;

  return (
    <div className="space-y-3">
      {(budgetRange || constraints.budget.flexibility) && (
        <>
          {budgetRange && <DefinitionRow label="Budget Range" value={budgetRange} />}
          <DefinitionRow label="Budget Flexibility" value={constraints.budget.flexibility} />
        </>
      )}

      {(constraints.timeline.urgency || constraints.timeline.hardDeadline || constraints.timeline.reason) && (
        <>
          {constraints.timeline.urgency && <DefinitionRow label="Timeline Urgency" value={constraints.timeline.urgency} />}
          {constraints.timeline.hardDeadline && <DefinitionRow label="Hard Deadline" value={constraints.timeline.hardDeadline} />}
          {constraints.timeline.reason && <DefinitionRow label="Deadline Reason" value={constraints.timeline.reason} />}
        </>
      )}

      {(constraints.sensitivity.level || constraints.sensitivity.concerns?.length) && (
        <>
          {constraints.sensitivity.level && <DefinitionRow label="Sensitivity Level" value={constraints.sensitivity.level} />}
          {constraints.sensitivity.concerns && constraints.sensitivity.concerns.length > 0 && (
            <DefinitionRow label="Specific Concerns" value={constraints.sensitivity.concerns.join(', ')} />
          )}
        </>
      )}

      {(constraints.technical.mustIntegrate.length > 0 ||
        constraints.technical.cannotChange.length > 0 ||
        (constraints.technical.preferences && constraints.technical.preferences.length > 0)) && (
        <>
          {constraints.technical.mustIntegrate.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 py-2">
              <div className="text-sm text-muted-foreground">Must Integrate With</div>
              <div className="flex flex-wrap gap-2">
                {constraints.technical.mustIntegrate.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {constraints.technical.cannotChange.length > 0 && (
            <DefinitionRow label="Cannot Change" value={constraints.technical.cannotChange.join(', ')} />
          )}
          {constraints.technical.preferences && constraints.technical.preferences.length > 0 && (
            <DefinitionRow label="Preferences" value={constraints.technical.preferences.join(', ')} />
          )}
        </>
      )}
    </div>
  );
};

const getRequirementsRows = (formData: BriefFormData) => {
  const selectedProjectType = aecProjectTypes.find((projectType) => projectType.id === formData.projectTypeId);
  const intakeQuestions = selectedProjectType?.intakeQuestions ?? [];

  const answeredQuestions = intakeQuestions
    .map((question) => ({
      question: question.question,
      answer: formData.intakeResponses[question.id],
    }))
    .filter((item) => hasResponse(item.answer));

  if (answeredQuestions.length === 0) {
    return <p className="text-sm text-muted-foreground">No requirements captured.</p>;
  }

  return answeredQuestions.map((item) => (
    <DefinitionRow key={item.question} label={item.question} value={renderResponseValue(item.answer)} />
  ));
};

const getProjectTypeSection = (formData: BriefFormData) => {
  const selectedProjectType = aecProjectTypes.find((projectType) => projectType.id === formData.projectTypeId);

  if (!selectedProjectType) {
    return <p className="text-sm text-destructive">No project type selected.</p>;
  }

  return (
    <div className="space-y-2">
      <DefinitionRow label="Name" value={selectedProjectType.name} />
      <DefinitionRow label="Category" value={selectedProjectType.category} />
      <DefinitionRow label="Description" value={selectedProjectType.description} />
    </div>
  );
};

export default function ReviewStep({
  formData,
  briefId,
  onSaveDraft,
  onSubmitBrief,
  isSubmitting,
  onJumpToStep,
}: ReviewStepProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      {briefId && (
        <div className="text-xs text-muted-foreground">Draft ID: {briefId}</div>
      )}

      <Card>
        <SectionHeader title="Project Type" step={1} onJumpToStep={onJumpToStep} />
        <CardContent>{getProjectTypeSection(formData)}</CardContent>
      </Card>

      <Card>
        <SectionHeader title="Business Context" step={2} onJumpToStep={onJumpToStep} />
        <CardContent>{renderContextRows(formData.businessContext)}</CardContent>
      </Card>

      <Card>
        <SectionHeader title="Requirements" step={3} onJumpToStep={onJumpToStep} />
        <CardContent>{getRequirementsRows(formData)}</CardContent>
      </Card>

      <Card>
        <SectionHeader title="Success Criteria" step={4} onJumpToStep={onJumpToStep} />
        <CardContent>{renderSuccessCriteriaRows(formData.successCriteria)}</CardContent>
      </Card>

      <Card>
        <SectionHeader title="Constraints" step={5} onJumpToStep={onJumpToStep} />
        <CardContent>{renderConstraintsRows(formData.constraints)}</CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Submitting will change the brief status to In Review. You can still edit until the brief is locked.
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onSaveDraft}>
          <Save className="h-4 w-4 mr-2" />
          Save as Draft
        </Button>
        <Button onClick={onSubmitBrief} disabled={isSubmitting}>
          {isSubmitting && <span className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />}
          {!isSubmitting && <Send className="h-4 w-4 mr-2" />}
          {isSubmitting ? 'Submitting...' : 'Submit Brief'}
        </Button>
      </div>
    </div>
  );
}
