"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, Laptop, Monitor, Server, Wrench, Check } from "lucide-react";
import { installComponentAction } from "@/lib/actions/components";

interface DeviceOption {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  deviceType?: string;
}

interface InstallComponentModalProps {
  componentId: string;
  componentTitle: string;
  componentSerial: string;
  devices: DeviceOption[];
  preselectedDeviceId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InstallComponentModal({
  componentId,
  componentTitle,
  componentSerial,
  devices,
  preselectedDeviceId,
  onClose,
  onSuccess,
}: InstallComponentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [targetDeviceId, setTargetDeviceId] = useState(preselectedDeviceId || (devices[0]?.id || ""));
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDeviceId) {
      setError("Please select a target computer to install this component into.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await installComponentAction(componentId, targetDeviceId, reason);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  if (!mounted) return null;

  const selectedDevice = devices.find((d) => d.id === targetDeviceId);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md glass-card border-border shadow-2xl p-6 space-y-5 z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Mount / Install Component</h2>
              <p className="text-xs text-muted-foreground">Attach part from stock shelf into a PC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Component Card */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border/70 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-foreground">{componentTitle}</div>
            <div className="font-mono text-[11px] text-muted-foreground mt-0.5">SN: {componentSerial}</div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Available In Stock
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
              Target Computer Machine
            </label>
            <select
              value={targetDeviceId}
              onChange={(e) => setTargetDeviceId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              required
            >
              {devices.length === 0 ? (
                <option value="">No computers available</option>
              ) : (
                devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.brand} {d.model} ({d.serialNumber})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
              Reason / Work Order Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Memory upgrade for developer workstation, secondary storage..."
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
              disabled={loading || !targetDeviceId}
              className="px-5 py-2.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" /> Confirm Installation
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
