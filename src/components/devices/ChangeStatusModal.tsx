"use client";

import React, { useState } from "react";
import { RefreshCw, X, AlertCircle } from "lucide-react";
import { DeviceStatus } from "@prisma/client";
import { DEVICE_STATUS_LABELS } from "@/lib/constants";
import { updateDeviceStatusAction } from "@/lib/actions/devices";

interface ChangeStatusModalProps {
  deviceId: string;
  currentStatus: DeviceStatus;
  hasActiveAssignment: boolean;
  onClose: () => void;
}

export function ChangeStatusModal({
  deviceId,
  currentStatus,
  hasActiveAssignment,
  onClose,
}: ChangeStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasActiveAssignment && selectedStatus !== DeviceStatus.ASSIGNED) {
      setError(
        "Cannot manually change status while device is assigned to an employee. Unassign the device first."
      );
      return;
    }

    setLoading(true);
    setError(null);

    const res = await updateDeviceStatusAction(deviceId, selectedStatus);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  const allowedStatuses = [
    DeviceStatus.IN_STOCK,
    DeviceStatus.IN_REPAIR,
    DeviceStatus.RETIRED,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border shadow-xl rounded-xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <RefreshCw className="w-5 h-5 text-primary" />
            <span>Update Device Status</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {hasActiveAssignment && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                This device currently has an active employee assignment. You must{" "}
                <strong>unassign</strong> the device before changing its status to In
                Stock, In Repair, or Retired.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Select New Status
            </label>
            <div className="space-y-2">
              {allowedStatuses.map((st) => (
                <label
                  key={st}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedStatus === st
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  } ${hasActiveAssignment ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="status"
                      value={st}
                      checked={selectedStatus === st}
                      onChange={() => setSelectedStatus(st)}
                      disabled={hasActiveAssignment}
                      className="text-primary focus:ring-ring"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {DEVICE_STATUS_LABELS[st].label}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || hasActiveAssignment}
              className="px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Updating..." : "Save Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
