import React from "react";

export default function PrinterDetailLoading() {
  return (
    <div className="space-y-8 pb-8 max-w-5xl mx-auto animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-28 bg-muted/60 rounded" />

      {/* Header Banner Skeleton */}
      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted/60" />
          <div className="space-y-2">
            <div className="h-7 w-64 bg-muted/60 rounded-xl" />
            <div className="h-4 w-40 bg-muted/40 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-muted/60 rounded-xl" />
          <div className="h-9 w-32 bg-muted/60 rounded-xl" />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <div className="h-6 w-40 bg-muted/60 rounded" />
          <div className="h-20 bg-muted/40 rounded-xl" />
        </div>
        <div className="glass-card p-6 space-y-4">
          <div className="h-6 w-40 bg-muted/60 rounded" />
          <div className="h-20 bg-muted/40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
