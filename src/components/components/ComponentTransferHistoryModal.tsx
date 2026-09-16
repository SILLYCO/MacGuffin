"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, History, ArrowRight, User, Calendar, Tag, Layers } from "lucide-react";
import { ComponentTransferAction } from "@prisma/client";

interface TransferRecord {
  id: string;
  fromDeviceName?: string | null;
  toDeviceName?: string | null;
  actionType: ComponentTransferAction;
  reason?: string | null;
  performedByEmail: string;
  transferredAt: Date | string;
}

interface ComponentTransferHistoryModalProps {
  componentTitle: string;
  componentSerial: string;
  transfers: TransferRecord[];
  onClose: () => void;
}

export function ComponentTransferHistoryModal({
  componentTitle,
  componentSerial,
  transfers,
  onClose,
}: ComponentTransferHistoryModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getActionBadge = (action: ComponentTransferAction) => {
    switch (action) {
      case "INSTALLED_FROM_STOCK":
        return {
          label: "Mounted from Stock",
          bg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
        };
      case "TRANSFERRED_BETWEEN_DEVICES":
        return {
          label: "Hot-Swapped",
          bg: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
        };
      case "DETACHED_TO_STOCK":
        return {
          label: "Returned to Stock",
          bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
        };
      case "MARKED_DEFECTIVE":
        return {
          label: "Quarantined / Defect",
          bg: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
        };
      case "RETIRED":
        return {
          label: "Decommissioned",
          bg: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
        };
      default:
        return {
          label: action,
          bg: "bg-muted text-muted-foreground border-border",
        };
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-xl glass-card border-border shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 z-10 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Hardware Transfer Trail</h2>
              <p className="text-xs text-muted-foreground font-mono">
                {componentTitle} • SN: {componentSerial}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {transfers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No transfer events recorded yet for this component.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {transfers.map((t, idx) => {
                const badge = getActionBadge(t.actionType);
                const dateStr = new Date(t.transferredAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <div key={t.id || idx} className="relative group">
                    {/* Bullet marker */}
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-background border-2 border-primary group-hover:scale-125 transition-transform" />

                    <div className="glass-card p-3.5 border-border/70 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3" /> {dateStr}
                        </span>
                      </div>

                      {/* Route from -> to */}
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <span className="text-muted-foreground font-normal">
                          {t.fromDeviceName || "IT Storage Stock"}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-bold text-foreground">
                          {t.toDeviceName || "IT Storage Stock"}
                        </span>
                      </div>

                      {/* Reason */}
                      {t.reason && (
                        <p className="text-xs text-muted-foreground italic bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/40">
                          &ldquo;{t.reason}&rdquo;
                        </p>
                      )}

                      {/* Performed by */}
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1 border-t border-border/40">
                        <User className="w-3 h-3" /> Logged by: <span className="font-mono">{t.performedByEmail}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border/60 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-colors"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
