"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Droplets, X, AlertCircle, Calendar } from "lucide-react";
import { recordPrinterInkRefillAction } from "@/lib/actions/printers";

interface RecordInkRefillModalProps {
  printerId: string;
  printerTitle: string;
  lastInkRefillDate?: Date | string | null;
  onClose: () => void;
}

export function RecordInkRefillModal({
  printerId,
  printerTitle,
  lastInkRefillDate,
  onClose,
}: RecordInkRefillModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [refillDate, setRefillDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!refillDate) {
      setError("Please select the ink refill date.");
      return;
    }

    setLoading(true);

    const res = await recordPrinterInkRefillAction(printerId, {
      refillDate,
      notes: notes.trim() || undefined,
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
            <Droplets className="w-5 h-5 text-blue-500" />
            <span>Record Ink / Toner Refill</span>
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
            <span className="text-muted-foreground">Printer:</span>
            <span className="font-bold text-foreground truncate max-w-[240px]">
              {printerTitle}
            </span>
          </div>

          {lastInkRefillDate && (
            <div className="text-[11px] text-muted-foreground px-1">
              Previous recorded refill:{" "}
              <strong>
                {new Date(lastInkRefillDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </strong>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Refill / Replacement Date <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={refillDate}
                onChange={(e) => setRefillDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          {/* Cartridge / Refill Notes */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Cartridge & Refill Notes <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Replaced Black Toner Cartridge (HP 58A), 100% full"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

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
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md shadow-blue-600/20"
            >
              {loading ? "Recording..." : "Save Refill Record"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
