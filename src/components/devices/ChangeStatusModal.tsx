"use client";

import React, { useState } from "react";
import { RefreshCw, X, AlertCircle, Wrench, CheckCircle2, Archive, UserCheck, FileText, Check } from "lucide-react";
import { DeviceStatus } from "@prisma/client";
import { DEVICE_STATUS_LABELS } from "@/lib/constants";
import { updateDeviceStatusAction } from "@/lib/actions/devices";

export interface ActiveRepairInfo {
  id: string;
  issueDescription: string;
  vendor?: string | null;
  reportedAt: Date | string;
  reportedByEmail: string;
}

interface ChangeStatusModalProps {
  deviceId: string;
  currentStatus: DeviceStatus;
  hasActiveAssignment: boolean;
  activeRepair?: ActiveRepairInfo | null;
  onClose: () => void;
}

export function ChangeStatusModal({
  deviceId,
  currentStatus,
  hasActiveAssignment,
  activeRepair,
  onClose,
}: ChangeStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus>(currentStatus);
  const [issueDescription, setIssueDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEnteringRepair = selectedStatus === DeviceStatus.IN_REPAIR && currentStatus !== DeviceStatus.IN_REPAIR;
  const isExitingRepair = currentStatus === DeviceStatus.IN_REPAIR && selectedStatus !== DeviceStatus.IN_REPAIR;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      hasActiveAssignment &&
      selectedStatus !== DeviceStatus.IN_REPAIR &&
      selectedStatus !== DeviceStatus.ASSIGNED
    ) {
      setError(
        "Cannot mark device as In Stock or Retired while assigned to an employee. Unassign the device first."
      );
      return;
    }

    if (isEnteringRepair && !issueDescription.trim()) {
      setError("Please specify what needs to be repaired on this device.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await updateDeviceStatusAction(deviceId, selectedStatus, {
      issueDescription: isEnteringRepair ? issueDescription.trim() : undefined,
      vendor: isEnteringRepair ? vendor.trim() : undefined,
      resolutionNotes: isExitingRepair ? resolutionNotes.trim() : undefined,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  const allStatuses = [
    {
      status: DeviceStatus.IN_REPAIR,
      icon: Wrench,
      description: hasActiveAssignment
        ? "Device undergoing IT maintenance (employee keeps assignment)"
        : "Send unassigned device for IT repair",
      disabled: false,
    },
    {
      status: DeviceStatus.ASSIGNED,
      icon: UserCheck,
      description: "Active deployment (repair completed & returned to employee)",
      disabled: !hasActiveAssignment,
      disabledReason: "Use 'Assign' button to assign an employee",
    },
    {
      status: DeviceStatus.IN_STOCK,
      icon: CheckCircle2,
      description: "Available in IT inventory for future assignment",
      disabled: hasActiveAssignment,
      disabledReason: "Requires unassigning employee first",
    },
    {
      status: DeviceStatus.RETIRED,
      icon: Archive,
      description: "Decommissioned or recycled hardware",
      disabled: hasActiveAssignment,
      disabledReason: "Requires unassigning employee first",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold">
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {hasActiveAssignment ? (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <div>
                <span className="font-bold">Active Employee Assignment:</span> You can move this laptop to{" "}
                <strong className="text-amber-300">In Repair</strong>, and the employee will keep their assignment.
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
              This device has no active employee assignment. You can freely change its status between In Stock, In Repair, and Retired.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Status Selection Radios */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
              Select Target Status
            </label>

            <div className="space-y-2">
              {allStatuses.map((item) => {
                const isSelected = selectedStatus === item.status;
                const Icon = item.icon;

                return (
                  <label
                    key={item.status}
                    className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                      item.disabled
                        ? "opacity-40 cursor-not-allowed bg-muted/20 border-border/40"
                        : isSelected
                        ? "border-primary bg-primary/10 shadow-sm cursor-pointer"
                        : "border-border hover:bg-muted/40 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="status"
                        value={item.status}
                        checked={isSelected}
                        onChange={() => !item.disabled && setSelectedStatus(item.status)}
                        disabled={item.disabled}
                        className="mt-1 text-primary focus:ring-ring"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-foreground">
                            {DEVICE_STATUS_LABELS[item.status]?.label || item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                        {item.disabled && item.disabledReason && (
                          <span className="text-[10px] font-semibold text-amber-400/90 block mt-0.5">
                            • {item.disabledReason}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Prompt When Entering IN_REPAIR */}
          {isEnteringRepair && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Wrench className="w-4 h-4" />
                <span>Repair Service Information</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  What needs to be repaired? <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Screen flickering after drop, battery draining rapidly, keyboard liquid spill..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Repair Provider / Vendor <span className="text-[10px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apple Authorized Service, Dell On-site Support, Internal IT"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {/* Prompt When Exiting IN_REPAIR (Returning to ASSIGNED or IN_STOCK) */}
          {isExitingRepair && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Check className="w-4 h-4" />
                <span>Repair Completion & Return</span>
              </div>

              {/* Show original reported issue */}
              <div className="p-3 rounded-xl bg-background/80 border border-border/80 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Original Issue Reported:
                </span>
                <p className="font-semibold text-foreground">
                  {activeRepair?.issueDescription || "Hardware repair/maintenance"}
                </p>
                {activeRepair?.reportedAt && (
                  <span className="text-[10px] text-muted-foreground block">
                    Reported on {new Date(activeRepair.reportedAt).toLocaleDateString()} by {activeRepair.reportedByEmail}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Repair Resolution & Fix Notes <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Display panel replaced under AppleCare warranty, diagnostics ran with 100% pass..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {/* Submit Actions */}
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
              disabled={loading || selectedStatus === currentStatus}
              className="px-5 py-2 text-xs font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
            >
              {loading ? "Saving..." : "Save Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
