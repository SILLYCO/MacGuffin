import React from "react";

export default function RootLoading() {
  return (
    <div className="space-y-6 pb-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted/80 rounded-xl" />
        <div className="h-4 w-96 max-w-full bg-muted/40 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-4">
            <div className="h-6 w-3/4 bg-muted/70 rounded-lg" />
            <div className="h-16 bg-muted/30 rounded-xl" />
            <div className="h-4 w-1/2 bg-muted/40 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
