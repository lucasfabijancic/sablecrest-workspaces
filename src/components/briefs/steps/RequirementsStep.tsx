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

  useEffect(() => {
    const valid = intakeQuestions.every((question) => {
      if (!question.required) return true;
      return isQuestionAnswered(question, formData.intakeResponses[question.id]);
    });
    setIsValid(valid);
  }, [formData.intakeResponses, intakeQuestions, setIsValid]);

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

  const projectTypeLabel = selectedProjectType?.name ?? 'implementation';

  return (
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
                  </div>
                )}

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
