"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Loader2, Download } from "lucide-react";

export type ExportScope = "all" | "devices" | "components" | "purchases" | "employees" | "printers";

interface ExportExcelButtonProps {
  scope?: ExportScope;
  label?: string;
  variant?: "outline" | "emerald" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

const DEFAULT_LABELS: Record<ExportScope, string> = {
  all: "Export All Data (.xlsx)",
  devices: "Export Computers (.xlsx)",
  components: "Export Parts (.xlsx)",
  purchases: "Export Receipts (.xlsx)",
  employees: "Export Staff (.xlsx)",
  printers: "Export Printers (.xlsx)",
};

export function ExportExcelButton({
  scope = "all",
  label,
  variant = "outline",
  size = "md",
  className = "",
  showIcon = true,
}: ExportExcelButtonProps) {
  const [loading, setLoading] = useState(false);

  const displayLabel = label || DEFAULT_LABELS[scope] || "Export Excel";

  const handleExport = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/export?scope=${scope}`);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      let filename = `it-export-${scope}.xlsx`;

      if (disposition && disposition.includes("filename=")) {
        const matched = disposition.match(/filename="?([^";]+)"?/);
        if (matched && matched[1]) {
          filename = matched[1];
        }
      }

      // Trigger browser download via object URL
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Export error:", error);
      alert(`Could not export data: ${error.message || "An unexpected error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  // Base styling classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-4 py-2.5 text-sm rounded-xl gap-2",
    lg: "px-5 py-3 text-base rounded-xl gap-2.5",
  }[size];

  const variantClasses = {
    outline:
      "border border-border/80 bg-background/80 hover:bg-muted/80 text-foreground font-semibold shadow-sm hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all",
    emerald:
      "bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/25 hover:scale-[1.02] transition-all",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-colors",
  }[variant];

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center justify-center transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none ${sizeClasses} ${variantClasses} ${className}`}
      title={`Download formatted Excel (.xlsx) spreadsheet for ${scope}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-emerald-500 shrink-0" />
      ) : showIcon ? (
        <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0 transition-transform group-hover:scale-110" />
      ) : null}
      <span>{loading ? "Generating Excel..." : displayLabel}</span>
    </button>
  );
}
