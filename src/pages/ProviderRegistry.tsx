import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Database, X } from 'lucide-react';
import { mockProviders, mockPitchbooks, type ProviderCardSummary, type ProviderPitchbook } from '@/data/mockProviders';
import type { BudgetBand } from '@/types/database';
import { ProvidersTable } from '@/components/providers/ProvidersTable';
import { ProviderDossierOverlay } from '@/components/providers/ProviderDossierOverlay';
import { CompareOverlay } from '@/components/providers/CompareOverlay';

const budgetOptions: BudgetBand[] = ['Under $10K', '$10K-$50K', '$50K-$150K', '$150K-$500K', 'Over $500K'];
const verificationOptions = ['Verified', 'Pending', 'Incomplete'];

export default function ProviderRegistry() {
  const [providers] = useState<ProviderCardSummary[]>(mockProviders);
  const [search, setSearch] = useState('');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<ProviderCardSummary | null>(null);
  const [pitchbook, setPitchbook] = useState<ProviderPitchbook | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

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

  const openDossier = (provider: ProviderCardSummary) => {
    setSelectedProvider(provider);
    const pb = mockPitchbooks[provider.id];
    if (pb) {
      setPitchbook(pb);
    }
  };

  const closeDossier = () => {
    setSelectedProvider(null);
    setPitchbook(null);
  };

  const toggleCompare = (id: string) => {
    setCompareList(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id].slice(0, 4)
    );
  };

  const compareProviders = providers.filter(p => compareList.includes(p.id));

  return (
    <div className="page-container">
      <PageHeader 
        title="Provider Registry" 
        description={`${filteredProviders.length} provider${filteredProviders.length !== 1 ? 's' : ''} curated by Sablecrest`}
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
          <ProvidersTable
            providers={filteredProviders}
            compareList={compareList}
            onToggleCompare={toggleCompare}
            onOpenDossier={openDossier}
          />
        )}
      </div>

      {/* Compare Tray */}
      {compareList.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex items-center justify-between z-40">
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
            <Button size="sm" onClick={() => setShowCompare(true)}>Compare Now</Button>
          </div>
        </div>
      )}

      {/* Provider Dossier Overlay */}
      <ProviderDossierOverlay
        provider={selectedProvider}
        pitchbook={pitchbook}
        onClose={closeDossier}
      />

      {/* Compare Overlay */}
      {showCompare && (
        <CompareOverlay
          providers={compareProviders}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}