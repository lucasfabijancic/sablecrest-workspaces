import { useEffect } from 'react';
import { X, Eye, Users, FileCheck, DollarSign, AlertTriangle, Shield, BookOpen, Building2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProviderCardSummary, ProviderPitchbook, VerificationLevel } from '@/data/mockProviders';

interface ProviderDossierOverlayProps {
  provider: ProviderCardSummary | null;
  pitchbook: ProviderPitchbook | null;
  onClose: () => void;
}

const dossierSections = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'capabilities', label: 'Capabilities', icon: Briefcase },
  { id: 'delivery', label: 'Delivery', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'commercials', label: 'Commercials', icon: DollarSign },
  { id: 'evidence', label: 'Evidence', icon: FileCheck },
  { id: 'references', label: 'References', icon: BookOpen },
  { id: 'risks', label: 'Risks', icon: AlertTriangle },
  { id: 'next-steps', label: 'Next Steps', icon: Building2 },
];

export function ProviderDossierOverlay({ provider, pitchbook, onClose }: ProviderDossierOverlayProps) {
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
      'Documented': 'bg-status-submitted/15 text-status-submitted',
      'Reference-validated': 'bg-warning/15 text-warning',
      'Sablecrest-assessed': 'bg-success/15 text-success',
    };
    return <span className={cn("text-xs px-2 py-0.5 inline-block", styles[level])}>{level}</span>;
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Frosted backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Solid content surface */}
      <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-card border border-border overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-border shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{provider.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{provider.category}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onClose}>
              Request Intro
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar navigation */}
          <nav className="w-56 border-r border-border shrink-0 overflow-y-auto py-4">
            {dossierSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 px-6 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </a>
            ))}
          </nav>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="max-w-3xl space-y-12">
              {/* Overview Section */}
              <section id="overview">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-medium text-foreground">Overview</h3>
                  {getVerificationBadge(pitchbook.summary.verificationLevel)}
                </div>
                <p className="text-foreground leading-relaxed">{pitchbook.summary.overview}</p>
                
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-3">Key Strengths</h4>
                    <div className="flex flex-wrap gap-2">
                      {pitchbook.summary.keyStrengths.map(s => (
                        <Badge key={s} variant="secondary">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-3">Ideal For</h4>
                    <div className="flex flex-wrap gap-2">
                      {pitchbook.summary.idealFor.map(s => (
                        <Badge key={s} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

              </section>

              {/* Capabilities Section */}
              <section id="capabilities">
                <h3 className="text-lg font-medium text-foreground mb-4">Capabilities</h3>
                <div className="flex flex-wrap gap-2">
                  {provider.capabilities?.map(cap => (
                    <Badge key={cap} variant="secondary">{cap}</Badge>
                  ))}
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-sm text-muted-foreground mb-1">Budget Band</h4>
                    <p className="text-foreground font-medium">{provider.budgetBand || 'Not specified'}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-sm text-muted-foreground mb-1">Regions</h4>
                    <p className="text-foreground font-medium">{provider.regions?.join(', ') || 'Global'}</p>
                  </div>
                </div>
              </section>

              {/* Delivery Section */}
              <section id="delivery">
                <h3 className="text-lg font-medium text-foreground mb-4">Delivery System</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-sm text-muted-foreground mb-1">Team Size</h4>
                    <p className="text-foreground font-medium">{pitchbook.deliverySystem.teamSize}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-sm text-muted-foreground mb-1">Methodology</h4>
                    <p className="text-foreground font-medium">{pitchbook.deliverySystem.methodology}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="text-sm text-muted-foreground mb-3">Key Personnel</h4>
                  <div className="space-y-3">
                    {pitchbook.deliverySystem.keyPersonnel.map(person => (
                      <div key={person.name} className="p-4 bg-muted/30 border border-border">
                        <p className="font-medium text-foreground">{person.name}</p>
                        <p className="text-sm text-muted-foreground">{person.role}</p>
                        <p className="text-sm text-muted-foreground mt-2">{person.bio}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Security Section */}
              <section id="security">
                <h3 className="text-lg font-medium text-foreground mb-4">Security & Compliance</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-sm text-muted-foreground mb-1">Security Level</h4>
                    <Badge variant={pitchbook.security.securityLevel === 'Enterprise' ? 'default' : 'secondary'}>
                      {pitchbook.security.securityLevel}
                    </Badge>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-sm text-muted-foreground mb-1">Data Residency</h4>
                    <p className="text-foreground font-medium">{pitchbook.security.dataResidency}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="text-sm text-muted-foreground mb-3">Compliance</h4>
                  <div className="flex flex-wrap gap-2">
                    {pitchbook.security.compliance.map(c => (
                      <Badge key={c} variant="outline">{c}</Badge>
                    ))}
                  </div>
                </div>
              </section>

              {/* Commercials Section */}
              <section id="commercials">
                <h3 className="text-lg font-medium text-foreground mb-4">Commercials</h3>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-sm text-muted-foreground mb-1">Pricing Model</h4>
                    <p className="text-foreground font-medium">{pitchbook.commercials.pricingModel}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-sm text-muted-foreground mb-1">Typical Engagement</h4>
                    <p className="text-foreground font-medium">{pitchbook.commercials.typicalEngagement}</p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border">
                    <h4 className="text-sm text-muted-foreground mb-1">Payment Terms</h4>
                    <p className="text-foreground font-medium">{pitchbook.commercials.paymentTerms}</p>
                  </div>
                </div>
              </section>

              {/* Evidence Section */}
              <section id="evidence">
                <h3 className="text-lg font-medium text-foreground mb-4">Evidence</h3>
                <div className="space-y-4">
                  {pitchbook.proof.caseStudies.map(cs => (
                    <div key={cs.title} className="p-4 bg-muted/30 border border-border">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{cs.title}</p>
                        {cs.verified && <Badge variant="default" className="text-xs">Verified</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{cs.client}</p>
                      <p className="text-sm mt-2">{cs.outcome}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* References Section */}
              <section id="references">
                <h3 className="text-lg font-medium text-foreground mb-4">References</h3>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant={pitchbook.references.available ? 'default' : 'secondary'}>
                    {pitchbook.references.available ? 'Available' : 'Not available'}
                  </Badge>
                  {pitchbook.references.ndaRequired && (
                    <Badge variant="outline">NDA Required</Badge>
                  )}
                </div>
                <div className="space-y-3">
                  {pitchbook.references.recentReferences.map(ref => (
                    <div key={ref.company} className="p-4 bg-muted/30 border border-border">
                      <p className="font-medium text-foreground">{ref.company}</p>
                      <p className="text-sm text-muted-foreground">{ref.contact}</p>
                      <p className="text-sm text-muted-foreground mt-1">{ref.project}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Risks Section */}
              <section id="risks">
                <h3 className="text-lg font-medium text-foreground mb-4">Risk & Controls</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-3">Insurances</h4>
                    <div className="flex flex-wrap gap-2">
                      {pitchbook.riskAndControls.insurances.map(i => (
                        <Badge key={i} variant="outline">{i}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-3">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {pitchbook.riskAndControls.certifications.map(c => (
                        <Badge key={c} variant="secondary">{c}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-muted/30 border border-border">
                  <h4 className="text-sm text-muted-foreground mb-2">Data Handling</h4>
                  <p className="text-sm">{pitchbook.riskAndControls.dataHandling}</p>
                </div>
                <div className="mt-4 p-4 bg-muted/30 border border-border">
                  <h4 className="text-sm text-muted-foreground mb-2">Escalation Process</h4>
                  <p className="text-sm">{pitchbook.riskAndControls.escalationProcess}</p>
                </div>
              </section>

              {/* Next Steps Section */}
              <section id="next-steps">
                <h3 className="text-lg font-medium text-foreground mb-4">Next Steps</h3>
                <div className="p-6 bg-muted/30 border border-border">
                  <p className="text-muted-foreground mb-4">Ready to explore this provider further?</p>
                  <div className="flex gap-3">
                    <Button>Request Intro Call</Button>
                    <Button variant="outline">Ask Clarifications</Button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}