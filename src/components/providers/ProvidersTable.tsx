import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ProviderCardSummary } from '@/data/mockProviders';

interface ProvidersTableProps {
  providers: ProviderCardSummary[];
  compareList: string[];
  onToggleCompare: (id: string) => void;
  onOpenDossier: (provider: ProviderCardSummary) => void;
}

export function ProvidersTable({ providers, compareList, onToggleCompare, onOpenDossier }: ProvidersTableProps) {
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

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-12"></th>
            <th>Provider</th>
            <th>Verification</th>
            <th>Evidence</th>
            <th>Capabilities</th>
            <th>Regions</th>
            <th>Budget Fit</th>
            <th className="w-28"></th>
          </tr>
        </thead>
        <tbody>
          {providers.map(provider => (
            <tr key={provider.id} onClick={() => onOpenDossier(provider)}>
              <td className="text-center" onClick={e => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={compareList.includes(provider.id)}
                  onChange={() => onToggleCompare(provider.id)}
                  className="h-4 w-4 border-border accent-foreground"
                />
              </td>
              <td>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{provider.name}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{provider.category}</span>
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
                    <Badge key={cap} variant="secondary" className="text-xs">
                      {cap}
                    </Badge>
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
              <td onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onOpenDossier(provider)}>
                  View Dossier
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}