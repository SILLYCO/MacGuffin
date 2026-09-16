"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, ArrowRightLeft, Archive, AlertTriangle, Check, ArrowRight } from "lucide-react";
import { detachComponentAction, transferComponentAction } from "@/lib/actions/components";

interface DeviceOption {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  deviceType?: string;
}

interface DetachOrTransferModalProps {
  componentId: string;
  componentTitle: string;
  componentSerial: string;
  currentDeviceName: string;
  currentDeviceId?: string | null;
  devices: DeviceOption[];
  onClose: () => void;
  onSuccess?: () => void;
}

export function DetachOrTransferModal({
  componentId,
  componentTitle,
  componentSerial,
  currentDeviceName,
  currentDeviceId,
  devices,
  onClose,
  onSuccess,
}: DetachOrTransferModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"DETACH" | "TRANSFER">("DETACH");
  const [detachTarget, setDetachTarget] = useState<"IN_STOCK" | "DEFECTIVE">("IN_STOCK");

  // Filter out current device from transfer candidates
  const candidateDevices = devices.filter((d) => d.id !== currentDeviceId);
  const [targetDeviceId, setTargetDeviceId] = useState<string>(candidateDevices[0]?.id || "");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let res;
    if (mode === "DETACH") {
      res = await detachComponentAction(componentId, detachTarget, reason);
    } else {
      if (!targetDeviceId) {
        setError("Please select a target computer to transfer this component into.");
        setLoading(false);
        return;
      }
      res = await transferComponentAction(componentId, targetDeviceId, reason);
    }

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col glass-card border-border shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 my-4 sm:my-8 z-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Detach or Swap Component</h2>
              <p className="text-xs text-muted-foreground">
                Move hardware piece to shelf or transfer to another PC
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

        {/* Current Part Info */}
        <div className="p-3.5 rounded-xl bg-muted/50 border border-border/70 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-foreground">{componentTitle}</div>
            <div className="font-mono text-[11px] text-muted-foreground mt-0.5">SN: {componentSerial}</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block uppercase font-bold">Currently Mounted In</span>
            <span className="font-semibold text-foreground text-xs">{currentDeviceName}</span>
          </div>
        </div>

        {/* Action Mode Toggle */}
        <div className="grid grid-cols-2 p-1 bg-muted/60 border border-border/70 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode("DETACH")}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "DETACH"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive className="w-4 h-4" /> Detach to Stock
          </button>
          <button
            type="button"
            onClick={() => setMode("TRANSFER")}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "TRANSFER"
                ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" /> Transfer to PC
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "DETACH" ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                Destination Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDetachTarget("IN_STOCK")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    detachTarget === "IN_STOCK"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500"
                      : "border-border bg-card hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <div className="font-bold text-xs">IT Storage Shelf</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Part is working & available for reuse</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDetachTarget("DEFECTIVE")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    detachTarget === "DEFECTIVE"
                      ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500"
                      : "border-border bg-card hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Defective / Faulty
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">Quarantine for RMA or warranty repair</div>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                Target Destination Machine
              </label>
              <select
                value={targetDeviceId}
                onChange={(e) => setTargetDeviceId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                required
              >
                {candidateDevices.length === 0 ? (
                  <option value="">No other computers available for transfer</option>
                ) : (
                  candidateDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.brand} {d.model} ({d.serialNumber})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
              Reason / Transfer Note
            </label>
            <input
              type="text"
              placeholder={
                mode === "DETACH"
                  ? "e.g. Swapped out during 64GB upgrade, salvaged working drive..."
                  : "e.g. Transferred RAM stick to designer PC for heavy rendering..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (mode === "TRANSFER" && !targetDeviceId)}
              className="px-5 py-2.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : mode === "DETACH" ? (
                <>
                  <Archive className="w-4 h-4" /> Detach from Machine
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" /> Complete Direct Transfer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
