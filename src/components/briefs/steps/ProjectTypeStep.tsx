import { useEffect } from 'react';
import { aecProjectTypes } from '@/data/aecProjectTypes';
import { BriefStepProps } from '@/types/briefForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ProjectTypeStepProps extends BriefStepProps {
  projectTypeError?: string;
  clearProjectTypeError: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export function ProjectTypeStep({
  formData,
  updateFormData,
  setIsValid,
  projectTypeError,
  clearProjectTypeError,
}: ProjectTypeStepProps) {
  const isOtherProjectTypeSelected = formData.projectTypeId === 'other';
  const customProjectType = formData.customProjectType ?? '';

  useEffect(() => {
    const valid =
      Boolean(formData.projectTypeId) &&
      (!isOtherProjectTypeSelected || customProjectType.trim().length > 0);
    setIsValid(valid);
  }, [customProjectType, formData.projectTypeId, isOtherProjectTypeSelected, setIsValid]);

  const handleSelect = (projectTypeId: string) => {
    if (projectTypeId === 'other') {
      updateFormData({ projectTypeId });
      clearProjectTypeError();
      return;
    }

    updateFormData({ projectTypeId, customProjectType: undefined });
    clearProjectTypeError();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-sm font-medium text-foreground">Select a project type</h3>
        <p className="text-sm text-muted-foreground">
          Choose the AEC implementation category that best fits this brief.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aecProjectTypes.map((projectType) => {
          const isSelected = projectType.id === formData.projectTypeId;
          return (
            <button
              key={projectType.id}
              type="button"
              onClick={() => handleSelect(projectType.id)}
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
                      <CardDescription className="mt-1">{projectType.category}</CardDescription>
                    </div>
                    {isSelected && (
                      <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{projectType.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="text-foreground">
                      {formatCurrency(projectType.typicalBudgetMin)} - {formatCurrency(projectType.typicalBudgetMax)}
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

        <button
          type="button"
          onClick={() => handleSelect('other')}
          className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
        >
          <Card
            className={cn(
              'h-full transition border',
              isOtherProjectTypeSelected
                ? 'border-primary/60 ring-2 ring-primary/30'
                : 'hover:border-muted-foreground/40'
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Other / Custom</CardTitle>
                  <CardDescription className="mt-1">Custom</CardDescription>
                </div>
                {isOtherProjectTypeSelected && (
                  <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    Selected
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                My project doesn&apos;t fit these categories
              </p>
            </CardContent>
          </Card>
        </button>
      </div>

      {isOtherProjectTypeSelected && (
        <div className="space-y-1">
          <Label htmlFor="customProjectType">Describe your project type *</Label>
          <Input
            id="customProjectType"
            value={customProjectType}
            onChange={(event) => {
              updateFormData({ customProjectType: event.target.value });
              if (event.target.value.trim()) {
                clearProjectTypeError();
              }
            }}
            placeholder="e.g., Safety management system rollout, fleet telematics integration..."
          />
        </div>
      )}

      {projectTypeError && <p className="text-sm text-destructive">{projectTypeError}</p>}
    </div>
  );
}
