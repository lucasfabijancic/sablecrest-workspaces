import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ProviderCardSummary, ProviderPitchbook } from '@/data/mockProviders';
import { mockPitchbooks } from '@/data/mockProviders';

interface CompareOverlayProps {
  providers: ProviderCardSummary[];
  onClose: () => void;
}

const compareFields = [
  { key: 'category', label: 'Category' },
  { key: 'budgetBand', label: 'Budget Band' },
  { key: 'regions', label: 'Regions' },
  { key: 'capabilities', label: 'Capabilities' },
  { key: 'verificationStatus', label: 'Verification' },
  { key: 'evidenceCompleteness', label: 'Evidence' },
  { key: 'deliverySystem', label: 'Delivery Model' },
  { key: 'security', label: 'Security Posture' },
  { key: 'commercials', label: 'Commercials' },
];

export function CompareOverlay({ providers, onClose }: CompareOverlayProps) {
  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (providers.length > 0) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [providers, onClose]);

  if (providers.length === 0) return null;

  const pitchbooks: Record<string, ProviderPitchbook | undefined> = {};
  providers.forEach(p => {
    pitchbooks[p.id] = mockPitchbooks[p.id];
  });

  const renderCellValue = (provider: ProviderCardSummary, key: string) => {
    const pb = pitchbooks[provider.id];
    
    switch (key) {
      case 'category':
        return <span className="text-foreground">{provider.category}</span>;
      case 'budgetBand':
        return <span className="text-foreground">{provider.budgetBand || '—'}</span>;
      case 'regions':
        return <span className="text-foreground">{provider.regions?.join(', ') || 'Global'}</span>;
      case 'capabilities':
        return (
          <div className="flex flex-wrap gap-1">
            {provider.capabilities?.slice(0, 3).map(cap => (
              <Badge key={cap} variant="secondary" className="text-xs">{cap}</Badge>
            ))}
            {(provider.capabilities?.length || 0) > 3 && (
              <span className="text-xs text-muted-foreground">+{(provider.capabilities?.length || 0) - 3}</span>
            )}
          </div>
        );
      case 'verificationStatus':
        return (
          <Badge variant={provider.verificationStatus === 'Verified' ? 'default' : 'secondary'}>
            {provider.verificationStatus}
          </Badge>
        );
      case 'evidenceCompleteness':
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-muted overflow-hidden">
              <div 
                className="h-full bg-foreground"
                style={{ width: `${provider.evidenceCompleteness}%` }}
              />
            </div>
            <span className="text-sm tabular-nums">{provider.evidenceCompleteness}%</span>
          </div>
        );
      case 'deliverySystem':
        return pb ? (
          <div className="text-sm">
            <p>{pb.deliverySystem.methodology}</p>
            <p className="text-muted-foreground">{pb.deliverySystem.teamSize}</p>
          </div>
        ) : <span className="text-muted-foreground">—</span>;
      case 'security':
        return pb ? (
          <div>
            <Badge variant={pb.security.securityLevel === 'Enterprise' ? 'default' : 'secondary'}>
              {pb.security.securityLevel}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">{pb.security.dataResidency}</p>
          </div>
        ) : <span className="text-muted-foreground">—</span>;
      case 'commercials':
        return pb ? (
          <div className="text-sm">
            <p>{pb.commercials.pricingModel}</p>
            <p className="text-muted-foreground">{pb.commercials.typicalEngagement}</p>
          </div>
        ) : <span className="text-muted-foreground">—</span>;
      default:
        return <span className="text-muted-foreground">—</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Frosted backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Solid content surface */}
      <div className="absolute inset-4 md:inset-6 lg:inset-10 bg-card border border-border overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-medium text-foreground">Compare Providers</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comparing {providers.length} provider{providers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Comparison Grid */}
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[700px]">
            <thead className="sticky top-0 bg-muted/30 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide border-b border-border w-40">
                  Field
                </th>
                {providers.map(provider => (
                  <th key={provider.id} className="px-4 py-3 text-left border-b border-border">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{provider.name}</span>
                      <span className="text-[11px] text-muted-foreground font-normal">{provider.category}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareFields.map((field, idx) => (
                <tr key={field.key} className={idx % 2 === 0 ? 'bg-muted/10' : ''}>
                  <td className="px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border/50">
                    {field.label}
                  </td>
                  {providers.map(provider => (
                    <td key={provider.id} className="px-4 py-3 border-b border-border/50 text-sm">
                      {renderCellValue(provider, field.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <footer className="flex items-center justify-between px-6 py-3 border-t border-border shrink-0 bg-muted/20">
          <p className="text-xs text-muted-foreground">Select a provider to proceed</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            <Button size="sm">Request Intro</Button>
          </div>
        </footer>
      </div>
    </div>
  );
}