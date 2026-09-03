"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Wrench, CheckCircle2, X, AlertCircle } from "lucide-react";
import { PrinterStatus } from "@prisma/client";
import { updatePrinterStatusAction } from "@/lib/actions/printers";

interface PrinterStatusModalProps {
  printerId: string;
  currentStatus: PrinterStatus;
  printerTitle: string;
  activeRepair?: {
    issueDescription: string;
    vendor?: string | null;
  } | null;
  onClose: () => void;
}

export function PrinterStatusModal({
  printerId,
  currentStatus,
  printerTitle,
  activeRepair,
  onClose,
}: PrinterStatusModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const targetStatus =
    currentStatus === PrinterStatus.WORKING
      ? PrinterStatus.IN_REPAIR
      : PrinterStatus.WORKING;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Repair Inputs
  const [issueDescription, setIssueDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (targetStatus === PrinterStatus.IN_REPAIR && !issueDescription.trim()) {
      setError("Please describe the issue requiring printer repair.");
      return;
    }

    setLoading(true);

    const res = await updatePrinterStatusAction(printerId, targetStatus, {
      issueDescription: issueDescription.trim() || undefined,
      vendor: vendor.trim() || null,
      resolutionNotes: resolutionNotes.trim() || undefined,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-bold">
            {targetStatus === PrinterStatus.IN_REPAIR ? (
              <Wrench className="w-5 h-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
            <span>
              {targetStatus === PrinterStatus.IN_REPAIR
                ? "Send Printer to Repair"
                : "Mark Printer as Working"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Target Printer:</span>
            <span className="font-bold text-foreground truncate max-w-[240px]">
              {printerTitle}
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Entering IN_REPAIR: Issue Description + Vendor */}
          {targetStatus === PrinterStatus.IN_REPAIR ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                ⚠️ Marking this printer <strong>In Repair</strong> flags it across the office network so colleagues know printing is temporarily paused.
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Issue Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Paper pickup roller jamming repeatedly, toner cartridge drum error..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Service Vendor / Technician <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authorized HP Service Center, Internal IT"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          ) : (
            /* Exiting IN_REPAIR: Original Issue + Resolution Notes */
            <div className="space-y-4">
              {activeRepair && (
                <div className="p-3.5 rounded-xl bg-muted/50 border border-border space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Reported Repair Issue:
                  </span>
                  <p className="text-foreground font-medium italic">
                    "{activeRepair.issueDescription}"
                  </p>
                  {activeRepair.vendor && (
                    <span className="text-[11px] text-muted-foreground block mt-1">
                      Serviced by: <strong>{activeRepair.vendor}</strong>
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Resolution Notes <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Replaced paper feed roller, updated printer firmware, cleaned optical sensors..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-md ${
                targetStatus === PrinterStatus.IN_REPAIR
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
              }`}
            >
              {loading
                ? "Updating..."
                : targetStatus === PrinterStatus.IN_REPAIR
                ? "Send to Repair"
                : "Confirm Working"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
