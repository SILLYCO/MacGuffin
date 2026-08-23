import React from "react";

export default function DeviceDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-muted/60" />
          <div className="space-y-1.5">
            <div className="h-7 w-56 bg-muted/80 rounded-xl" />
            <div className="h-3 w-36 bg-muted/40 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-muted/50 rounded-xl" />
          <div className="h-9 w-24 bg-muted/50 rounded-xl" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 glass-card p-6 space-y-4">
          <div className="h-4 w-32 bg-muted/60 rounded" />
          <div className="h-28 bg-muted/30 rounded-xl" />
        </div>
        <div className="md:col-span-2 glass-card p-6 space-y-4">
          <div className="h-4 w-36 bg-muted/60 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Assignment History */}
      <div className="glass-card p-6 space-y-4">
        <div className="h-5 w-48 bg-muted/70 rounded-lg" />
        <div className="h-32 bg-muted/20 rounded-xl" />
      </div>
    </div>
  );
}
