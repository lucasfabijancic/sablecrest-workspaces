import { useEffect, useState } from 'react';
import { X, CheckCircle, Calendar, FileText, Shield, DollarSign, Users, AlertTriangle, BookOpen, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ProviderCardSummary, ProviderPitchbook, VerificationLevel } from '@/data/mockProviders';

interface ProviderDossierOverlayProps {
  provider: ProviderCardSummary | null;
  pitchbook: ProviderPitchbook | null;
  onClose: () => void;
}

const dossierTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'security', label: 'Security' },
  { id: 'commercials', label: 'Commercials' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'references', label: 'References' },
  { id: 'risks', label: 'Risks' },
];

export function ProviderDossierOverlay({ provider, pitchbook, onClose }: ProviderDossierOverlayProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (provider) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [provider, onClose]);

  if (!provider || !pitchbook) return null;

  const getVerificationBadge = (level: VerificationLevel) => {
    const styles: Record<VerificationLevel, string> = {
      'Provider-stated': 'bg-muted text-muted-foreground',
      'Documented': 'bg-status-submitted/12 text-status-submitted',
      'Reference-validated': 'bg-warning/12 text-warning',
      'Sablecrest-assessed': 'bg-success/12 text-success',
    };
    return <span className={cn("text-[10px] px-1.5 py-0.5 inline-block", styles[level])}>{level}</span>;
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Frosted backdrop */}
      <div 
        className="absolute inset-0 bg-black/55 dark:bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Solid content surface */}
      <div className="absolute inset-3 md:inset-6 lg:inset-8 bg-card border border-border overflow-hidden flex flex-col animate-scale-in">
        {/* Facts Strip Header */}
        <header className="shrink-0 border-b border-border">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-muted flex items-center justify-center">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{provider.name}</h2>
                <p className="text-[11px] text-muted-foreground">{provider.category}</p>
              </div>
              <Badge variant={provider.verificationStatus === 'Verified' ? 'default' : 'secondary'} className="text-[10px] ml-2">
                {provider.verificationStatus}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[10px]">
                <FileText className="h-3 w-3 mr-1" />
                Request NDA
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px]">
                Add to Shortlist
              </Button>
              <Button size="sm" className="h-7 text-[10px]">
                <Calendar className="h-3 w-3 mr-1" />
                Schedule Intro
              </Button>
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Quick facts strip */}
          <div className="flex items-center gap-6 px-5 py-2.5 bg-muted/30 border-t border-border text-[11px]">
            <div>
              <span className="text-muted-foreground">Evidence:</span>{' '}
              <span className="font-medium tabular-nums">{provider.evidenceCompleteness}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Regions:</span>{' '}
              <span className="font-medium">{provider.regions?.join(', ') || 'Global'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Budget:</span>{' '}
              <span className="font-medium">{provider.budgetBand || 'Varies'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Timeline:</span>{' '}
              <span className="font-medium">{pitchbook.commercials.typicalEngagement}</span>
            </div>
            <div className="flex items-center gap-1">
              {provider.capabilities?.slice(0, 3).map(cap => (
                <Badge key={cap} variant="secondary" className="text-[9px] px-1.5 py-0">
                  {cap}
                </Badge>
              ))}
              {(provider.capabilities?.length || 0) > 3 && (
                <span className="text-[10px] text-muted-foreground">+{(provider.capabilities?.length || 0) - 3}</span>
              )}
            </div>
          </div>
        </header>

        {/* Tabs + Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="shrink-0 h-10 w-full justify-start px-5 bg-transparent border-b border-border gap-0">
            {dossierTabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="h-10 px-3 text-[11px] data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="max-w-4xl">
              <TabsContent value="overview" className="mt-0 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  {getVerificationBadge(pitchbook.summary.verificationLevel)}
                </div>
                <p className="text-[13px] text-foreground leading-relaxed">{pitchbook.summary.overview}</p>
                
                <div className="grid gap-5 md:grid-cols-2 mt-6">
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Key Strengths</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {pitchbook.summary.keyStrengths.map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Ideal For</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {pitchbook.summary.idealFor.map(s => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="capabilities" className="mt-0 space-y-5">
                <div className="flex flex-wrap gap-1.5">
                  {provider.capabilities?.map(cap => (
                    <Badge key={cap} variant="secondary" className="text-[10px]">{cap}</Badge>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Budget Band</h4>
                    <p className="text-[12px] font-medium">{provider.budgetBand || 'Not specified'}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Regions</h4>
                    <p className="text-[12px] font-medium">{provider.regions?.join(', ') || 'Global'}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="delivery" className="mt-0 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Team Size</h4>
                    <p className="text-[12px] font-medium">{pitchbook.deliverySystem.teamSize}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Methodology</h4>
                    <p className="text-[12px] font-medium">{pitchbook.deliverySystem.methodology}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Key Personnel</h4>
                  <div className="space-y-2">
                    {pitchbook.deliverySystem.keyPersonnel.map(person => (
                      <div key={person.name} className="p-3 bg-muted/30 border border-border">
                        <p className="text-[12px] font-medium text-foreground">{person.name}</p>
                        <p className="text-[11px] text-muted-foreground">{person.role}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{person.bio}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security" className="mt-0 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Security Level</h4>
                    <Badge variant={pitchbook.security.securityLevel === 'Enterprise' ? 'default' : 'secondary'} className="text-[10px]">
                      {pitchbook.security.securityLevel}
                    </Badge>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Data Residency</h4>
                    <p className="text-[12px] font-medium">{pitchbook.security.dataResidency}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Compliance</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {pitchbook.security.compliance.map(c => (
                      <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="commercials" className="mt-0 space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Pricing Model</h4>
                    <p className="text-[12px] font-medium">{pitchbook.commercials.pricingModel}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Typical Engagement</h4>
                    <p className="text-[12px] font-medium">{pitchbook.commercials.typicalEngagement}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Payment Terms</h4>
                    <p className="text-[12px] font-medium">{pitchbook.commercials.paymentTerms}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="evidence" className="mt-0 space-y-4">
                {pitchbook.proof.caseStudies.map(cs => (
                  <div key={cs.title} className="p-4 bg-muted/30 border border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-medium text-foreground">{cs.title}</p>
                      {cs.verified && <Badge variant="default" className="text-[9px]">Verified</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{cs.client}</p>
                    <p className="text-[11px] mt-2">{cs.outcome}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="references" className="mt-0 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={pitchbook.references.available ? 'default' : 'secondary'} className="text-[10px]">
                    {pitchbook.references.available ? 'Available' : 'Not available'}
                  </Badge>
                  {pitchbook.references.ndaRequired && (
                    <Badge variant="outline" className="text-[10px]">NDA Required</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {pitchbook.references.recentReferences.map(ref => (
                    <div key={ref.company} className="p-3 bg-muted/30 border border-border">
                      <p className="text-[12px] font-medium text-foreground">{ref.company}</p>
                      <p className="text-[11px] text-muted-foreground">{ref.contact}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{ref.project}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="risks" className="mt-0 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Insurances</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {pitchbook.riskAndControls.insurances.map(i => (
                        <Badge key={i} variant="outline" className="text-[10px]">{i}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {pitchbook.riskAndControls.certifications.map(c => (
                        <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-muted/30 border border-border">
                  <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Data Handling</h4>
                  <p className="text-[11px]">{pitchbook.riskAndControls.dataHandling}</p>
                </div>
                <div className="p-3 bg-muted/30 border border-border">
                  <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Escalation Process</h4>
                  <p className="text-[11px]">{pitchbook.riskAndControls.escalationProcess}</p>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}