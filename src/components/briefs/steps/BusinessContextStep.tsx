import { useEffect } from 'react';
import { BriefStepProps } from '@/types/briefForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface BusinessContextStepProps extends BriefStepProps {
  validationErrors: Record<string, string>;
  clearValidationError: (fieldKey: string) => void;
}

export function BusinessContextStep({
  formData,
  updateFormData,
  setIsValid,
  validationErrors,
  clearValidationError,
}: BusinessContextStepProps) {
  const context = formData.businessContext;

  useEffect(() => {
    const valid =
      context.companyName.trim().length > 0 &&
      context.currentState.trim().length > 0 &&
      context.desiredOutcome.trim().length > 0;
    setIsValid(valid);
  }, [context.companyName, context.currentState, context.desiredOutcome, setIsValid]);

  const updateContext = (updates: Partial<typeof context>) => {
    const nextContext = { ...context, ...updates };
    updateFormData({ businessContext: nextContext });

    if (updates.companyName !== undefined && nextContext.companyName.trim()) {
      clearValidationError('companyName');
    }
    if (updates.currentState !== undefined && nextContext.currentState.trim()) {
      clearValidationError('currentState');
    }
    if (updates.desiredOutcome !== undefined && nextContext.desiredOutcome.trim()) {
      clearValidationError('desiredOutcome');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-sm font-medium text-foreground">Business context</h3>
        <p className="text-sm text-muted-foreground">
          Capture the high-level context so we can tailor providers and scope.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="companyName">Company name *</Label>
          <Input
            id="companyName"
            value={context.companyName}
            onChange={(event) => updateContext({ companyName: event.target.value })}
            placeholder="e.g., North Ridge Constructors"
          />
          {validationErrors.companyName && (
            <p className="text-xs text-destructive">{validationErrors.companyName}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Company size</Label>
          <Select
            value={context.companySize}
            onValueChange={(value) => updateContext({ companySize: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select size..." />
            </SelectTrigger>
            <SelectContent>
              {['1-10', '11-50', '51-200', '201-500', '500+'].map((size) => (
                <SelectItem key={size} value={size}>
                  {size} employees
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Industry segment</Label>
          <Select
            value={context.industry}
            onValueChange={(value) => updateContext({ industry: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select segment..." />
            </SelectTrigger>
            <SelectContent>
              {[
                'General Contractor',
                'Specialty Contractor',
                'Civil/Heavy',
                'Residential Builder',
                'Commercial Developer',
                'Engineering Firm',
                'Architecture Firm',
                'Owner/Operator',
              ].map((segment) => (
                <SelectItem key={segment} value={segment}>
                  {segment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Decision timeline</Label>
          <Select
            value={context.decisionTimeline}
            onValueChange={(value) => updateContext({ decisionTimeline: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timeline..." />
            </SelectTrigger>
            <SelectContent>
              {[
                'Ready to decide now',
                'Within 2 weeks',
                'Within 1 month',
                'Within 3 months',
                'Just exploring',
              ].map((timeline) => (
                <SelectItem key={timeline} value={timeline}>
                  {timeline}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="currentState">Current state *</Label>
        <Textarea
          id="currentState"
          value={context.currentState}
          onChange={(event) => updateContext({ currentState: event.target.value })}
          placeholder="Describe your current systems and processes..."
          className="min-h-[110px]"
        />
        {validationErrors.currentState && (
          <p className="text-xs text-destructive">{validationErrors.currentState}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="desiredOutcome">Desired outcome *</Label>
        <Textarea
          id="desiredOutcome"
          value={context.desiredOutcome}
          onChange={(event) => updateContext({ desiredOutcome: event.target.value })}
          placeholder="What does success look like?"
          className="min-h-[110px]"
        />
        {validationErrors.desiredOutcome && (
          <p className="text-xs text-destructive">{validationErrors.desiredOutcome}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="keyStakeholders">Key stakeholders</Label>
        <Input
          id="keyStakeholders"
          value={context.keyStakeholders}
          onChange={(event) => updateContext({ keyStakeholders: event.target.value })}
          placeholder="Who will be involved in this project?"
        />
      </div>
    </div>
  );
}
