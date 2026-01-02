import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';
import { UserCircle, Shield, BookOpen } from 'lucide-react';

const portalTabs = [
  { id: 'profile', label: 'Profile', icon: UserCircle, path: '/provider-portal/profile' },
  { id: 'evidence', label: 'Evidence', icon: Shield, path: '/provider-portal/evidence' },
  { id: 'references', label: 'References', icon: BookOpen, path: '/provider-portal/references' },
];

export default function ProviderPortal() {
  const location = useLocation();

  return (
    <div className="page-container">
      <PageHeader 
        title="Provider Portal" 
        description="Manage your provider profile, evidence, and references"
      />

      {/* Tabs */}
      <div className="border-b border-border px-6">
        <div className="flex items-center gap-1">
          {portalTabs.map(tab => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors",
                location.pathname === tab.path
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
}

// Profile Tab Component
export function ProviderProfile() {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-medium text-foreground mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Company Name</label>
            <div className="text-sm text-foreground">Acme Solutions Inc.</div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Website</label>
            <div className="text-sm text-foreground">https://acme.example.com</div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Primary Contact</label>
            <div className="text-sm text-foreground">John Smith</div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Email</label>
            <div className="text-sm text-foreground">john@acme.example.com</div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-medium text-foreground mb-4">Capabilities</h3>
        <p className="text-xs text-muted-foreground mb-4">Define your service capabilities and regions served.</p>
        <div className="flex flex-wrap gap-2">
          {['AI/ML', 'Data Engineering', 'Cloud Migration', 'Security'].map(cap => (
            <span key={cap} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
              {cap}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-medium text-foreground mb-4">Delivery Model</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Model Type</label>
            <div className="text-sm text-foreground">Implementation + Managed Service</div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Engagement Type</label>
            <div className="text-sm text-foreground">Hybrid (Fixed + T&M)</div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Typical Timeline</label>
            <div className="text-sm text-foreground">3-6 months</div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Lead Time</label>
            <div className="text-sm text-foreground">2-3 weeks</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Evidence Tab Component
export function ProviderEvidence() {
  const evidenceItems = [
    { type: 'Security Cert', name: 'SOC 2 Type II Certificate', status: 'Verified', date: '2024-01-15' },
    { type: 'Insurance', name: 'E&O Coverage Certificate', status: 'Verified', date: '2024-02-20' },
    { type: 'Case Study', name: 'Fortune 500 AI Implementation', status: 'Pending', date: '2024-03-10' },
    { type: 'SOW', name: 'Redacted Enterprise SOW', status: 'NDA Required', date: '2024-03-15' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Evidence Uploads</h3>
          <span className="text-xs text-muted-foreground">{evidenceItems.length} documents</span>
        </div>
        <div className="divide-y divide-border">
          {evidenceItems.map((item, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-table-hover transition-colors">
              <div>
                <p className="text-sm text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.type} · Uploaded {item.date}</p>
              </div>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded",
                item.status === 'Verified' && "bg-emerald-500/10 text-emerald-500",
                item.status === 'Pending' && "bg-amber-500/10 text-amber-500",
                item.status === 'NDA Required' && "bg-blue-500/10 text-blue-500",
              )}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-muted/50 border border-dashed border-border rounded-lg p-8 text-center">
        <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-foreground mb-1">Upload Evidence</p>
        <p className="text-xs text-muted-foreground mb-4">
          Security certifications, insurance documents, redacted SOWs
        </p>
        <button className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-md">
          Upload Document
        </button>
      </div>
    </div>
  );
}

// References Tab Component
export function ProviderReferences() {
  const references = [
    { company: 'Fortune 100 Retailer', contact: 'VP Engineering', project: 'ML Platform Build', availability: 'Available' },
    { company: 'Financial Services Firm', contact: 'CIO', project: 'Data Integration', availability: 'After NDA' },
    { company: 'Healthcare Provider', contact: 'CTO', project: 'HIPAA Compliance', availability: 'Limited' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Reference Contacts</h3>
          <span className="text-xs text-muted-foreground">{references.length} references</span>
        </div>
        <div className="divide-y divide-border">
          {references.map((ref, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-table-hover transition-colors">
              <div>
                <p className="text-sm text-foreground">{ref.company}</p>
                <p className="text-xs text-muted-foreground">{ref.contact} · {ref.project}</p>
              </div>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded",
                ref.availability === 'Available' && "bg-emerald-500/10 text-emerald-500",
                ref.availability === 'After NDA' && "bg-amber-500/10 text-amber-500",
                ref.availability === 'Limited' && "bg-rose-500/10 text-rose-500",
              )}>
                {ref.availability}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Note:</strong> References marked "After NDA" will only be shared with buyers who have signed an NDA with Sablecrest. Limited references require explicit approval for each request.
        </p>
      </div>
    </div>
  );
}
