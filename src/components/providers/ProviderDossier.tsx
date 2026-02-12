import {
  AlertTriangle,
  Briefcase,
  ExternalLink,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import type { ProviderEvidence, ProviderProfile } from '@/types/provider';
import TierBadge from '@/components/providers/TierBadge';
import VerificationBadge from '@/components/providers/VerificationBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { assertUnreachable } from '@/lib/assertUnreachable';
import { cn } from '@/lib/utils';

interface ProviderDossierProps {
  provider: ProviderProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToShortlist?: (providerId: string) => void;
  isShortlisted?: boolean;
}

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') return 'Not provided';
  return `$${value.toLocaleString()}`;
};

const getEvidenceIcon = (type: ProviderEvidence['type']) => {
  switch (type) {
    case 'Certification':
    case 'Insurance':
      return ShieldCheck;
    case 'SOW Sample':
    case 'Contract Template':
      return Briefcase;
    case 'Case Study':
    case 'Reference Letter':
    case 'Audit Report':
      return FileText;
    default:
      return assertUnreachable(type);
  }
};

const getVisibilityClass = (visibility: ProviderEvidence['visibility']) => {
  switch (visibility) {
    case 'Public':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';
    case 'NDA Required':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300';
    case 'Sablecrest Only':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
    case 'By Request':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300';
    default:
      return assertUnreachable(visibility);
  }
};

