import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import type { AECProjectType } from '@/data/aecProjectTypes';
import type { FieldSource, ImplementationBrief } from '@/types/brief';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type IntakeQuestion = AECProjectType['intakeQuestions'][number];

type QuestionState = 'confirmed' | 'needs-input' | 'advisor-suggested';

interface FillDetailsProps {
  brief: ImplementationBrief;
  projectType: AECProjectType | null;
  onUpdate: (updates: Partial<ImplementationBrief>) => void;
}

const OTHER_OPTION = 'Other';
const OTHER_PREFIX = 'Other: ';

const isOtherValue = (value: string) => value.startsWith(OTHER_PREFIX);
const extractOtherText = (value: string) => (isOtherValue(value) ? value.slice(OTHER_PREFIX.length) : '');

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const withOtherOption = (options?: string[]) => {
  const nextOptions = (options ?? []).filter((option) => option !== OTHER_OPTION);
  return [...nextOptions, OTHER_OPTION];
};

const removeOtherValues = (values: string[]) =>
  values.filter((item) => item !== OTHER_OPTION && !isOtherValue(item));

const isQuestionAnswered = (question: IntakeQuestion, value: unknown) => {
  switch (question.type) {
    case 'multiselect': {
      const selectedValues = normalizeStringArray(value);
      if (selectedValues.length === 0) return false;

      return selectedValues.some((item) => {
        if (item === OTHER_OPTION || isOtherValue(item)) {
          return extractOtherText(item === OTHER_OPTION ? `${OTHER_PREFIX}` : item).trim().length > 0;
        }

        return item.trim().length > 0;
      });
    }
    case 'number':
      if (value === '' || value === null || value === undefined) return false;
      if (typeof value === 'number') return !Number.isNaN(value);
      if (typeof value === 'string') return value.trim().length > 0 && !Number.isNaN(Number(value));
      return false;
    case 'select': {
      if (typeof value !== 'string') return false;
      if (value === OTHER_OPTION) return false;
      if (isOtherValue(value)) return extractOtherText(value).trim().length > 0;
      return value.trim().length > 0;
    }
    case 'text':
    case 'textarea':
      return typeof value === 'string' && value.trim().length > 0;
    default:
      return Boolean(value);
  }
};

const formatAnswer = (question: IntakeQuestion, value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (question.type === 'multiselect') {
    const selectedValues = normalizeStringArray(value).map((item) =>
      isOtherValue(item) ? extractOtherText(item).trim() : item
    );

    return selectedValues.filter((item) => item.length > 0).join(', ') || '—';
  }

  if (question.type === 'select' && typeof value === 'string') {
    if (isOtherValue(value)) {
      return extractOtherText(value).trim() || 'Other';
    }

    return value || '—';
  }

  if (question.type === 'number') {
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') return value.trim() || '—';
  }

  return String(value);
};

const getFieldSource = (brief: ImplementationBrief, fieldPath: string): FieldSource => {
  const existing = brief.fieldSources?.[fieldPath];

  if (existing) {
    return existing;
  }

  return {
    source: 'advisor',
    confirmedByClient: false,
    markedForClientInput: false,
  };
};

const classifyQuestion = (
  brief: ImplementationBrief,
  question: IntakeQuestion
): { state: QuestionState; answered: boolean; source: FieldSource } => {
  const value = brief.intakeResponses?.[question.id];
  const fieldPath = `intakeResponses.${question.id}`;
  const source = getFieldSource(brief, fieldPath);
  const answered = isQuestionAnswered(question, value);
  const needsReview = source.markedForClientInput === true && source.confirmedByClient !== true;

  if (answered && needsReview) {
    return { state: 'advisor-suggested', answered, source };
  }

  if (answered && (source.confirmedByClient === true || source.markedForClientInput === false)) {
    return { state: 'confirmed', answered, source };
  }

  if (!answered || needsReview) {
    return { state: 'needs-input', answered, source };
  }

  return { state: 'needs-input', answered, source };
};

