import { useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { AECProjectType } from '@/data/aecProjectTypes';
import type { BriefConstraints, FieldSource, ImplementationBrief } from '@/types/brief';
import type { SensitivityLevel, TimelineUrgency } from '@/types/database';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ReviewSubmitProps {
  brief: ImplementationBrief;
  projectType: AECProjectType | null;
  onUpdate: (updates: Partial<ImplementationBrief>) => void;
  onSubmit: () => Promise<void>;
  onSaveProgress: () => Promise<void>;
  onAskQuestion: () => void;
  isSubmitting: boolean;
  completionStatus: { section: string; complete: boolean; issues: string[] }[];
}

const TIMELINE_OPTIONS: TimelineUrgency[] = [
  'Immediate',
  'Within 2 weeks',
  'Within 1 month',
  'Within 3 months',
  'Flexible',
];

const SENSITIVITY_OPTIONS: SensitivityLevel[] = [
  'Standard',
  'Confidential',
  'Highly Confidential',
];

const FLEXIBILITY_OPTIONS: Array<BriefConstraints['budget']['flexibility']> = [
  'Firm',
  'Flexible',
];

const listToTextarea = (items?: string[]) => (items && items.length > 0 ? items.join('\n') : '');

const textareaToList = (value: string): string[] =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Not provided';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
};

