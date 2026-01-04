import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Database, X, CheckCircle, Clock, AlertCircle, Shield, Users, DollarSign, FileCheck, BookOpen, Eye, AlertTriangle } from 'lucide-react';
import { mockProviders, mockPitchbooks, type ProviderCardSummary, type ProviderPitchbook, type VerificationLevel } from '@/data/mockProviders';
import type { BudgetBand } from '@/types/database';
import { cn } from '@/lib/utils';

const budgetOptions: BudgetBand[] = ['Under $10K', '$10K-$50K', '$50K-$150K', '$150K-$500K', 'Over $500K'];
const verificationOptions = ['Verified', 'Pending', 'Incomplete'];

const pitchbookTabs = [
  { id: 'summary', label: 'Summary', icon: Eye },
  { id: 'delivery', label: 'Delivery', icon: Users },
  { id: 'proof', label: 'Proof', icon: FileCheck },
  { id: 'commercials', label: 'Commercials', icon: DollarSign },
  { id: 'risk', label: 'Risk', icon: AlertTriangle },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'references', label: 'References', icon: BookOpen },
];

export default function ProviderRegistry() {
  const [providers] = useState<ProviderCardSummary[]>(mockProviders);
  const [search, setSearch] = useState('');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<ProviderCardSummary | null>(null);
  const [pitchbook, setPitchbook] = useState<ProviderPitchbook | null>(null);
  const [pitchbookTab, setPitchbookTab] = useState('summary');
  const [compareList, setCompareList] = useState<string[]>([]);

  const hasFilters = budgetFilter !== 'all' || verificationFilter !== 'all' || search !== '';

  const clearFilters = () => {
    setSearch('');
    setBudgetFilter('all');
    setVerificationFilter('all');
  };

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.capabilities?.some(c => c.toLowerCase().includes(search.toLowerCase()));
    
    const matchesBudget = budgetFilter === 'all' || p.budgetBand === budgetFilter;
    const matchesVerification = verificationFilter === 'all' || p.verificationStatus === verificationFilter;
    
    return matchesSearch && matchesBudget && matchesVerification;
  });

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle className="h-3.5 w-3.5 text-success" />;
      case 'Pending':
        return <Clock className="h-3.5 w-3.5 text-warning" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    }
  };

  const getVerificationBadge = (level: VerificationLevel) => {
    const styles: Record<VerificationLevel, string> = {
      'Provider-stated': 'bg-muted text-muted-foreground',
      'Documented': 'bg-status-submitted/15 text-status-submitted',
      'Reference-validated': 'bg-warning/15 text-warning',
      'Sablecrest-assessed': 'bg-success/15 text-success',
    };
    return <span className={cn("text-[10px] px-1.5 py-0.5", styles[level])}>{level}</span>;
  };

  const openPitchbook = (provider: ProviderCardSummary) => {
    setSelectedProvider(provider);
    const pb = mockPitchbooks[provider.id];
    if (pb) {
      setPitchbook(pb);
      setPitchbookTab('summary');
    }
  };

  const toggleCompare = (id: string) => {
    setCompareList(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id].slice(0, 4)
    );
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Provider Registry" 
        description={`${filteredProviders.length} provider${filteredProviders.length !== 1 ? 's' : ''} in registry`}
      />

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or capability..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        <Select value={budgetFilter} onValueChange={setBudgetFilter}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Budget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All budgets</SelectItem>
            {budgetOptions.map(b => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {verificationOptions.map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="page-content p-0">
        {filteredProviders.length === 0 ? (
          <EmptyState
            icon={Database}
            title={hasFilters ? "No matching providers" : "No providers in registry"}
            description={hasFilters ? "Try adjusting your filters." : "Providers will be added by the ops team."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Provider</th>
                  <th>Verification</th>
                  <th>Evidence</th>
                  <th>Capabilities</th>
                  <th>Regions</th>
                  <th>Budget Fit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredProviders.map(provider => (
                  <tr key={provider.id}>
                    <td className="text-center">
                      <input 
                        type="checkbox" 
                        checked={compareList.includes(provider.id)}
                        onChange={() => toggleCompare(provider.id)}
                        className="h-4 w-4 border-border"
                      />
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{provider.name}</span>
                        <span className="text-xs text-muted-foreground">{provider.category}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getVerificationIcon(provider.verificationStatus)}
                        <span className="text-sm">{provider.verificationStatus}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted overflow-hidden">
                          <div 
                            className="h-full bg-foreground"
                            style={{ width: `${provider.evidenceCompleteness}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{provider.evidenceCompleteness}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {provider.capabilities?.slice(0, 3).map(cap => (
                          <span key={cap} className="px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px]">
                            {cap}
                          </span>
                        ))}
                        {(provider.capabilities?.length || 0) > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{(provider.capabilities?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-muted-foreground text-sm">
                      {provider.regions?.join(', ') || '—'}
                    </td>
                    <td className="text-muted-foreground text-sm">{provider.budgetBand || '—'}</td>
                    <td>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openPitchbook(provider)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Compare Tray */}
      {compareList.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Compare ({compareList.length})</span>
            <div className="flex gap-2">
              {compareList.map(id => {
                const p = providers.find(prov => prov.id === id);
                return p ? (
                  <Badge key={id} variant="secondary" className="text-xs">
                    {p.name}
                    <button className="ml-1.5 hover:text-destructive" onClick={() => toggleCompare(id)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCompareList([])}>Clear</Button>
            <Button size="sm">Compare Now</Button>
          </div>
        </div>
      )}

      {/* Pitchbook Drawer */}
      <Sheet open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          {selectedProvider && pitchbook && (
            <>
              <SheetHeader className="p-6 border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-lg font-semibold">{selectedProvider.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground mt-1">{selectedProvider.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getVerificationIcon(selectedProvider.verificationStatus)}
                    <span className="text-sm">{selectedProvider.verificationStatus}</span>
                  </div>
                </div>
              </SheetHeader>

              <Tabs value={pitchbookTab} onValueChange={setPitchbookTab} className="flex-1">
                <TabsList className="w-full justify-start border-b border-border bg-transparent h-auto p-0 overflow-x-auto">
                  {pitchbookTabs.map(tab => (
                    <TabsTrigger 
                      key={tab.id} 
                      value={tab.id}
                      className="px-4 py-3 text-xs data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"
                    >
                      <tab.icon className="h-3.5 w-3.5 mr-1.5" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="p-6">
                  <TabsContent value="summary" className="mt-0 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overview</h4>
                        {getVerificationBadge(pitchbook.summary.verificationLevel)}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{pitchbook.summary.overview}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Key Strengths</h4>
                      <div className="flex flex-wrap gap-2">
                        {pitchbook.summary.keyStrengths.map(s => (
                          <Badge key={s} variant="secondary">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Ideal For</h4>
                      <div className="flex flex-wrap gap-2">
                        {pitchbook.summary.idealFor.map(s => (
                          <Badge key={s} variant="outline">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="delivery" className="mt-0 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Team Size</h4>
                        <p className="text-sm">{pitchbook.deliverySystem.teamSize}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Methodology</h4>
                        <p className="text-sm">{pitchbook.deliverySystem.methodology}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Key Personnel</h4>
                      <div className="space-y-3">
                        {pitchbook.deliverySystem.keyPersonnel.map(person => (
                          <div key={person.name} className="bg-muted/30 p-4">
                            <p className="font-medium text-sm">{person.name}</p>
                            <p className="text-xs text-muted-foreground">{person.role}</p>
                            <p className="text-xs text-muted-foreground mt-1">{person.bio}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="proof" className="mt-0 space-y-6">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Case Studies</h4>
                      <div className="space-y-3">
                        {pitchbook.proof.caseStudies.map(cs => (
                          <div key={cs.title} className="bg-muted/30 p-4">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{cs.title}</p>
                              {cs.verified && <Badge variant="success" className="text-[10px]">Verified</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{cs.client}</p>
                            <p className="text-sm mt-2">{cs.outcome}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="commercials" className="mt-0 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Pricing Model</h4>
                        <p className="text-sm">{pitchbook.commercials.pricingModel}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Typical Engagement</h4>
                        <p className="text-sm">{pitchbook.commercials.typicalEngagement}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Payment Terms</h4>
                        <p className="text-sm">{pitchbook.commercials.paymentTerms}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="risk" className="mt-0 space-y-6">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Insurances</h4>
                      <div className="flex flex-wrap gap-2">
                        {pitchbook.riskAndControls.insurances.map(i => (
                          <Badge key={i} variant="outline">{i}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Certifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {pitchbook.riskAndControls.certifications.map(c => (
                          <Badge key={c} variant="secondary">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="mt-0 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Security Level</h4>
                        <Badge variant={pitchbook.security.securityLevel === 'Enterprise' ? 'default' : 'secondary'}>
                          {pitchbook.security.securityLevel}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Data Residency</h4>
                        <p className="text-sm">{pitchbook.security.dataResidency}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Compliance</h4>
                      <div className="flex flex-wrap gap-2">
                        {pitchbook.security.compliance.map(c => (
                          <Badge key={c} variant="outline">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="references" className="mt-0 space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm">References available:</span>
                      <Badge variant={pitchbook.references.available ? 'success' : 'secondary'}>
                        {pitchbook.references.available ? 'Yes' : 'No'}
                      </Badge>
                      {pitchbook.references.ndaRequired && (
                        <Badge variant="warning">NDA Required</Badge>
                      )}
                    </div>
                    <div className="space-y-3">
                      {pitchbook.references.recentReferences.map(ref => (
                        <div key={ref.company} className="bg-muted/30 p-4">
                          <p className="font-medium text-sm">{ref.company}</p>
                          <p className="text-xs text-muted-foreground">{ref.contact}</p>
                          <p className="text-xs text-muted-foreground mt-1">{ref.project}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
