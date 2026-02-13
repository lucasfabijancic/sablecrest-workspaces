import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  Building2,
  Clock,
  DollarSign,
  Users,
  FileText,
  Lock,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock provider data for shortlist
const mockProviders = [
  {
    id: 'p1',
    name: 'Acme Cloud Partners',
    logo: '🏢',
    positioning: 'Enterprise cloud transformation specialists',
    fitScore: 92,
    fitReasons: ['Strong AWS expertise', 'Healthcare compliance experience'],
    budgetBand: '$150K-$300K',
    timelineBand: '12-16 weeks',
    deliveryModel: 'Managed + Implementation',
    stack: ['AWS', 'Terraform', 'Kubernetes'],
    securityBadge: 'SOC2 Type II',
    proofDensity: { caseStudies: 8, references: 5, artifacts: 12 },
    overview: 'Acme Cloud Partners has delivered 50+ enterprise cloud migrations with a focus on regulated industries.',
    team: '45 engineers, 12 architects, dedicated PM per engagement',
    commercials: 'Fixed-price with milestone payments, 10% holdback until go-live',
    security: 'SOC2 Type II certified, ISO 27001, annual pen tests, zero breaches in 5 years',
    delivery: 'Agile sprints, weekly demos, dedicated Slack channel, 4-hour response SLA',
  },
  {
    id: 'p2',
    name: 'CloudShift Inc',
    logo: '☁️',
    positioning: 'Multi-cloud migration and optimization',
    fitScore: 87,
    fitReasons: ['Multi-cloud certified', 'Cost optimization focus'],
    budgetBand: '$100K-$200K',
    timelineBand: '8-12 weeks',
    deliveryModel: 'Implementation',
    stack: ['AWS', 'Azure', 'GCP'],
    securityBadge: 'SOC2 Type I',
    proofDensity: { caseStudies: 12, references: 8, artifacts: 6 },
    overview: 'CloudShift specializes in complex multi-cloud environments and cost optimization.',
    team: '30 engineers, 8 architects, shared PM model',
    commercials: 'T&M with cap, monthly billing, no holdback',
    security: 'SOC2 Type I in progress to Type II, basic security practices',
    delivery: 'Kanban flow, bi-weekly demos, email-based support',
  },
  {
    id: 'p3',
    name: 'DataBridge Solutions',
    logo: '🌉',
    positioning: 'Data-first cloud architecture',
    fitScore: 84,
    fitReasons: ['Data migration expertise', 'Strong analytics capability'],
    budgetBand: '$120K-$250K',
    timelineBand: '10-14 weeks',
    deliveryModel: 'Hybrid',
    stack: ['AWS', 'Snowflake', 'dbt'],
    securityBadge: 'SOC2 Type II',
    proofDensity: { caseStudies: 6, references: 4, artifacts: 15 },
    overview: 'DataBridge focuses on data platform modernization and analytics enablement.',
    team: '25 data engineers, 5 architects, dedicated engagement manager',
    commercials: 'Milestone-based pricing, 15% holdback, success bonuses available',
    security: 'SOC2 Type II, HIPAA BAA available, quarterly audits',
    delivery: 'Waterfall with agile execution, weekly steering committee',
  },
  {
    id: 'p4',
    name: 'TechScale Partners',
    logo: '📈',
    positioning: 'Scalable infrastructure solutions',
    fitScore: 79,
    fitReasons: ['Auto-scaling expertise', 'Cost-effective solutions'],
    budgetBand: '$80K-$150K',
    timelineBand: '6-10 weeks',
    deliveryModel: 'Implementation',
    stack: ['AWS', 'Docker', 'Jenkins'],
    securityBadge: 'ISO 27001',
    proofDensity: { caseStudies: 4, references: 3, artifacts: 8 },
    overview: 'TechScale delivers fast, cost-effective infrastructure modernization.',
    team: '20 engineers, 4 architects, rotating PM',
    commercials: 'Fixed-price, upfront payment required, no holdback',
    security: 'ISO 27001, basic compliance, annual audits',
    delivery: 'Agile sprints, async standups, Slack support',
  },
];