export default function ReviewSubmit({
  brief,
  projectType,
  onUpdate,
  onSubmit,
  onSaveProgress,
  onAskQuestion,
  isSubmitting,
  completionStatus,
}: ReviewSubmitProps) {
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const allSectionsComplete = useMemo(
    () => completionStatus.length > 0 && completionStatus.every((item) => item.complete),
    [completionStatus]
  );

  const incompleteIssues = useMemo(() => {
    return completionStatus.flatMap((item) => {
      if (item.complete) return [];
      if (item.issues.length === 0) return [`${item.section} needs attention.`];
      return item.issues.map((issue) => `${item.section}: ${issue}`);
    });
  }, [completionStatus]);

  const hasAnyFieldSourceData = useMemo(
    () => Boolean(brief.fieldSources && Object.keys(brief.fieldSources).length > 0),
    [brief.fieldSources]
  );

  const getCurrentConstraintValue = (fieldPath: string): unknown => {
    switch (fieldPath) {
      case 'constraints.budget.min':
        return brief.constraints.budget.min;
      case 'constraints.budget.max':
        return brief.constraints.budget.max;
      case 'constraints.budget.flexibility':
        return brief.constraints.budget.flexibility;
      case 'constraints.timeline.urgency':
        return brief.constraints.timeline.urgency;
      case 'constraints.timeline.hardDeadline':
        return brief.constraints.timeline.hardDeadline;
      case 'constraints.timeline.reason':
        return brief.constraints.timeline.reason;
      case 'constraints.sensitivity.level':
        return brief.constraints.sensitivity.level;
      case 'constraints.sensitivity.concerns':
        return brief.constraints.sensitivity.concerns;
      case 'constraints.technical.mustIntegrate':
        return brief.constraints.technical.mustIntegrate;
      case 'constraints.technical.cannotChange':
        return brief.constraints.technical.cannotChange;
      case 'constraints.technical.preferences':
        return brief.constraints.technical.preferences;
      default:
        return undefined;
    }
  };

  const getSourceForField = (fieldPath: string, hasCurrentValue: boolean): FieldSource => {
    const existing = brief.fieldSources?.[fieldPath];

    if (existing) {
      return existing;
    }

    if (!hasAnyFieldSourceData && hasCurrentValue) {
      return {
        source: 'advisor',
        confirmedByClient: true,
        markedForClientInput: false,
      };
    }

    return {
      source: 'advisor',
      confirmedByClient: false,
      markedForClientInput: false,
    };
  };

  const applyConstraintUpdate = (fieldPath: string, nextFieldValue: unknown, nextConstraints: BriefConstraints) => {
    const currentValue = getCurrentConstraintValue(fieldPath);
    const existingSource = getSourceForField(fieldPath, hasValue(currentValue));
    const filled = hasValue(nextFieldValue);

    const nextFieldSources: Record<string, FieldSource> = {
      ...(brief.fieldSources ?? {}),
      [fieldPath]: {
        ...existingSource,
        source: filled ? 'client' : existingSource.source,
        confirmedByClient: filled,
        confirmedAt: filled ? new Date().toISOString() : undefined,
        markedForClientInput: !filled,
      },
    };

    onUpdate({
      constraints: nextConstraints,
      fieldSources: nextFieldSources,
    });
  };

  const confirmField = (fieldPath: string) => {
    const currentValue = getCurrentConstraintValue(fieldPath);
    if (!hasValue(currentValue)) return;

    const existingSource = getSourceForField(fieldPath, true);

    onUpdate({
      fieldSources: {
        ...(brief.fieldSources ?? {}),
        [fieldPath]: {
          ...existingSource,
          confirmedByClient: true,
          confirmedAt: new Date().toISOString(),
          markedForClientInput: false,
        },
      },
    });
  };

  const updateBudget = (updates: Partial<BriefConstraints['budget']>, changedPath: string, changedValue: unknown) => {
    const nextConstraints: BriefConstraints = {
      ...brief.constraints,
      budget: {
        ...brief.constraints.budget,
        ...updates,
      },
    };

    applyConstraintUpdate(changedPath, changedValue, nextConstraints);
  };

  const updateTimeline = (
    updates: Partial<BriefConstraints['timeline']>,
    changedPath: string,
    changedValue: unknown
  ) => {
    const nextConstraints: BriefConstraints = {
      ...brief.constraints,
      timeline: {
        ...brief.constraints.timeline,
        ...updates,
      },
    };

    applyConstraintUpdate(changedPath, changedValue, nextConstraints);
  };

  const updateSensitivity = (
    updates: Partial<BriefConstraints['sensitivity']>,
    changedPath: string,
    changedValue: unknown
  ) => {
    const nextConstraints: BriefConstraints = {
      ...brief.constraints,
      sensitivity: {
        ...brief.constraints.sensitivity,
        ...updates,
      },
    };

    applyConstraintUpdate(changedPath, changedValue, nextConstraints);
  };

  const updateTechnical = (
    updates: Partial<BriefConstraints['technical']>,
    changedPath: string,
    changedValue: unknown
  ) => {
    const nextConstraints: BriefConstraints = {
      ...brief.constraints,
      technical: {
        ...brief.constraints.technical,
        ...updates,
      },
    };

    applyConstraintUpdate(changedPath, changedValue, nextConstraints);
  };

  const handleSaveProgress = async () => {
    setIsSaving(true);
    try {
      await onSaveProgress();
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = ({
    label,
    fieldPath,
    value,
    display,
    input,
    multiline = false,
  }: {
    label: string;
    fieldPath: string;
    value: unknown;
    display: string;
    input: ReactNode;
    multiline?: boolean;
  }) => {
    const valuePresent = hasValue(value);
    const source = getSourceForField(fieldPath, valuePresent);
    const markedForClientInput = source.markedForClientInput === true;
    const isConfirmed = source.confirmedByClient === true;
    const forcedOpen = markedForClientInput || !valuePresent;
    const editing = Boolean(editingFields[fieldPath]) || forcedOpen;

    const showReadOnlyValue = valuePresent && !editing;
    const showMissing = !valuePresent && !editing;

    return (
      <div
        key={fieldPath}
        className={cn(
          'space-y-3 rounded-md border p-4',
          markedForClientInput && valuePresent && 'border-warning/50 bg-warning/5',
          markedForClientInput && !valuePresent && 'border-destructive/50 bg-destructive/5',
          !markedForClientInput && 'border-border/70 bg-card'
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>

            {valuePresent && !markedForClientInput && (
              <div className="inline-flex items-center gap-1.5 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isConfirmed ? 'Confirmed' : 'Ready to confirm'}
              </div>
            )}

            {valuePresent && markedForClientInput && (
              <div className="inline-flex items-center gap-1.5 text-xs text-warning">
                <AlertCircle className="h-3.5 w-3.5" />
                Please review
              </div>
            )}

            {!valuePresent && markedForClientInput && (
              <div className="inline-flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                Your advisor needs this information.
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!forcedOpen && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() =>
                  setEditingFields((previous) => ({
                    ...previous,
                    [fieldPath]: !previous[fieldPath],
                  }))
                }
              >
                {valuePresent ? 'Edit' : 'Add'}
              </Button>
            )}

            {valuePresent && !isConfirmed && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => confirmField(fieldPath)}
              >
                Confirm
              </Button>
            )}
          </div>
        </div>

        {showReadOnlyValue && (
          <p className={cn('text-sm text-foreground', multiline && 'whitespace-pre-wrap')}>{display}</p>
        )}

        {showMissing && <p className="text-sm text-muted-foreground">Not provided</p>}

        {editing && <div className="space-y-2">{input}</div>}
      </div>
    );
  };

  const budgetMinPath = 'constraints.budget.min';
  const budgetMaxPath = 'constraints.budget.max';
  const budgetFlexPath = 'constraints.budget.flexibility';

  const timelineUrgencyPath = 'constraints.timeline.urgency';
  const timelineDeadlinePath = 'constraints.timeline.hardDeadline';
  const timelineReasonPath = 'constraints.timeline.reason';

  const sensitivityLevelPath = 'constraints.sensitivity.level';
  const sensitivityConcernsPath = 'constraints.sensitivity.concerns';

  const technicalMustIntegratePath = 'constraints.technical.mustIntegrate';
  const technicalCannotChangePath = 'constraints.technical.cannotChange';
  const technicalPreferencesPath = 'constraints.technical.preferences';

  const urgencyValue = brief.constraints.timeline.urgency ?? '';
  const urgencyOptions = useMemo(() => {
    if (urgencyValue && !TIMELINE_OPTIONS.includes(urgencyValue as TimelineUrgency)) {
      return [...TIMELINE_OPTIONS, urgencyValue as TimelineUrgency];
    }
    return TIMELINE_OPTIONS;
  }, [urgencyValue]);

  const sensitivityValue = brief.constraints.sensitivity.level ?? '';
  const sensitivityOptions = useMemo(() => {
    if (sensitivityValue && !SENSITIVITY_OPTIONS.includes(sensitivityValue as SensitivityLevel)) {
      return [...SENSITIVITY_OPTIONS, sensitivityValue as SensitivityLevel];
    }
    return SENSITIVITY_OPTIONS;
  }, [sensitivityValue]);

  const flexibilityValue = brief.constraints.budget.flexibility;
  const flexibilityOptions = useMemo(() => {
    if (flexibilityValue && !FLEXIBILITY_OPTIONS.includes(flexibilityValue)) {
      return [...FLEXIBILITY_OPTIONS, flexibilityValue];
    }
    return FLEXIBILITY_OPTIONS;
  }, [flexibilityValue]);

  return (
    <div className="space-y-6">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-xl">Constraints</CardTitle>
          <p className="text-sm text-muted-foreground">
            Confirm timing, budget, sensitivity, and technical boundaries for {projectType?.name ?? 'this brief'}.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-0">
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Budget</Label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renderField({
                label: 'Budget Minimum',
                fieldPath: budgetMinPath,
                value: brief.constraints.budget.min,
                display: formatCurrency(brief.constraints.budget.min),
                input: (
                  <Input
                    type="number"
                    value={brief.constraints.budget.min ?? ''}
                    onChange={(event) => {
                      const nextValue = event.target.value === '' ? undefined : Number(event.target.value);
                      updateBudget(
                        { min: Number.isNaN(nextValue) ? undefined : nextValue },
                        budgetMinPath,
                        Number.isNaN(nextValue) ? undefined : nextValue
                      );
                    }}
                    placeholder="Enter minimum budget"
                  />
                ),
              })}

              {renderField({
                label: 'Budget Maximum',
                fieldPath: budgetMaxPath,
                value: brief.constraints.budget.max,
                display: formatCurrency(brief.constraints.budget.max),
                input: (
                  <Input
                    type="number"
                    value={brief.constraints.budget.max ?? ''}
                    onChange={(event) => {
                      const nextValue = event.target.value === '' ? undefined : Number(event.target.value);
                      updateBudget(
                        { max: Number.isNaN(nextValue) ? undefined : nextValue },
                        budgetMaxPath,
                        Number.isNaN(nextValue) ? undefined : nextValue
                      );
                    }}
                    placeholder="Enter maximum budget"
                  />
                ),
              })}
            </div>

            {renderField({
              label: 'Budget Flexibility',
              fieldPath: budgetFlexPath,
              value: brief.constraints.budget.flexibility,
              display: brief.constraints.budget.flexibility || 'Not provided',
              input: (
                <Select
                  value={brief.constraints.budget.flexibility || undefined}
                  onValueChange={(value) =>
                    updateBudget(
                      { flexibility: value as BriefConstraints['budget']['flexibility'] },
                      budgetFlexPath,
                      value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select flexibility" />
                  </SelectTrigger>
                  <SelectContent>
                    {flexibilityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ),
            })}
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Timeline</Label>

            {renderField({
              label: 'Urgency',
              fieldPath: timelineUrgencyPath,
              value: brief.constraints.timeline.urgency,
              display: brief.constraints.timeline.urgency || 'Not provided',
              input: (
                <Select
                  value={brief.constraints.timeline.urgency || undefined}
                  onValueChange={(value) =>
                    updateTimeline(
                      { urgency: value as TimelineUrgency },
                      timelineUrgencyPath,
                      value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ),
            })}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renderField({
                label: 'Hard Deadline',
                fieldPath: timelineDeadlinePath,
                value: brief.constraints.timeline.hardDeadline,
                display: brief.constraints.timeline.hardDeadline || 'Not provided',
                input: (
                  <Input
                    type="date"
                    value={brief.constraints.timeline.hardDeadline ?? ''}
                    onChange={(event) =>
                      updateTimeline(
                        { hardDeadline: event.target.value || undefined },
                        timelineDeadlinePath,
                        event.target.value
                      )
                    }
                  />
                ),
              })}

              {renderField({
                label: 'Deadline Reason',
                fieldPath: timelineReasonPath,
                value: brief.constraints.timeline.reason,
                display: brief.constraints.timeline.reason || 'Not provided',
                input: (
                  <Input
                    value={brief.constraints.timeline.reason ?? ''}
                    onChange={(event) =>
                      updateTimeline(
                        { reason: event.target.value || undefined },
                        timelineReasonPath,
                        event.target.value
                      )
                    }
                    placeholder="Why is this deadline important?"
                  />
                ),
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Sensitivity</Label>

            {renderField({
              label: 'Sensitivity Level',
              fieldPath: sensitivityLevelPath,
              value: brief.constraints.sensitivity.level,
              display: brief.constraints.sensitivity.level || 'Not provided',
              input: (
                <Select
                  value={brief.constraints.sensitivity.level || undefined}
                  onValueChange={(value) =>
                    updateSensitivity(
                      { level: value as SensitivityLevel },
                      sensitivityLevelPath,
                      value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sensitivity" />
                  </SelectTrigger>
                  <SelectContent>
                    {sensitivityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ),
            })}

            {renderField({
              label: 'Specific Concerns',
              fieldPath: sensitivityConcernsPath,
              value: brief.constraints.sensitivity.concerns,
              display: listToTextarea(brief.constraints.sensitivity.concerns) || 'Not provided',
              multiline: true,
              input: (
                <Textarea
                  className="min-h-[100px]"
                  value={listToTextarea(brief.constraints.sensitivity.concerns)}
                  onChange={(event) => {
                    const nextValue = textareaToList(event.target.value);
                    updateSensitivity(
                      { concerns: nextValue },
                      sensitivityConcernsPath,
                      nextValue
                    );
                  }}
                  placeholder="One concern per line"
                />
              ),
            })}
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Technical</Label>

            {renderField({
              label: 'Must Integrate With',
              fieldPath: technicalMustIntegratePath,
              value: brief.constraints.technical.mustIntegrate,
              display: listToTextarea(brief.constraints.technical.mustIntegrate) || 'Not provided',
              multiline: true,
              input: (
                <Textarea
                  className="min-h-[100px]"
                  value={listToTextarea(brief.constraints.technical.mustIntegrate)}
                  onChange={(event) => {
                    const nextValue = textareaToList(event.target.value);
                    updateTechnical(
                      { mustIntegrate: nextValue },
                      technicalMustIntegratePath,
                      nextValue
                    );
                  }}
                  placeholder="One system per line"
                />
              ),
            })}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renderField({
                label: 'Cannot Change',
                fieldPath: technicalCannotChangePath,
                value: brief.constraints.technical.cannotChange,
                display: listToTextarea(brief.constraints.technical.cannotChange) || 'Not provided',
                multiline: true,
                input: (
                  <Textarea
                    className="min-h-[100px]"
                    value={listToTextarea(brief.constraints.technical.cannotChange)}
                    onChange={(event) => {
                      const nextValue = textareaToList(event.target.value);
                      updateTechnical(
                        { cannotChange: nextValue },
                        technicalCannotChangePath,
                        nextValue
                      );
                    }}
                    placeholder="One constraint per line"
                  />
                ),
              })}

              {renderField({
                label: 'Preferences',
                fieldPath: technicalPreferencesPath,
                value: brief.constraints.technical.preferences,
                display: listToTextarea(brief.constraints.technical.preferences) || 'Not provided',
                multiline: true,
                input: (
                  <Textarea
                    className="min-h-[100px]"
                    value={listToTextarea(brief.constraints.technical.preferences)}
                    onChange={(event) => {
                      const nextValue = textareaToList(event.target.value);
                      updateTechnical(
                        { preferences: nextValue },
                        technicalPreferencesPath,
                        nextValue
                      );
                    }}
                    placeholder="One preference per line"
                  />
                ),
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-xl">Completion Checklist</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {completionStatus.map((item) => (
            <div
              key={item.section}
              className={cn(
                'rounded-md border p-3 text-sm',
                item.complete ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'
              )}
            >
              <div className="flex items-start gap-2">
                {item.complete ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 text-warning" />
                )}

                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {item.section}: {item.complete ? 'Complete' : 'Needs attention'}
                  </p>
                  {!item.complete && item.issues.length > 0 && (
                    <p className="text-xs text-warning">{item.issues.join(' ')}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card
        className={cn(
          'border-border/80',
          allSectionsComplete ? 'bg-success/5 border-success/30' : 'bg-warning/5 border-warning/30'
        )}
      >
        <CardContent className="space-y-4 p-5">
          {allSectionsComplete ? (
            <p className="text-sm text-foreground">
              Your brief is ready for review by your Sablecrest advisor. Once you submit, your advisor will finalize the brief and begin provider matching.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-foreground">Some sections need your attention before you can submit.</p>
              {incompleteIssues.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-xs text-warning">
                  {incompleteIssues.map((issue, index) => (
                    <li key={`${issue}-${index}`}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void onSubmit()}
              disabled={!allSectionsComplete || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Brief
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleSaveProgress()}
              disabled={isSaving || isSubmitting}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save My Progress
            </Button>

            <Button type="button" variant="outline" onClick={onAskQuestion}>
              I Have Questions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
