import React from "react";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 pb-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="glass-card p-8 border-primary/20 bg-card/60 relative overflow-hidden">
        <div className="h-4 w-36 bg-primary/20 rounded-full mb-3" />
        <div className="h-8 w-72 bg-muted/60 rounded-xl mb-2" />
        <div className="h-4 w-96 max-w-full bg-muted/40 rounded-lg" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-muted/60 rounded" />
              <div className="w-8 h-8 rounded-xl bg-muted/50" />
            </div>
            <div className="h-8 w-12 bg-muted/80 rounded-lg" />
            <div className="h-2 w-full bg-muted/40 rounded-full" />
          </div>
        ))}
      </div>

      {/* Grid Stream Skeleton */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="h-5 w-48 bg-muted/70 rounded-lg" />
            <div className="h-3 w-64 bg-muted/40 rounded" />
          </div>
          <div className="h-8 w-28 bg-muted/50 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-card/40 border border-border/60 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/60 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-3/4 bg-muted/70 rounded" />
                  <div className="h-3 w-1/2 bg-muted/40 rounded" />
                </div>
              </div>
              <div className="h-16 bg-muted/20 rounded-xl" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-5 w-20 bg-muted/50 rounded-full" />
                <div className="h-4 w-24 bg-muted/40 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
