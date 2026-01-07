import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
        return <CheckCircle className="h-3 w-3 text-success" />;
      case 'Pending':
        return <Clock className="h-3 w-3 text-warning" />;
      default:
        return <AlertCircle className="h-3 w-3 text-destructive" />;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-10"></th>
            <th>Provider</th>
            <th>Status</th>
            <th>Evidence</th>
            <th>Capabilities</th>
            <th>Regions</th>
            <th>Budget</th>
            <th className="w-24"></th>
          </tr>
        </thead>
        <tbody>
          {providers.map(provider => (
            <tr key={provider.id} onClick={() => onOpenDossier(provider)}>
              <td className="text-center" onClick={e => e.stopPropagation()}>
                <Checkbox 
                  checked={compareList.includes(provider.id)}
                  onCheckedChange={() => onToggleCompare(provider.id)}
                  className="h-3.5 w-3.5"
                />
              </td>
              <td>
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-foreground">{provider.name}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{provider.category}</span>
                </div>
              </td>
              <td>
                <div className="flex items-center gap-1.5">
                  {getVerificationIcon(provider.verificationStatus)}
                  <span className="text-[11px]">{provider.verificationStatus}</span>
                </div>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-foreground"
                      style={{ width: `${provider.evidenceCompleteness}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{provider.evidenceCompleteness}%</span>
                </div>
              </td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {provider.capabilities?.slice(0, 2).map(cap => (
                    <Badge key={cap} variant="secondary" className="text-[9px] px-1.5 py-0">
                      {cap}
                    </Badge>
                  ))}
                  {(provider.capabilities?.length || 0) > 2 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{(provider.capabilities?.length || 0) - 2}
                    </span>
                  )}
                </div>
              </td>
              <td className="text-muted-foreground text-[11px]">
                {provider.regions?.slice(0, 2).join(', ') || '—'}
              </td>
              <td className="text-muted-foreground text-[11px]">{provider.budgetBand || '—'}</td>
              <td onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => onOpenDossier(provider)}>
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}