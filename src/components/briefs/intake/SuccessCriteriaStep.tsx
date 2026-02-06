import { useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { aecProjectTypes } from '@/data/aecProjectTypes';
import type { SuccessCriterion } from '@/types/brief';
import type { BriefStepProps } from '@/types/briefForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const MEASUREMENT_METHOD_OPTIONS = [
  'System Report',
  'Manual Audit',
  'User Survey',
  'Time Study',
  'Financial Reconciliation',
  'Adoption Analytics',
  'Third-Party Assessment',
] as const;

const TIMEFRAME_OPTIONS = [
  'Phase 1 Go-Live',
  'Full Deployment',
  '30 Days Post-Deployment',
  '90 Days Post-Deployment',
  '6 Months Post-Deployment',
  '12 Months Post-Deployment',
] as const;

const OTHER_OPTION = 'Other';
const OTHER_PREFIX = 'Other: ';

const METRIC_PLACEHOLDERS: Record<string, string> = {
  'erp-implementation': 'e.g., Reduce month-end close from 12 days to 5 days',
  'pm-software': 'e.g., Achieve 90% field user adoption within 60 days',
  'bim-vdc': 'e.g., Reduce clash detection resolution time by 40%',
  'estimating-takeoff': 'e.g., Cut estimate turnaround from 2 weeks to 3 days',
  'ai-automation': 'e.g., Automate 60% of invoice processing within 90 days',
  'system-integration': 'e.g., Eliminate duplicate data entry across 3 systems',
};

const DEFAULT_METRIC_PLACEHOLDER = 'e.g., Reduce processing time from X to Y';

