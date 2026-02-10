import { useMemo, useState } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import type { AECProjectType } from '@/data/aecProjectTypes';
import type { ImplementationBrief, SuccessCriterion } from '@/types/brief';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface DefineSuccessProps {
  brief: ImplementationBrief;
  projectType: AECProjectType | null;
  onUpdate: (updates: Partial<ImplementationBrief>) => void;
}

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

const METRIC_PLACEHOLDERS: Record<string, string> = {
  'erp-implementation': 'e.g., Reduce month-end close from 12 days to 5 days',
  'pm-software': 'e.g., Achieve 90% field user adoption within 60 days',
  'bim-vdc': 'e.g., Reduce clash detection resolution time by 40%',
  'estimating-takeoff': 'e.g., Cut estimate turnaround from 2 weeks to 3 days',
  'ai-automation': 'e.g., Automate 60% of invoice processing within 90 days',
  'system-integration': 'e.g., Eliminate duplicate data entry across 3 systems',
};

const DEFAULT_METRIC_PLACEHOLDER = 'e.g., Reduce processing time from X to Y';

const OTHER_OPTION = 'Other';
const OTHER_PREFIX = 'Other: ';

const isOtherValue = (value: string) => value.startsWith(OTHER_PREFIX);
const extractOtherText = (value: string) => (isOtherValue(value) ? value.slice(OTHER_PREFIX.length) : '');

const withOtherOption = (options: readonly string[]) => {
  const filtered = options.filter((option) => option !== OTHER_OPTION);
  return [...filtered, OTHER_OPTION];
};

