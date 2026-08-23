import React from "react";

export default function DevicesLoading() {
  return (
    <div className="space-y-6 pb-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-8 w-64 bg-muted/80 rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-muted/40 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-muted/60 rounded-xl shrink-0" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="glass-card p-5 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="h-10 w-full lg:w-96 bg-muted/50 rounded-xl" />
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="h-10 w-32 bg-muted/50 rounded-xl" />
          <div className="h-10 w-32 bg-muted/50 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/60 bg-muted/30">
          <div className="grid grid-cols-5 gap-4">
            <div className="h-4 w-24 bg-muted/60 rounded" />
            <div className="h-4 w-32 bg-muted/60 rounded" />
            <div className="h-4 w-24 bg-muted/60 rounded" />
            <div className="h-4 w-20 bg-muted/60 rounded" />
            <div className="h-4 w-28 bg-muted/60 rounded" />
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-xl bg-muted/60 shrink-0" />
                <div className="space-y-1 w-40">
                  <div className="h-4 bg-muted/70 rounded" />
                  <div className="h-3 bg-muted/40 rounded w-24" />
                </div>
              </div>
              <div className="h-4 w-32 bg-muted/50 rounded flex-1 hidden md:block" />
              <div className="h-5 w-24 bg-muted/50 rounded-md flex-1 hidden sm:block" />
              <div className="h-6 w-20 bg-muted/60 rounded-full flex-1" />
              <div className="h-8 w-24 bg-muted/50 rounded-xl shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
