import React from "react";

export default function PrintersLoading() {
  return (
    <div className="space-y-6 pb-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted/60 rounded-xl" />
          <div className="h-4 w-96 bg-muted/40 rounded-lg" />
        </div>
        <div className="h-11 w-44 bg-muted/60 rounded-xl shrink-0" />
      </div>

      {/* Filter and Search Bar Skeleton */}
      <div className="glass-card p-5 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="h-10 w-full lg:w-96 bg-muted/50 rounded-xl" />
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="h-10 w-36 bg-muted/50 rounded-xl" />
          <div className="h-10 w-36 bg-muted/50 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/60 bg-muted/30 flex justify-between">
          <div className="h-4 w-32 bg-muted/60 rounded" />
          <div className="h-4 w-24 bg-muted/60 rounded" />
        </div>
        <div className="divide-y divide-border/60">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/60 shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-muted/60 rounded" />
                  <div className="h-3 w-32 bg-muted/40 rounded" />
                </div>
              </div>
              <div className="h-6 w-28 bg-muted/50 rounded-md" />
              <div className="h-6 w-28 bg-muted/40 rounded-md" />
              <div className="h-6 w-20 bg-muted/50 rounded-full" />
              <div className="h-4 w-24 bg-muted/50 rounded" />
              <div className="h-8 w-24 bg-muted/60 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
