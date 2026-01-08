import { Skeleton } from './skeleton';

// Table row skeleton for data tables
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 ${i === 0 ? 'w-40' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  );
}

// Full table skeleton
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="border border-border overflow-hidden animate-fade-in">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <Skeleton className={`h-3 ${i === 0 ? 'w-24' : 'w-16'}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// KPI Card skeleton
export function KPICardSkeleton() {
  return (
    <div className="kpi-card animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-6 w-16 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// Pipeline strip skeleton
export function PipelineStripSkeleton() {
  return (
    <div className="pipeline-strip animate-fade-in">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="pipeline-item">
          <Skeleton className="h-3 w-3 rounded" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-4" />
        </div>
      ))}
    </div>
  );
}

// Activity list skeleton
export function ActivityListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="border border-border divide-y divide-border animate-fade-in">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="px-3 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-2.5 w-20" />
        </div>
      ))}
    </div>
  );
}

// Provider card skeleton
export function ProviderCardSkeleton() {
  return (
    <div className="border border-border p-4 animate-fade-in">
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-5 w-14 rounded" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-20 rounded" />
      </div>
    </div>
  );
}

// Dossier content skeleton
export function DossierContentSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Facts strip */}
      <div className="border border-border p-4">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-12 w-12 rounded" />
          <div>
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <div className="flex gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Content sections */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border p-4">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-3/4 mb-2" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Request detail skeleton
export function RequestDetailSkeleton() {
  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      
      {/* Status bar */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border">
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-3 w-32" />
      </div>
      
      {/* Tabs */}
      <div className="border-b border-border px-6">
        <div className="flex items-center gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="page-content">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="border border-border p-4">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="border border-border p-4">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="border border-border p-4">
            <Skeleton className="h-3 w-16 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
