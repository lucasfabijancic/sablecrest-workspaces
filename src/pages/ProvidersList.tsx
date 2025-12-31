import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Building2, ExternalLink, X } from 'lucide-react';
import type { Provider, BudgetBand } from '@/types/database';

const budgetOptions: BudgetBand[] = ['Under $10K', '$10K-$50K', '$50K-$150K', '$150K-$500K', 'Over $500K'];
const regionOptions = ['North America', 'Europe', 'Asia', 'Global'];

export default function ProvidersList() {
  const { isOpsOrAdmin } = useAuth();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const hasFilters = budgetFilter !== 'all' || regionFilter !== 'all' || search !== '';

  const clearFilters = () => {
    setSearch('');
    setBudgetFilter('all');
    setRegionFilter('all');
  };

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('providers')
        .select('*')
        .order('name');
      if (data) setProviders(data as Provider[]);
      setLoading(false);
    };
    fetchProviders();
  }, []);

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.capabilities?.some(c => c.toLowerCase().includes(search.toLowerCase()));
    
    const matchesBudget = budgetFilter === 'all' || p.typical_budget_band === budgetFilter;
    const matchesRegion = regionFilter === 'all' || p.regions?.includes(regionFilter);
    
    return matchesSearch && matchesBudget && matchesRegion;
  });

  return (
    <div className="page-container">
      <PageHeader 
        title="Providers" 
        description={`${filteredProviders.length} provider${filteredProviders.length !== 1 ? 's' : ''} in directory`}
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

        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-32 h-7 text-xs">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All regions</SelectItem>
            {regionOptions.map(r => (
              <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProviders.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={hasFilters ? "No matching providers" : "No providers yet"}
            description={hasFilters ? "Try adjusting your filters." : "Providers will be added by the ops team."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Capabilities</th>
                  <th>Regions</th>
                  <th>Budget Fit</th>
                  {isOpsOrAdmin && <th>Internal Notes</th>}
                </tr>
              </thead>
              <tbody>
                {filteredProviders.map(provider => (
                  <tr key={provider.id} className="cursor-default">
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{provider.name}</span>
                        {provider.website && (
                          <a 
                            href={provider.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-accent hover:underline flex items-center gap-0.5 mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {provider.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
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
                    <td className="text-muted-foreground">
                      {provider.regions?.join(', ') || '—'}
                    </td>
                    <td className="text-muted-foreground">{provider.typical_budget_band || '—'}</td>
                    {isOpsOrAdmin && (
                      <td className="text-muted-foreground max-w-xs truncate text-[10px]">
                        {provider.notes_internal || '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}