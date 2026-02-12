import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, Database, Filter, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { aecProviders } from '@/data/aecProviders';
import type { ProviderProfile, ProviderTier } from '@/types/provider';
import ProviderDossier from '@/components/providers/ProviderDossier';
import TierBadge from '@/components/providers/TierBadge';
import VerificationBadge from '@/components/providers/VerificationBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type TierFilter = 'All' | 'Elite' | 'Verified' | 'Emerging';
type SortOption = 'name' | 'tier' | 'budget';

const TIER_FILTERS: TierFilter[] = ['All', 'Elite', 'Verified', 'Emerging'];

const TIER_PRIORITY: Record<ProviderTier, number> = {
  Elite: 4,
  Verified: 3,
  Emerging: 2,
  Pending: 1,
};

const formatBudgetRange = (provider: ProviderProfile) => {
  const min = provider.typicalBudgetMin;
  const max = provider.typicalBudgetMax;

  if (typeof min !== 'number' || typeof max !== 'number') return 'Budget: Not provided';
  return `Budget: $${min.toLocaleString()}-$${max.toLocaleString()}`;
};

const getRegionSummary = (provider: ProviderProfile) => {
  if (provider.regions.length === 0) return 'Regions: Not provided';

  const preview = provider.regions.slice(0, 2);
  const remaining = provider.regions.length - preview.length;
  return `Regions: ${preview.join(', ')}${remaining > 0 ? ` +${remaining}` : ''}`;
};

export default function ProviderRegistry() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isOpsOrAdmin = hasRole(['admin', 'ops']);

  const [tierFilter, setTierFilter] = useState<TierFilter>('All');
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const uniqueRegions = useMemo(
    () => Array.from(new Set(aecProviders.flatMap((provider) => provider.regions))).sort((a, b) => a.localeCompare(b)),
    []
  );

  const filteredProviders = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = aecProviders
      .filter((provider) => {
        const matchesTier = tierFilter === 'All' ? true : provider.tier === tierFilter;
        const matchesRegion = regionFilter === 'all' ? true : provider.regions.includes(regionFilter);

        const matchesSearch =
          query.length === 0
            ? true
            : provider.capabilities.some((capability) => {
                if (capability.capability.toLowerCase().includes(query)) return true;
                return capability.subcategories?.some((subcategory) => subcategory.toLowerCase().includes(query)) ?? false;
              }) ||
              provider.aecSpecializations.some((specialization) => specialization.toLowerCase().includes(query));

        return matchesTier && matchesRegion && matchesSearch;
      })
      .slice();

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);

      if (sortBy === 'tier') {
        const tierDiff = TIER_PRIORITY[b.tier] - TIER_PRIORITY[a.tier];
        if (tierDiff !== 0) return tierDiff;
        return a.name.localeCompare(b.name);
      }

      const aMinBudget = typeof a.typicalBudgetMin === 'number' ? a.typicalBudgetMin : Number.MAX_SAFE_INTEGER;
      const bMinBudget = typeof b.typicalBudgetMin === 'number' ? b.typicalBudgetMin : Number.MAX_SAFE_INTEGER;
      if (aMinBudget !== bMinBudget) return aMinBudget - bMinBudget;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [regionFilter, search, sortBy, tierFilter]);

  useEffect(() => {
    if (!isOpsOrAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [isOpsOrAdmin, navigate]);

  if (!isOpsOrAdmin) {
    return null;
  }

  const openDossier = (provider: ProviderProfile) => {
    setSelectedProvider(provider);
    setIsDossierOpen(true);
  };

  const closeDossier = () => {
    setIsDossierOpen(false);
    setSelectedProvider(null);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Provider Registry"
        description={`${filteredProviders.length} provider${filteredProviders.length === 1 ? '' : 's'} in the Sablecrest network`}
        showBack
      />

      <div className="filter-bar flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <Filter className="h-3.5 w-3.5" />
            Tier
          </span>
          {TIER_FILTERS.map((tier) => {
            const isActive = tierFilter === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setTierFilter(tier)}
                className={cn(
                  'h-7 px-2.5 rounded-full border text-[11px] font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/40'
                )}
              >
                {tier}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search capabilities or specializations..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="h-9 w-full sm:w-[220px]">
            <SelectValue placeholder="Filter by region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {uniqueRegions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="inline-flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
          </span>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="h-9 w-full sm:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="tier">Tier (highest first)</SelectItem>
              <SelectItem value="budget">Budget (lowest first)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="page-content">
        {filteredProviders.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No providers match your filters."
            description="Try broadening your search, tier, or region filters."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProviders.map((provider) => {
              const topCapabilities = provider.capabilities.slice(0, 4);
              const extraCapabilities = provider.capabilities.length - topCapabilities.length;

              return (
                <Card key={provider.id} className="h-full">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-base font-semibold leading-tight">{provider.name}</h3>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <TierBadge tier={provider.tier} size="sm" />
                        <VerificationBadge level={provider.overallVerification} size="sm" showLabel={false} />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">{provider.description}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {topCapabilities.map((capability, index) => (
                        <Badge key={`${provider.id}-cap-${index}`} variant="secondary" className="text-[10px]">
                          {capability.capability}
                        </Badge>
                      ))}
                      {extraCapabilities > 0 ? (
                        <Badge variant="outline" className="text-[10px]">
                          +{extraCapabilities} more
                        </Badge>
                      ) : null}
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>{getRegionSummary(provider)}</p>
                      <p>Employees: {provider.employeeCountRange}</p>
                      <p>{formatBudgetRange(provider)}</p>
                    </div>

                    <Button variant="outline" className="w-full" onClick={() => openDossier(provider)}>
                      View Dossier
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ProviderDossier provider={selectedProvider} isOpen={isDossierOpen} onClose={closeDossier} />
    </div>
  );
}