const getReferenceAvailabilityClass = (availability: ProviderProfile['references'][number]['availability']) => {
  switch (availability) {
    case 'Available':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';
    case 'After NDA':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300';
    case 'By Request':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getSuccessRateClass = (value?: number) => {
  if (typeof value !== 'number') return 'text-muted-foreground';
  if (value >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (value >= 70) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

const isExpiringSoon = (expiresAt?: string) => {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return false;

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  return expiry >= now && expiry <= ninetyDaysFromNow;
};

const formatDate = (value?: string) => {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleDateString();
};

export default function ProviderDossier({
  provider,
  isOpen,
  onClose,
  onAddToShortlist,
  isShortlisted = false,
}: ProviderDossierProps) {
  if (!provider || !isOpen) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <SheetTitle className="text-2xl leading-tight">{provider.name}</SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <TierBadge tier={provider.tier} />
                <VerificationBadge level={provider.overallVerification} />
              </div>
            </div>
          </div>
          <SheetDescription>
            Provider dossier with capabilities, delivery profile, evidence, and performance history.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="mb-4 h-auto flex-wrap justify-start">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="references">References</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-5 mt-0">
              <p className="text-sm text-foreground leading-relaxed">{provider.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Founded</p>
                  <p className="mt-1 text-sm font-medium">{provider.founded ?? 'Not provided'}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Employees</p>
                  <p className="mt-1 text-sm font-medium">{provider.employeeCountRange}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Headquarters</p>
                  <p className="mt-1 text-sm font-medium">{provider.headquarters ?? 'Not provided'}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Regions</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {provider.regions.length > 0 ? (
                      provider.regions.map((region) => (
                        <Badge key={region} variant="secondary" className="text-xs">
                          {region}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Not provided</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Capabilities</h4>
                {provider.capabilities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No capabilities listed.</p>
                ) : (
                  <div className="space-y-2">
                    {provider.capabilities.map((capability, index) => (
                      <div
                        key={`${capability.capability}-${index}`}
                        className="rounded-md border border-border p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{capability.capability}</p>
                            <p className="text-xs text-muted-foreground">
                              Experience: {capability.experienceLevel}
                            </p>
                          </div>
                          <VerificationBadge level={capability.verificationLevel} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">AEC Specializations</h4>
                <div className="flex flex-wrap gap-1.5">
                  {provider.aecSpecializations.length > 0 ? (
                    provider.aecSpecializations.map((specialization) => (
                      <Badge key={specialization} variant="outline" className="text-xs">
                        {specialization}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Not provided</span>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team" className="mt-0">
              {provider.teamMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Team information not available.</p>
              ) : (
                <div className={cn('grid gap-3', provider.teamMembers.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1')}>
                  {provider.teamMembers.map((member) => (
                    <div key={member.id} className="rounded-md border border-border p-4 space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.title}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {typeof member.yearsExperience === 'number'
                            ? `${member.yearsExperience} years experience`
                            : 'Experience not provided'}
                        </span>
                        <VerificationBadge level={member.verificationLevel} size="sm" />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {member.specializations.length > 0 ? (
                          member.specializations.map((specialization) => (
                            <Badge key={specialization} variant="secondary" className="text-xs">
                              {specialization}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No specializations listed.</span>
                        )}
                      </div>

                      {member.linkedIn ? (
                        <a
                          href={member.linkedIn}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          LinkedIn
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="delivery" className="space-y-5 mt-0">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Delivery Models</h4>
                <div className="flex flex-wrap gap-1.5">
                  {provider.deliveryModels.length > 0 ? (
                    provider.deliveryModels.map((model) => (
                      <Badge key={model} variant="secondary" className="text-xs">
                        {model}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Not provided</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Pricing Models</h4>
                <div className="flex flex-wrap gap-1.5">
                  {provider.pricingModels.length > 0 ? (
                    provider.pricingModels.map((model) => (
                      <Badge key={model} variant="outline" className="text-xs">
                        {model}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Not provided</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Typical Engagement Length</p>
                  <p className="mt-1 text-sm font-medium">
                    {provider.typicalEngagementWeeks
                      ? `${provider.typicalEngagementWeeks.min}-${provider.typicalEngagementWeeks.max} weeks`
                      : 'Not provided'}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Lead Time</p>
                  <p className="mt-1 text-sm font-medium">
                    {typeof provider.leadTimeWeeks === 'number'
                      ? `${provider.leadTimeWeeks} weeks`
                      : 'Not provided'}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Budget Range</p>
                  <p className="mt-1 text-sm font-medium">
                    {formatCurrency(provider.typicalBudgetMin)} - {formatCurrency(provider.typicalBudgetMax)}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="evidence" className="mt-0">
              {provider.evidence.length === 0 ? (
                <p className="text-sm text-muted-foreground">No evidence documents uploaded.</p>
              ) : (
                <div className="space-y-3">
                  {provider.evidence.map((item) => {
                    const EvidenceIcon = getEvidenceIcon(item.type);
                    const showExpiryWarning = isExpiringSoon(item.expiresAt);

                    return (
                      <div key={item.id} className="rounded-md border border-border p-3 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <EvidenceIcon className="h-4 w-4 mt-0.5 text-muted-foreground" aria-hidden="true" />
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.type}</p>
                            </div>
                          </div>
                          <VerificationBadge level={item.verificationLevel} size="sm" />
                        </div>

                        {item.description ? <p className="text-sm text-muted-foreground">{item.description}</p> : null}

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn('text-xs border border-transparent', getVisibilityClass(item.visibility))}>
                            {item.visibility}
                          </Badge>

                          {showExpiryWarning ? (
                            <Badge className="text-xs border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Expires soon ({formatDate(item.expiresAt)})
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="references" className="mt-0">
              {provider.references.length === 0 ? (
                <p className="text-sm text-muted-foreground">No references listed.</p>
              ) : (
                <div className="space-y-3">
                  {provider.references.map((reference) => (
                    <div key={reference.id} className="rounded-md border border-border p-3 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{reference.companyName}</p>
                          <p className="text-xs text-muted-foreground">
                            {reference.contactTitle || 'Contact title not shared'}
                          </p>
                        </div>
                        <VerificationBadge level={reference.verificationLevel} size="sm" />
                      </div>

                      <p className="text-xs text-muted-foreground">Project type: {reference.projectType}</p>

                      {reference.projectDescription ? (
                        <p className="text-sm text-muted-foreground">{reference.projectDescription}</p>
                      ) : null}

                      <Badge
                        className={cn(
                          'text-xs border border-transparent',
                          getReferenceAvailabilityClass(reference.availability)
                        )}
                      >
                        {reference.availability}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="performance" className="mt-0">
              {provider.performanceMetrics ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Engagements</p>
                    <p className="mt-1 text-lg font-semibold">{provider.performanceMetrics.totalEngagements}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
                    <p className="mt-1 text-lg font-semibold">{provider.performanceMetrics.completedEngagements}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Success Rate</p>
                    <p className={cn('mt-1 text-lg font-semibold', getSuccessRateClass(provider.performanceMetrics.successRate))}>
                      {typeof provider.performanceMetrics.successRate === 'number'
                        ? `${provider.performanceMetrics.successRate}%`
                        : 'Not available'}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Average NPS</p>
                    <p className="mt-1 text-lg font-semibold">
                      {typeof provider.performanceMetrics.averageNps === 'number'
                        ? provider.performanceMetrics.averageNps
                        : 'Not available'}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">On-Time Delivery Rate</p>
                    <p className="mt-1 text-lg font-semibold">
                      {typeof provider.performanceMetrics.onTimeDeliveryRate === 'number'
                        ? `${provider.performanceMetrics.onTimeDeliveryRate}%`
                        : 'Not available'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Performance data not yet available. This provider has not completed enough tracked engagements.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border sm:justify-between">
          <div>
            {onAddToShortlist ? (
              <Button
                onClick={() => onAddToShortlist(provider.id)}
                disabled={isShortlisted}
              >
                {isShortlisted ? 'Already Shortlisted' : 'Add to Shortlist'}
              </Button>
            ) : null}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
