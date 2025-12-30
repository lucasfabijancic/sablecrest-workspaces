import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import type { Provider } from '@/types/database';

export default function ProvidersList() {
  const { isOpsOrAdmin } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.capabilities?.some(c => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground mb-6">Provider Directory</h1>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search providers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Capabilities</th>
                <th>Regions</th>
                <th>Typical Budget</th>
                {isOpsOrAdmin && <th>Internal Notes</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProviders.map(provider => (
                <tr key={provider.id}>
                  <td>
                    <div>
                      <p className="font-medium text-foreground">{provider.name}</p>
                      {provider.website && (
                        <a href={provider.website} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">
                          {provider.website}
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {provider.capabilities?.slice(0, 3).map(cap => (
                        <span key={cap} className="px-1.5 py-0.5 bg-muted text-xs rounded">{cap}</span>
                      ))}
                    </div>
                  </td>
                  <td className="text-sm text-muted-foreground">
                    {provider.regions?.join(', ') || '-'}
                  </td>
                  <td className="text-sm">{provider.typical_budget_band || '-'}</td>
                  {isOpsOrAdmin && (
                    <td className="text-sm text-muted-foreground max-w-xs truncate">
                      {provider.notes_internal || '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
