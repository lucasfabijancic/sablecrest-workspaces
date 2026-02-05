import { useEffect, useMemo, useState } from 'react';
import { Calendar, Cpu, DollarSign, Shield, X } from 'lucide-react';
import type { BriefConstraints } from '@/types/brief';
import type { BriefStepProps } from '@/types/briefForm';
import type { SensitivityLevel, TimelineUrgency } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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

const AEC_SYSTEM_SUGGESTIONS = [
  'Sage 300 CRE',
  'Viewpoint Vista',
  'CMiC',
  'Procore',
  'PlanGrid',
  'Bluebeam',
  'QuickBooks',
  'ADP',
  'Paylocity',
  'Foundation Software',
  'Trimble',
  'Autodesk',
];

const listToTextarea = (items?: string[]) => (items && items.length > 0 ? items.join('\n') : '');

const textareaToList = (value: string): string[] =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

export default function ConstraintsStep({ formData, updateFormData, setIsValid }: BriefStepProps) {
  const [mustIntegrateInput, setMustIntegrateInput] = useState('');
  const constraints = formData.constraints;

  const budgetError = useMemo(() => {
    const min = constraints.budget.min;
    const max = constraints.budget.max;
    if (typeof min === 'number' && typeof max === 'number' && max < min) {
      return 'Budget maximum must be greater than or equal to budget minimum.';
    }
    return '';
  }, [constraints.budget.max, constraints.budget.min]);

  useEffect(() => {
    const hasUrgency = Boolean(constraints.timeline.urgency);
    const hasSensitivity = Boolean(constraints.sensitivity.level);
    setIsValid(hasUrgency && hasSensitivity && !budgetError);
  }, [budgetError, constraints.sensitivity.level, constraints.timeline.urgency, setIsValid]);

  const updateConstraints = (nextConstraints: BriefConstraints) => {
    updateFormData({ constraints: nextConstraints });
  };

  const updateBudget = (updates: Partial<BriefConstraints['budget']>) => {
    updateConstraints({
      ...constraints,
      budget: {
        ...constraints.budget,
        ...updates,
      },
    });
  };

  const updateTimeline = (updates: Partial<BriefConstraints['timeline']>) => {
    updateConstraints({
      ...constraints,
      timeline: {
        ...constraints.timeline,
        ...updates,
      },
    });
  };

  const updateSensitivity = (updates: Partial<BriefConstraints['sensitivity']>) => {
    updateConstraints({
      ...constraints,
      sensitivity: {
        ...constraints.sensitivity,
        ...updates,
      },
    });
  };

  const updateTechnical = (updates: Partial<BriefConstraints['technical']>) => {
    updateConstraints({
      ...constraints,
      technical: {
        ...constraints.technical,
        ...updates,
      },
    });
  };

  const addMustIntegrate = (value: string) => {
    const nextValue = value.trim();
    if (!nextValue) return;

    const alreadyAdded = constraints.technical.mustIntegrate.some(
      (item) => item.toLowerCase() === nextValue.toLowerCase()
    );
    if (alreadyAdded) {
      setMustIntegrateInput('');
      return;
    }

    updateTechnical({
      mustIntegrate: [...constraints.technical.mustIntegrate, nextValue],
    });
    setMustIntegrateInput('');
  };

  const removeMustIntegrate = (value: string) => {
    updateTechnical({
      mustIntegrate: constraints.technical.mustIntegrate.filter((item) => item !== value),
    });
  };

  const handleBudgetNumberChange = (
    value: string,
    field: 'min' | 'max'
  ) => {
    const parsed = value === '' ? undefined : Number(value);
    updateBudget({ [field]: Number.isNaN(parsed) ? undefined : parsed } as Partial<BriefConstraints['budget']>);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Budget</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="budget-min">Budget Minimum</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="budget-min"
                type="number"
                placeholder="50000"
                className="pl-7"
                value={constraints.budget.min ?? ''}
                onChange={(event) => handleBudgetNumberChange(event.target.value, 'min')}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="budget-max">Budget Maximum</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="budget-max"
                type="number"
                placeholder="200000"
                className="pl-7"
                value={constraints.budget.max ?? ''}
                onChange={(event) => handleBudgetNumberChange(event.target.value, 'max')}
              />
            </div>
          </div>
        </div>

        {budgetError && <p className="text-xs text-destructive">{budgetError}</p>}

        <div className="space-y-2">
          <Label>Flexibility</Label>
          <RadioGroup
            value={constraints.budget.flexibility}
            onValueChange={(value) => updateBudget({ flexibility: value as 'Firm' | 'Flexible' })}
            className="gap-3"
          >
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <RadioGroupItem value="Firm" id="budget-firm" className="mt-0.5" />
              <span>
                <span className="font-medium text-foreground">Firm</span>
                <span className="block text-muted-foreground">Firm budget - cannot exceed maximum</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <RadioGroupItem value="Flexible" id="budget-flexible" className="mt-0.5" />
              <span>
                <span className="font-medium text-foreground">Flexible</span>
                <span className="block text-muted-foreground">Some flexibility - can discuss if justified</span>
              </span>
            </label>
          </RadioGroup>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Timeline</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Urgency *</Label>
            <Select
              value={constraints.timeline.urgency ?? ''}
              onValueChange={(value) => updateTimeline({ urgency: value as TimelineUrgency })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select urgency..." />
              </SelectTrigger>
              <SelectContent>
                {TIMELINE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="hard-deadline">Hard Deadline</Label>
            <Input
              id="hard-deadline"
              type="date"
              value={constraints.timeline.hardDeadline ?? ''}
              onChange={(event) => updateTimeline({ hardDeadline: event.target.value })}
            />
          </div>
        </div>

        {constraints.timeline.hardDeadline && (
          <div className="space-y-1">
            <Label htmlFor="deadline-reason">Deadline Reason</Label>
            <Input
              id="deadline-reason"
              value={constraints.timeline.reason ?? ''}
              onChange={(event) => updateTimeline({ reason: event.target.value })}
              placeholder="e.g., Fiscal year end, project start date, regulatory requirement"
            />
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Sensitivity</h3>
        </div>

        <div className="space-y-1">
          <Label>Sensitivity Level *</Label>
          <Select
            value={constraints.sensitivity.level ?? ''}
            onValueChange={(value) => updateSensitivity({ level: value as SensitivityLevel })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sensitivity..." />
            </SelectTrigger>
            <SelectContent>
              {SENSITIVITY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="sensitivity-concerns">Specific Concerns</Label>
          <Textarea
            id="sensitivity-concerns"
            value={listToTextarea(constraints.sensitivity.concerns)}
            onChange={(event) => updateSensitivity({ concerns: textareaToList(event.target.value) })}
            placeholder="e.g., Competitor visibility, employee data handling, IP protection"
            className="min-h-[90px]"
          />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Technical Constraints</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="must-integrate">Must Integrate With</Label>
          <Input
            id="must-integrate"
            value={mustIntegrateInput}
            onChange={(event) => setMustIntegrateInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addMustIntegrate(mustIntegrateInput);
              }
            }}
            placeholder="Type a system and press Enter..."
          />

          <div className="flex flex-wrap gap-2">
            {AEC_SYSTEM_SUGGESTIONS.map((suggestion) => {
              const isSelected = constraints.technical.mustIntegrate.includes(suggestion);
              return (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={isSelected}
                  onClick={() => addMustIntegrate(suggestion)}
                >
                  {suggestion}
                </Button>
              );
            })}
          </div>

          {constraints.technical.mustIntegrate.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {constraints.technical.mustIntegrate.map((item) => (
                <Badge key={item} variant="secondary" className="gap-1">
                  {item}
                  <button
                    type="button"
                    aria-label={`Remove ${item}`}
                    onClick={() => removeMustIntegrate(item)}
                    className="hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="cannot-change">Cannot Change</Label>
          <Textarea
            id="cannot-change"
            value={listToTextarea(constraints.technical.cannotChange)}
            onChange={(event) => updateTechnical({ cannotChange: textareaToList(event.target.value) })}
            placeholder="Systems or processes that are off-limits for this project..."
            className="min-h-[90px]"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="preferences">Preferences</Label>
          <Textarea
            id="preferences"
            value={listToTextarea(constraints.technical.preferences)}
            onChange={(event) => updateTechnical({ preferences: textareaToList(event.target.value) })}
            placeholder="Any technology preferences, cloud vs on-prem, specific vendors..."
            className="min-h-[90px]"
          />
        </div>
      </Card>
    </div>
  );
}
