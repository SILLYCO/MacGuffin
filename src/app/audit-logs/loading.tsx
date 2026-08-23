import React from "react";

export default function AuditLogsLoading() {
  return (
    <div className="space-y-6 pb-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-4 w-36 bg-primary/20 rounded-full" />
          <div className="h-8 w-60 bg-muted/80 rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-muted/40 rounded-lg" />
        </div>
        <div className="h-10 w-44 bg-muted/60 rounded-xl shrink-0" />
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-5 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="h-10 w-full lg:w-96 bg-muted/50 rounded-xl" />
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="h-10 w-32 bg-muted/50 rounded-xl" />
          <div className="h-10 w-32 bg-muted/50 rounded-xl" />
          <div className="h-10 w-28 bg-muted/50 rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/60 bg-muted/30">
          <div className="grid grid-cols-6 gap-4">
            <div className="h-4 w-20 bg-muted/60 rounded" />
            <div className="h-4 w-24 bg-muted/60 rounded" />
            <div className="h-4 w-28 bg-muted/60 rounded" />
            <div className="h-4 w-28 bg-muted/60 rounded" />
            <div className="h-4 w-24 bg-muted/60 rounded" />
            <div className="h-4 w-16 bg-muted/60 rounded justify-self-end" />
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="h-8 w-24 bg-muted/40 rounded font-mono" />
              <div className="h-6 w-28 bg-muted/60 rounded-lg" />
              <div className="h-4 w-36 bg-muted/50 rounded" />
              <div className="h-4 w-32 bg-muted/50 rounded" />
              <div className="h-5 w-24 bg-muted/30 rounded" />
              <div className="h-7 w-16 bg-muted/50 rounded-xl shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