// Compare fields for side-by-side view
const compareFields = [
  { key: 'budgetBand', label: 'Budget Band' },
  { key: 'timelineBand', label: 'Timeline' },
  { key: 'deliveryModel', label: 'Delivery Model' },
  { key: 'securityBadge', label: 'Security Posture' },
  { key: 'stack', label: 'Tech Stack', isArray: true },
];

export default function ShortlistCompare() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [expandedProvider, setExpandedProvider] = useState<typeof mockProviders[0] | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  const toggleProviderSelection = (providerId: string) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : prev.length < 4 ? [...prev, providerId] : prev
    );
  };

  const handleExpand = (provider: typeof mockProviders[0]) => {
    setExpandedProvider(provider);
  };

  const selectedProviderData = mockProviders.filter(p => selectedProviders.includes(p.id));

  return (
    <div className="page-container">
      <PageHeader 
        title="Shortlist Review" 
        description="Cloud Migration Vendors • 4 providers curated"
      >
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button size="sm" disabled>
          <MessageSquare className="h-4 w-4 mr-2" />
          Request Intro
        </Button>
      </PageHeader>

      <div className="page-content">
        {/* Compare Toggle */}
        {selectedProviders.length >= 2 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-sm shadow-lg">
              <span className="text-sm font-medium">{selectedProviders.length} selected</span>
              <Button size="sm" onClick={() => setCompareMode(true)}>
                Compare
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedProviders([])}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Compare View */}
        {compareMode && (
          <div className="mb-8 border border-border rounded-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
              <span className="text-sm font-medium">Comparing {selectedProviderData.length} providers</span>
              <Button variant="ghost" size="sm" onClick={() => setCompareMode(false)}>
                Close Compare
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-40">Field</th>
                    {selectedProviderData.map(provider => (
                      <th key={provider.id} className="px-4 py-3 text-left min-w-48">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{provider.logo}</span>
                          <span className="text-sm font-medium">{provider.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareFields.map(field => (
                    <tr key={field.key} className="border-b border-border/50">
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{field.label}</td>
                      {selectedProviderData.map(provider => (
                        <td key={provider.id} className="px-4 py-3 text-sm">
                          {field.isArray 
                            ? (provider[field.key as keyof typeof provider] as string[]).join(', ')
                            : provider[field.key as keyof typeof provider] as string
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b border-border/50">
                    <td className="px-4 py-3 text-xs font-medium text-muted-foreground">Fit Score</td>
                    {selectedProviderData.map(provider => (
                      <td key={provider.id} className="px-4 py-3">
                        <span className={cn(
                          "text-sm font-medium",
                          provider.fitScore >= 90 ? "text-success" : provider.fitScore >= 80 ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {provider.fitScore}%
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-xs font-medium text-muted-foreground">Proof</td>
                    {selectedProviderData.map(provider => (
                      <td key={provider.id} className="px-4 py-3 text-sm text-muted-foreground">
                        {provider.proofDensity.caseStudies} cases, {provider.proofDensity.references} refs
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Provider List */}
        <div className="space-y-3">
          {mockProviders.map((provider) => (
            <div 
              key={provider.id} 
              className={cn(
                "border border-border rounded-sm p-5 transition-colors",
                selectedProviders.includes(provider.id) && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex items-start justify-between gap-6">
                {/* Left: Provider Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <button
                    onClick={() => toggleProviderSelection(provider.id)}
                    className={cn(
                      "h-5 w-5 rounded-sm border flex items-center justify-center shrink-0 mt-1 transition-colors",
                      selectedProviders.includes(provider.id) 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    {selectedProviders.includes(provider.id) && <Check className="h-3 w-3" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl">{provider.logo}</span>
                      <h3 className="text-base font-medium text-foreground">{provider.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {provider.fitScore}% fit
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{provider.positioning}</p>

                    {/* Key Metrics Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>{provider.budgetBand}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{provider.timelineBand}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Shield className="h-3.5 w-3.5" />
                        <span>{provider.securityBadge}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{provider.proofDensity.caseStudies} cases</span>
                      </div>
                    </div>

                    {/* Fit Reasons */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {provider.fitReasons.map((reason, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded-sm bg-muted text-muted-foreground">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleExpand(provider)}>
                    Expand Pitchbook
                  </Button>
                  <Button variant="ghost" size="sm">
                    Request Intro
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pitchbook Overlay */}
      {expandedProvider ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Provider pitchbook">
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm dark:bg-black/65"
            onClick={() => setExpandedProvider(null)}
          />
          <div className="absolute inset-3 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:inset-6 lg:inset-8">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{expandedProvider.logo}</span>
                <div>
                  <h2 className="text-base font-medium">{expandedProvider.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{expandedProvider.positioning}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedProvider(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="w-full justify-start mb-6">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="delivery">Delivery</TabsTrigger>
                  <TabsTrigger value="proof">Proof</TabsTrigger>
                  <TabsTrigger value="commercials">Commercials</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="references">References</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Overview</h4>
                    <p className="text-sm text-muted-foreground">{expandedProvider.overview}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Fit Score</h4>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-medium">{expandedProvider.fitScore}%</span>
                      <div className="flex flex-wrap gap-2">
                        {expandedProvider.fitReasons.map((reason, idx) => (
                          <Badge key={idx} variant="secondary">{reason}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {expandedProvider.stack.map((tech, idx) => (
                        <Badge key={idx} variant="outline">{tech}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="delivery" className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Team</h4>
                    <p className="text-sm text-muted-foreground">{expandedProvider.team}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Delivery Approach</h4>
                    <p className="text-sm text-muted-foreground">{expandedProvider.delivery}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Delivery Model</h4>
                    <Badge variant="secondary">{expandedProvider.deliveryModel}</Badge>
                  </div>
                </TabsContent>

                <TabsContent value="proof" className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border border-border rounded-sm p-4 text-center">
                      <p className="text-2xl font-medium">{expandedProvider.proofDensity.caseStudies}</p>
                      <p className="text-xs text-muted-foreground mt-1">Case Studies</p>
                    </div>
                    <div className="border border-border rounded-sm p-4 text-center">
                      <p className="text-2xl font-medium">{expandedProvider.proofDensity.references}</p>
                      <p className="text-xs text-muted-foreground mt-1">References</p>
                    </div>
                    <div className="border border-border rounded-sm p-4 text-center">
                      <p className="text-2xl font-medium">{expandedProvider.proofDensity.artifacts}</p>
                      <p className="text-xs text-muted-foreground mt-1">Artifacts</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Detailed case studies and reference calls available upon request.
                  </p>
                </TabsContent>

                <TabsContent value="commercials" className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Budget Range</h4>
                    <p className="text-sm text-muted-foreground">{expandedProvider.budgetBand}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Timeline</h4>
                    <p className="text-sm text-muted-foreground">{expandedProvider.timelineBand}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Commercial Terms</h4>
                    <p className="text-sm text-muted-foreground">{expandedProvider.commercials}</p>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Security Posture</h4>
                    <Badge variant="secondary">{expandedProvider.securityBadge}</Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Details</h4>
                    <p className="text-sm text-muted-foreground">{expandedProvider.security}</p>
                  </div>
                </TabsContent>

                <TabsContent value="references" className="space-y-6">
                  <div className="flex items-center gap-3 p-4 border border-border rounded-sm bg-muted/30">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">References available after NDA</p>
                      <p className="text-xs text-muted-foreground">Request intro to access reference calls</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-8 pt-6 border-t border-border flex gap-3">
                <Button className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Request Intro
                </Button>
                <Button variant="outline" onClick={() => setExpandedProvider(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