export default function FillDetails({ brief, projectType, onUpdate }: FillDetailsProps) {
  const [expandedConfirmed, setExpandedConfirmed] = useState<Record<string, boolean>>({});

  const isFallbackMode = brief.projectTypeId === 'other' || !projectType;

  const questions = projectType?.intakeQuestions ?? [];

  const questionStates = useMemo(() => {
    return questions.map((question) => ({
      question,
      ...classifyQuestion(brief, question),
    }));
  }, [brief, questions]);

  const needsInputCount = useMemo(() => {
    return questions.filter((question) => {
      const value = brief.intakeResponses?.[question.id];
      const source = getFieldSource(brief, `intakeResponses.${question.id}`);
      const answered = isQuestionAnswered(question, value);
      return !answered || (source.markedForClientInput === true && source.confirmedByClient !== true);
    }).length;
  }, [brief, questions]);

  const allConfirmed = questions.length > 0 && needsInputCount === 0;

  const updateResponse = (
    question: IntakeQuestion,
    value: string | number | string[]
  ) => {
    const nextIntakeResponses = {
      ...brief.intakeResponses,
      [question.id]: value,
    };

    const fieldPath = `intakeResponses.${question.id}`;
    const existingSource = getFieldSource(brief, fieldPath);
    const answered = isQuestionAnswered(question, value);

    const nextFieldSources = {
      ...(brief.fieldSources ?? {}),
      [fieldPath]: {
        ...existingSource,
        source: answered ? 'client' : existingSource.source,
        confirmedByClient: answered,
        confirmedAt: answered ? new Date().toISOString() : undefined,
        markedForClientInput: answered ? false : true,
      },
    } as Record<string, FieldSource>;

    onUpdate({
      intakeResponses: nextIntakeResponses,
      fieldSources: nextFieldSources,
    });
  };

  const renderQuestionInput = (question: IntakeQuestion, compact = false) => {
    const value = brief.intakeResponses?.[question.id];

    return (
      <div className="space-y-2">
        <Label htmlFor={question.id} className="text-xs uppercase tracking-wide text-muted-foreground">
          {question.question}
          {question.required && <span className="ml-1 text-destructive">*</span>}
        </Label>

        {question.type === 'text' && (
          <Input
            id={question.id}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => updateResponse(question, event.target.value)}
            placeholder="Enter your response..."
          />
        )}

        {question.type === 'number' && (
          <Input
            id={question.id}
            type="number"
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(event) => {
              const nextValue = event.target.value === '' ? '' : Number(event.target.value);
              updateResponse(question, nextValue);
            }}
            placeholder="Enter a number..."
          />
        )}

        {question.type === 'textarea' && (
          <Textarea
            id={question.id}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => updateResponse(question, event.target.value)}
            placeholder="Add details..."
            className={compact ? 'min-h-[90px]' : 'min-h-[120px]'}
          />
        )}

        {question.type === 'select' && (() => {
          const stringValue = typeof value === 'string' ? value : '';
          const selectValue = isOtherValue(stringValue) ? OTHER_OPTION : stringValue;
          const otherText = extractOtherText(stringValue);
          const options = withOtherOption(question.options);

          return (
            <div className="space-y-2">
              <Select
                value={selectValue}
                onValueChange={(nextValue) => {
                  if (nextValue === OTHER_OPTION) {
                    updateResponse(question, `${OTHER_PREFIX}`);
                    return;
                  }

                  updateResponse(question, nextValue);
                }}
              >
                <SelectTrigger id={question.id}>
                  <SelectValue placeholder="Select an option..." />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectValue === OTHER_OPTION && (
                <Input
                  value={otherText}
                  onChange={(event) => updateResponse(question, `${OTHER_PREFIX}${event.target.value}`)}
                  placeholder="Please specify..."
                />
              )}
            </div>
          );
        })()}

        {question.type === 'multiselect' && (() => {
          const selectedValues = normalizeStringArray(value);
          const options = withOtherOption(question.options).filter((option) => option !== OTHER_OPTION);
          const otherEntry = selectedValues.find((item) => item === OTHER_OPTION || isOtherValue(item));
          const isOtherChecked = Boolean(otherEntry);
          const otherText = otherEntry
            ? extractOtherText(otherEntry === OTHER_OPTION ? `${OTHER_PREFIX}` : otherEntry)
            : '';

          return (
            <div className="space-y-3">
              <div className="space-y-2">
                {options.map((option) => {
                  const checked = selectedValues.includes(option);

                  return (
                    <label key={option} className="flex items-start gap-2 text-sm text-foreground">
                      <Checkbox
                        id={`${question.id}-${option}`}
                        checked={checked}
                        onCheckedChange={(checkedState) => {
                          const isChecked = checkedState === true;
                          const nextValues = isChecked
                            ? [...selectedValues, option]
                            : selectedValues.filter((item) => item !== option);
                          updateResponse(question, nextValues);
                        }}
                        className="mt-0.5"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}

                <label className="flex items-start gap-2 text-sm text-foreground">
                  <Checkbox
                    id={`${question.id}-${OTHER_OPTION}`}
                    checked={isOtherChecked}
                    onCheckedChange={(checkedState) => {
                      const isChecked = checkedState === true;
                      const withoutOther = removeOtherValues(selectedValues);
                      const nextValues = isChecked
                        ? [...withoutOther, `${OTHER_PREFIX}`]
                        : withoutOther;
                      updateResponse(question, nextValues);
                    }}
                    className="mt-0.5"
                  />
                  <span>{OTHER_OPTION}</span>
                </label>
              </div>

              {isOtherChecked && (
                <Input
                  value={otherText}
                  onChange={(event) => {
                    const withoutOther = removeOtherValues(selectedValues);
                    const nextOtherValue = `${OTHER_PREFIX}${event.target.value}`;
                    updateResponse(question, [...withoutOther, nextOtherValue]);
                  }}
                  placeholder="Please specify..."
                />
              )}
            </div>
          );
        })()}

        {question.helpText && <p className="text-xs text-muted-foreground">{question.helpText}</p>}
      </div>
    );
  };

  if (isFallbackMode) {
    const generalRequirements = brief.intakeResponses?.['general-requirements'];

    return (
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-xl">Fill In the Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Describe your project requirements in detail.
          </p>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <Label htmlFor="general-requirements" className="text-xs uppercase tracking-wide text-muted-foreground">
            Project requirements
          </Label>
          <Textarea
            id="general-requirements"
            value={typeof generalRequirements === 'string' ? generalRequirements : ''}
            onChange={(event) =>
              onUpdate({
                intakeResponses: {
                  ...brief.intakeResponses,
                  'general-requirements': event.target.value,
                },
              })
            }
            placeholder="Describe what you need from an implementation partner. Include current systems, desired outcomes, user counts, and integration needs."
            className="min-h-[150px]"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="text-xl">Fill In the Details</CardTitle>
        <p className="text-sm text-muted-foreground">
          {allConfirmed
            ? 'All details captured. Review below if you want to make changes.'
            : `${needsInputCount} item${needsInputCount === 1 ? '' : 's'} need your input`}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {questionStates.map(({ question, state }) => {
          const questionValue = brief.intakeResponses?.[question.id];
          const answerPreview = formatAnswer(question, questionValue);
          const fieldPath = `intakeResponses.${question.id}`;
          const isExpanded = Boolean(expandedConfirmed[fieldPath]);

          if (state === 'confirmed') {
            return (
              <Collapsible
                key={question.id}
                open={isExpanded}
                onOpenChange={(open) =>
                  setExpandedConfirmed((previous) => ({
                    ...previous,
                    [fieldPath]: open,
                  }))
                }
              >
                <div className="rounded-md border border-border/70 bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{question.question}</p>
                      <p className="text-sm text-foreground">{answerPreview}</p>
                      <div className="inline-flex items-center gap-1.5 text-xs text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Confirmed
                      </div>
                    </div>

                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs">
                        {isExpanded ? 'Close' : 'Edit'}
                        {isExpanded ? (
                          <ChevronUp className="ml-1 h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="ml-1 h-3.5 w-3.5" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="pt-3">
                    {renderQuestionInput(question, true)}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          }

          if (state === 'advisor-suggested') {
            return (
              <div key={question.id} className="space-y-3 rounded-md border border-warning/50 bg-warning/5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="warning">Please review</Badge>
                  <div className="inline-flex items-center gap-1 text-xs text-warning">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Advisor suggested
                  </div>
                </div>
                {renderQuestionInput(question)}
              </div>
            );
          }

          return (
            <div key={question.id} className="space-y-3 rounded-md border border-destructive/50 bg-destructive/5 p-4">
              <div className="inline-flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                Needs your input
              </div>
              {renderQuestionInput(question)}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
