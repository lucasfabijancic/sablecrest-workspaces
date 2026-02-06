import { useEffect, useMemo } from 'react';
import { aecProjectTypes } from '@/data/aecProjectTypes';
import { BriefStepProps } from '@/types/briefForm';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type IntakeQuestion = (typeof aecProjectTypes)[number]['intakeQuestions'][number];

interface RequirementsStepProps extends BriefStepProps {
  validationErrors: Record<string, string>;
  clearValidationError: (fieldKey: string) => void;
}

const OTHER_OPTION = 'Other';
const OTHER_PREFIX = 'Other: ';

const NUMBER_HINTS: Record<string, string> = {
  'user-count': 'Typical range: 10-500',
  'field-users': 'Typical range: 10-500',
  'project-volume': 'Typical range: 5-200 active projects',
};

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

export function RequirementsStep({
  formData,
  updateFormData,
  setIsValid,
  validationErrors,
  clearValidationError,
}: RequirementsStepProps) {
  const selectedProjectType = useMemo(
    () => aecProjectTypes.find((type) => type.id === formData.projectTypeId),
    [formData.projectTypeId]
  );
  const intakeQuestions = selectedProjectType?.intakeQuestions ?? [];
  const isCustomProjectType = formData.projectTypeId === 'other';

  useEffect(() => {
    if (isCustomProjectType) {
      const generalRequirements = formData.intakeResponses['general-requirements'];
      const valid = typeof generalRequirements === 'string' && generalRequirements.trim().length > 0;
      setIsValid(valid);
      return;
    }

    const valid = intakeQuestions.every((question) => {
      if (!question.required) return true;
      return isQuestionAnswered(question, formData.intakeResponses[question.id]);
    });
    setIsValid(valid);
  }, [formData.intakeResponses, intakeQuestions, isCustomProjectType, setIsValid]);

  const updateIntakeResponse = (question: IntakeQuestion, value: string | number | string[]) => {
    const nextResponses = {
      ...formData.intakeResponses,
      [question.id]: value,
    };
    updateFormData({ intakeResponses: nextResponses });

    if (question.required && isQuestionAnswered(question, value)) {
      clearValidationError(question.id);
    }
  };

  const updateGeneralRequirements = (value: string) => {
    updateFormData({
      intakeResponses: {
        ...formData.intakeResponses,
        'general-requirements': value,
      },
    });

    if (value.trim().length > 0) {
      clearValidationError('general-requirements');
    }
  };

  if (isCustomProjectType) {
    const generalRequirements = formData.intakeResponses['general-requirements'];

    return (
      <div className="space-y-4 animate-fade-in">
        <div>
          <h3 className="text-sm font-medium text-foreground">Tell us about your project requirements</h3>
          <p className="text-sm text-muted-foreground">
            These details help us tailor the provider match to your requirements.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="general-requirements" className="text-sm">
            Project requirements<span className="text-destructive"> *</span>
          </Label>
          <Textarea
            id="general-requirements"
            value={typeof generalRequirements === 'string' ? generalRequirements : ''}
            onChange={(event) => updateGeneralRequirements(event.target.value)}
            placeholder="Describe what you need from an implementation partner. Include current systems, desired outcomes, user counts, integration needs, and any other relevant details."
            className="min-h-[150px]"
          />
          {validationErrors['general-requirements'] && (
            <p className="text-xs text-destructive">{validationErrors['general-requirements']}</p>
          )}
        </div>
      </div>
    );
  }

  const projectTypeLabel = selectedProjectType?.name ?? 'implementation';

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-sm font-medium text-foreground">Tell us about your {projectTypeLabel} project</h3>
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
            const value = formData.intakeResponses[question.id];
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
                  <>
                    <Input
                      id={question.id}
                      type="number"
                      value={value === undefined || value === null ? '' : String(value)}
                      onChange={(event) => {
                        const nextValue = event.target.value === '' ? '' : Number(event.target.value);
                        updateIntakeResponse(question, nextValue);
                      }}
                      placeholder="Enter a number..."
                    />
                    {NUMBER_HINTS[question.id] && (
                      <p className="text-xs text-muted-foreground">{NUMBER_HINTS[question.id]}</p>
                    )}
                  </>
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
                            updateIntakeResponse(question, `${OTHER_PREFIX}`);
                            return;
                          }

                          updateIntakeResponse(question, nextValue);
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
                          onChange={(event) =>
                            updateIntakeResponse(question, `${OTHER_PREFIX}${event.target.value}`)
                          }
                          placeholder="Please specify..."
                        />
                      )}
                    </div>
                  );
                })()}

                {question.type === 'multiselect' && (() => {
                  const selectedValues = normalizeStringArray(value);
                  const options = withOtherOption(question.options).filter(
                    (option) => option !== OTHER_OPTION
                  );
                  const otherEntry = selectedValues.find(
                    (item) => item === OTHER_OPTION || isOtherValue(item)
                  );
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
                                  updateIntakeResponse(question, nextValues);
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
                              updateIntakeResponse(question, nextValues);
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
                            updateIntakeResponse(question, [...withoutOther, nextOtherValue]);
                          }}
                          placeholder="Please specify..."
                        />
                      )}
                    </div>
                  );
                })()}

                {question.helpText && <p className="text-xs text-muted-foreground">{question.helpText}</p>}
                {hasError && <p className="text-xs text-destructive">{validationErrors[question.id]}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
