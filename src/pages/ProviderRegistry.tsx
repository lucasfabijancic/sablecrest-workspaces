import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, Database, X, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { mockProviders, type ProviderCardSummary } from '@/data/mockProviders';
import type { BudgetBand } from '@/types/database';

const budgetOptions: BudgetBand[] = ['Under $10K', '$10K-$50K', '$50K-$150K', '$150K-$500K', 'Over $500K'];
const verificationOptions = ['Verified', 'Pending', 'Incomplete'];

export default function ProviderRegistry() {
  const [providers] = useState<ProviderCardSummary[]>(mockProviders);
  const [search, setSearch] = useState('');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<ProviderCardSummary | null>(null);

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
        return <CheckCircle className="h-3 w-3 text-emerald-500" />;
      case 'Pending':
        return <Clock className="h-3 w-3 text-amber-500" />;
      default:
        return <AlertCircle className="h-3 w-3 text-rose-500" />;
    }
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
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or capability..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>

        <Select value={budgetFilter} onValueChange={setBudgetFilter}>
          <SelectTrigger className="w-32 h-7 text-xs">
            <SelectValue placeholder="Budget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All budgets</SelectItem>
            {budgetOptions.map(b => (
              <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger className="w-32 h-7 text-xs">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All status</SelectItem>
            {verificationOptions.map(v => (
              <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" />
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
                  <th>Provider</th>
                  <th>Verification</th>
                  <th>Evidence</th>
                  <th>Capabilities</th>
                  <th>Regions</th>
                  <th>Budget Fit</th>
                </tr>
              </thead>
              <tbody>
                {filteredProviders.map(provider => (
                  <tr 
                    key={provider.id} 
                    className="cursor-pointer"
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{provider.name}</span>
                        <span className="text-[10px] text-muted-foreground">{provider.category}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {getVerificationIcon(provider.verificationStatus)}
                        <span className="text-xs">{provider.verificationStatus}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${provider.evidenceCompleteness}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{provider.evidenceCompleteness}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {provider.capabilities?.slice(0, 3).map(cap => (
                          <span key={cap} className="px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] rounded">
                            {cap}
                          </span>
                        ))}
                        {(provider.capabilities?.length || 0) > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{(provider.capabilities?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-muted-foreground text-xs">
                      {provider.regions?.join(', ') || '—'}
                    </td>
                    <td className="text-muted-foreground text-xs">{provider.budgetBand || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provider Detail Sheet */}
      <Sheet open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedProvider && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-base font-medium">{selectedProvider.name}</SheetTitle>
                <p className="text-xs text-muted-foreground">{selectedProvider.category}</p>
              </SheetHeader>

              <div className="space-y-6">
                {/* Verification Status */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Verification Status</h4>
                  <div className="flex items-center gap-2 mb-2">
                    {getVerificationIcon(selectedProvider.verificationStatus)}
                    <span className="text-sm font-medium">{selectedProvider.verificationStatus}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-muted-foreground">Evidence completeness:</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${selectedProvider.evidenceCompleteness}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{selectedProvider.evidenceCompleteness}%</span>
                  </div>
                </div>

                {/* Evidence Vault Stub */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Evidence Vault</h4>
                  <div className="border border-border rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground">Evidence documents will be displayed here</p>
                    <Button variant="outline" size="sm" className="mt-3 h-7 text-xs">
                      View Evidence Vault
                    </Button>
                  </div>
                </div>

                {/* Verification Checklist Stub */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Verification Checklist</h4>
                  <div className="space-y-2">
                    {['Company registration', 'Insurance certificates', 'Security certifications', 'Reference checks'].map((item, i) => (
                      <div key={item} className="flex items-center gap-2 text-xs">
                        {i < 2 ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span className={i < 2 ? 'text-foreground' : 'text-muted-foreground'}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capabilities */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Capabilities</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProvider.capabilities.map(cap => (
                      <Badge key={cap} variant="secondary" className="text-[10px]">{cap}</Badge>
                    ))}
                  </div>
                </div>

                {/* Regions */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Regions</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProvider.regions.map(region => (
                      <Badge key={region} variant="outline" className="text-[10px]">{region}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