const createCriterion = (): SuccessCriterion => ({
  id:
    globalThis.crypto?.randomUUID?.() ??
    `criterion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  metric: '',
  baseline: '',
  target: '',
  measurementMethod: '',
  timeframe: '',
  weight: 5,
  source: 'client',
  confirmedByClient: false,
});

const isCriterionValid = (criterion: SuccessCriterion) => {
  return criterion.metric.trim().length > 0 && criterion.target.trim().length > 0;
};

const normalizeWeight = (weight: number | undefined) => {
  if (typeof weight !== 'number' || Number.isNaN(weight)) {
    return 5;
  }

  return Math.min(10, Math.max(1, Math.round(weight)));
};

const formatValue = (value: string | undefined) => {
  if (!value || value.trim().length === 0) {
    return 'Not specified';
  }

  return isOtherValue(value) ? extractOtherText(value).trim() || 'Other' : value;
};

function CriterionFields({
  criterion,
  metricPlaceholder,
  onChange,
}: {
  criterion: SuccessCriterion;
  metricPlaceholder: string;
  onChange: (updates: Partial<SuccessCriterion>) => void;
}) {
  const measurementValue = criterion.measurementMethod ?? '';
  const measurementSelectValue = isOtherValue(measurementValue) ? OTHER_OPTION : measurementValue;
  const measurementOtherText = extractOtherText(measurementValue);

  const timeframeValue = criterion.timeframe ?? '';
  const timeframeSelectValue = isOtherValue(timeframeValue) ? OTHER_OPTION : timeframeValue;
  const timeframeOtherText = extractOtherText(timeframeValue);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`metric-${criterion.id}`}>Metric *</Label>
          <Input
            id={`metric-${criterion.id}`}
            value={criterion.metric}
            onChange={(event) => onChange({ metric: event.target.value })}
            placeholder={metricPlaceholder}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`target-${criterion.id}`}>Target *</Label>
          <Input
            id={`target-${criterion.id}`}
            value={criterion.target}
            onChange={(event) => onChange({ target: event.target.value })}
            placeholder="Target state or number"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`baseline-${criterion.id}`}>Baseline</Label>
          <Input
            id={`baseline-${criterion.id}`}
            value={criterion.baseline ?? ''}
            onChange={(event) => onChange({ baseline: event.target.value })}
            placeholder="Current state or number"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Measurement Method</Label>
          <div className="space-y-2">
            <Select
              value={measurementSelectValue}
              onValueChange={(value) =>
                onChange({
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

            {measurementSelectValue === OTHER_OPTION && (
              <Input
                value={measurementOtherText}
                onChange={(event) =>
                  onChange({
                    measurementMethod: `${OTHER_PREFIX}${event.target.value}`,
                  })
                }
                placeholder="Please specify..."
              />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Timeframe</Label>
          <div className="space-y-2">
            <Select
              value={timeframeSelectValue}
              onValueChange={(value) =>
                onChange({
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
                  onChange({
                    timeframe: `${OTHER_PREFIX}${event.target.value}`,
                  })
                }
                placeholder="Please specify..."
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-md border border-border/70 bg-muted/10 p-3">
        <p className="text-sm font-medium text-foreground">How important is this to you?</p>
        <p className="text-xs text-muted-foreground">
          Your Sablecrest advisor will use this to prioritize provider matching.
        </p>
        <div className="space-y-2">
          <div className="text-sm text-foreground">Weight: {normalizeWeight(criterion.weight)}/10</div>
          <Slider
            id={`weight-${criterion.id}`}
            min={1}
            max={10}
            step={1}
            value={[normalizeWeight(criterion.weight)]}
            onValueChange={(value) => onChange({ weight: value[0] ?? 5 })}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Low</span>
            <span>Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadOnlyCriterion({ criterion }: { criterion: SuccessCriterion }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Metric</p>
        <p className="text-sm text-foreground">{formatValue(criterion.metric)}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Target</p>
        <p className="text-sm text-foreground">{formatValue(criterion.target)}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Baseline</p>
        <p className="text-sm text-foreground">{formatValue(criterion.baseline)}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Measurement Method</p>
        <p className="text-sm text-foreground">{formatValue(criterion.measurementMethod)}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Timeframe</p>
        <p className="text-sm text-foreground">{formatValue(criterion.timeframe)}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Weight</p>
        <p className="text-sm text-foreground">{normalizeWeight(criterion.weight)}/10</p>
      </div>
    </div>
  );
}

export default function DefineSuccess({ brief, projectType, onUpdate }: DefineSuccessProps) {
  const [editingById, setEditingById] = useState<Record<string, boolean>>({});

  const criteria = brief.successCriteria ?? [];
  const totalCriteria = criteria.length;

  const advisorCriteria = useMemo(
    () => criteria.filter((criterion) => criterion.source === 'advisor'),
    [criteria]
  );

  const additionalCriteria = useMemo(
    () => criteria.filter((criterion) => criterion.source !== 'advisor'),
    [criteria]
  );

  const hasValidCriterion = useMemo(
    () => criteria.some((criterion) => isCriterionValid(criterion)),
    [criteria]
  );

  const metricPlaceholder =
    METRIC_PLACEHOLDERS[projectType?.id ?? ''] ?? DEFAULT_METRIC_PLACEHOLDER;

  const updateCriteria = (nextCriteria: SuccessCriterion[]) => {
    onUpdate({ successCriteria: nextCriteria });
  };

  const updateCriterion = (criterionId: string, updates: Partial<SuccessCriterion>) => {
    const nextCriteria = criteria.map((criterion) =>
      criterion.id === criterionId
        ? {
            ...criterion,
            ...updates,
          }
        : criterion
    );

    updateCriteria(nextCriteria);
  };

  const removeCriterion = (criterionId: string) => {
    const nextCriteria = criteria.filter((criterion) => criterion.id !== criterionId);
    updateCriteria(nextCriteria);
  };

  const addCriterion = () => {
    if (totalCriteria >= 10) {
      return;
    }

    updateCriteria([...criteria, createCriterion()]);
  };

  return (
    <Card className="border-border/80">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">Define Success</CardTitle>
        {!hasValidCriterion && (
          <p className="text-sm text-destructive">
            Add at least one success criterion with both metric and target.
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-5 pt-0">
        {advisorCriteria.length > 0 ? (
          <div className="space-y-4">
            {advisorCriteria.map((criterion) => {
              const isEditing = Boolean(editingById[criterion.id]);
              const isConfirmed = criterion.confirmedByClient === true;

              return (
                <Card key={criterion.id} className="border-border/70">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Suggested by Sablecrest</Badge>
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1 text-xs text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Confirmed
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 rounded-md border border-border/70 px-2 py-1">
                          <Label htmlFor={`confirm-${criterion.id}`} className="text-xs">
                            Confirm
                          </Label>
                          <Switch
                            id={`confirm-${criterion.id}`}
                            checked={isConfirmed}
                            onCheckedChange={(checked) =>
                              updateCriterion(criterion.id, {
                                confirmedByClient: checked,
                                source: 'advisor',
                              })
                            }
                          />
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant={isEditing ? 'default' : 'outline'}
                          onClick={() =>
                            setEditingById((previous) => ({
                              ...previous,
                              [criterion.id]: !previous[criterion.id],
                            }))
                          }
                        >
                          {isEditing ? 'Done Editing' : 'Edit'}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCriterion(criterion.id)}
                        >
                          <Trash2 className="mr-1.5 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>

                    {isEditing ? (
                      <CriterionFields
                        criterion={criterion}
                        metricPlaceholder={metricPlaceholder}
                        onChange={(updates) => updateCriterion(criterion.id, updates)}
                      />
                    ) : (
                      <ReadOnlyCriterion criterion={criterion} />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your advisor has not pre-defined success criteria. Please define how you will measure the success of this implementation.
          </p>
        )}

        <Separator />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-medium text-foreground">Add Your Own</h3>
              <p className="text-sm text-muted-foreground">
                Add additional outcomes that matter to your team.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addCriterion}
              disabled={totalCriteria >= 10}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Criterion
            </Button>
          </div>

          {totalCriteria >= 10 && (
            <p className="text-xs text-muted-foreground">
              You can add up to 10 criteria total.
            </p>
          )}

          {additionalCriteria.map((criterion) => (
            <Card key={criterion.id} className="border-border/70">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline">{criterion.source === 'ai' ? 'AI Suggested' : 'Client Criterion'}</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCriterion(criterion.id)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <CriterionFields
                  criterion={criterion}
                  metricPlaceholder={metricPlaceholder}
                  onChange={(updates) =>
                    updateCriterion(criterion.id, {
                      ...updates,
                      source: criterion.source ?? 'client',
                    })
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
