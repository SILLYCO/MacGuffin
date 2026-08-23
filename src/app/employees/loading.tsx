import React from "react";

export default function EmployeesLoading() {
  return (
    <div className="space-y-6 pb-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-8 w-60 bg-muted/80 rounded-xl" />
          <div className="h-4 w-80 bg-muted/40 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-muted/60 rounded-xl shrink-0" />
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-5 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="h-10 w-full lg:w-96 bg-muted/50 rounded-xl" />
        <div className="h-10 w-40 bg-muted/50 rounded-xl" />
      </div>

      {/* Table Skeleton */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/60 bg-muted/30">
          <div className="grid grid-cols-4 gap-4">
            <div className="h-4 w-28 bg-muted/60 rounded" />
            <div className="h-4 w-28 bg-muted/60 rounded" />
            <div className="h-4 w-32 bg-muted/60 rounded" />
            <div className="h-4 w-20 bg-muted/60 rounded justify-self-end" />
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-48">
                <div className="w-9 h-9 rounded-full bg-muted/60 shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-muted/70 rounded" />
                  <div className="h-3 bg-muted/40 rounded w-24" />
                </div>
              </div>
              <div className="h-5 w-28 bg-muted/50 rounded-md" />
              <div className="h-5 w-36 bg-muted/50 rounded-md" />
              <div className="h-8 w-24 bg-muted/50 rounded-xl shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