const createCriterion = (): SuccessCriterion => ({
  id: globalThis.crypto?.randomUUID?.() ?? `criterion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  metric: '',
  baseline: '',
  target: '',
  measurementMethod: '',
  timeframe: '',
  weight: 5,
});

const isOtherValue = (value: string) => value.startsWith(OTHER_PREFIX);
const extractOtherText = (value: string) => (isOtherValue(value) ? value.slice(OTHER_PREFIX.length) : '');

const withOtherOption = (options: readonly string[]) => [...options, OTHER_OPTION];

const hasFilledSelectValue = (value: string): boolean =>
  isOtherValue(value) ? extractOtherText(value).trim().length > 0 : value.trim().length > 0;

const isCriterionComplete = (criterion: SuccessCriterion): boolean =>
  criterion.metric.trim().length > 0 &&
  criterion.target.trim().length > 0 &&
  hasFilledSelectValue(criterion.measurementMethod) &&
  hasFilledSelectValue(criterion.timeframe);

export default function SuccessCriteriaStep({ formData, updateFormData, setIsValid }: BriefStepProps) {
  const criteria = formData.successCriteria;

  useEffect(() => {
    if (criteria.length === 0) {
      updateFormData({ successCriteria: [createCriterion()] });
    }
  }, [criteria.length, updateFormData]);

  useEffect(() => {
    const valid = criteria.some(isCriterionComplete);
    setIsValid(valid);
  }, [criteria, setIsValid]);

  const updateCriterion = (id: string, updates: Partial<SuccessCriterion>) => {
    const nextCriteria = criteria.map((criterion) =>
      criterion.id === id ? { ...criterion, ...updates } : criterion
    );
    updateFormData({ successCriteria: nextCriteria });
  };

  const addCriterion = () => {
    if (criteria.length >= 10) return;
    updateFormData({ successCriteria: [...criteria, createCriterion()] });
  };

  const removeCriterion = (id: string) => {
    if (criteria.length <= 1) return;
    const nextCriteria = criteria.filter((criterion) => criterion.id !== id);
    updateFormData({ successCriteria: nextCriteria });
  };

  const selectedProjectType = aecProjectTypes.find((projectType) => projectType.id === formData.projectTypeId);
  const metricPlaceholder =
    METRIC_PLACEHOLDERS[selectedProjectType?.id ?? ''] ?? DEFAULT_METRIC_PLACEHOLDER;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-sm font-medium text-foreground">Define Success Criteria</h3>
        <p className="text-sm text-muted-foreground">
          How will you measure whether this implementation succeeded? Be specific. These criteria will be used to evaluate provider fit and track post-deployment outcomes.
        </p>
      </div>

      <div className="space-y-4">
        {criteria.map((criterion) => (
          <Card key={criterion.id} className="p-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-foreground">Success Criterion</p>
                {criteria.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCriterion(criterion.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor={`metric-${criterion.id}`}>Metric *</Label>
                  <Input
                    id={`metric-${criterion.id}`}
                    value={criterion.metric}
                    onChange={(event) => updateCriterion(criterion.id, { metric: event.target.value })}
                    placeholder={metricPlaceholder}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`target-${criterion.id}`}>Target *</Label>
                  <Input
                    id={`target-${criterion.id}`}
                    value={criterion.target}
                    onChange={(event) => updateCriterion(criterion.id, { target: event.target.value })}
                    placeholder="Target state or number"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`baseline-${criterion.id}`}>Baseline</Label>
                  <Input
                    id={`baseline-${criterion.id}`}
                    value={criterion.baseline ?? ''}
                    onChange={(event) => updateCriterion(criterion.id, { baseline: event.target.value })}
                    placeholder="Current state or number"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Measurement Method *</Label>
                  {(() => {
                    const methodValue = criterion.measurementMethod ?? '';
                    const methodSelectValue = isOtherValue(methodValue) ? OTHER_OPTION : methodValue;
                    const methodOtherText = extractOtherText(methodValue);

                    return (
                      <div className="space-y-2">
                        <Select
                          value={methodSelectValue}
                          onValueChange={(value) =>
                            updateCriterion(criterion.id, {
                              measurementMethod: value === OTHER_OPTION ? `${OTHER_PREFIX}` : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select method..." />
                          </SelectTrigger>
                          <SelectContent>
                            {withOtherOption(MEASUREMENT_METHOD_OPTIONS).map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {methodSelectValue === OTHER_OPTION && (
                          <Input
                            value={methodOtherText}
                            onChange={(event) =>
                              updateCriterion(criterion.id, {
                                measurementMethod: `${OTHER_PREFIX}${event.target.value}`,
                              })
                            }
                            placeholder="Please specify..."
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-1">
                  <Label>Timeframe *</Label>
                  {(() => {
                    const timeframeValue = criterion.timeframe ?? '';
                    const timeframeSelectValue = isOtherValue(timeframeValue)
                      ? OTHER_OPTION
                      : timeframeValue;
                    const timeframeOtherText = extractOtherText(timeframeValue);

                    return (
                      <div className="space-y-2">
                        <Select
                          value={timeframeSelectValue}
                          onValueChange={(value) =>
                            updateCriterion(criterion.id, {
                              timeframe: value === OTHER_OPTION ? `${OTHER_PREFIX}` : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timeframe..." />
                          </SelectTrigger>
                          <SelectContent>
                            {withOtherOption(TIMEFRAME_OPTIONS).map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {timeframeSelectValue === OTHER_OPTION && (
                          <Input
                            value={timeframeOtherText}
                            onChange={(event) =>
                              updateCriterion(criterion.id, {
                                timeframe: `${OTHER_PREFIX}${event.target.value}`,
                              })
                            }
                            placeholder="Please specify..."
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor={`weight-${criterion.id}`}>Importance: {criterion.weight}/10</Label>
                </div>
                <Slider
                  id={`weight-${criterion.id}`}
                  min={1}
                  max={10}
                  step={1}
                  value={[criterion.weight]}
                  onValueChange={(value) => updateCriterion(criterion.id, { weight: value[0] ?? 5 })}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>Critical</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addCriterion}
        disabled={criteria.length >= 10}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Criterion
      </Button>
    </div>
  );
}
