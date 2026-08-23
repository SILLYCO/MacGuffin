import React from "react";

export default function EmployeeDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-muted/60" />
          <div className="space-y-1.5">
            <div className="h-7 w-48 bg-muted/80 rounded-xl" />
            <div className="h-4 w-32 bg-muted/40 rounded" />
          </div>
        </div>
        <div className="h-9 w-24 bg-muted/50 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <div className="h-5 w-36 bg-muted/70 rounded" />
          <div className="h-28 bg-muted/30 rounded-xl" />
        </div>
        <div className="glass-card p-6 space-y-4">
          <div className="h-5 w-36 bg-muted/70 rounded" />
          <div className="h-28 bg-muted/30 rounded-xl" />
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="h-5 w-48 bg-muted/70 rounded" />
        <div className="h-32 bg-muted/20 rounded-xl" />
      </div>
    </div>
  );
}
