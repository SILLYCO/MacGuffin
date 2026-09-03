"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { UserCheck, X, AlertCircle } from "lucide-react";
import { assignDeviceAction } from "@/lib/actions/devices";

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
  department: string;
  currentAssignment?: {
    device: {
      id: string;
      brand: string;
      model: string;
    };
  } | null;
}

interface ReassignModalProps {
  deviceId: string;
  deviceTitle: string;
  employees: EmployeeOption[];
  currentAssignedEmployeeId?: string | null;
  onClose: () => void;
}

export function ReassignModal({
  deviceId,
  deviceTitle,
  employees,
  currentAssignedEmployeeId,
  onClose,
}: ReassignModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setError("Please select an employee");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await assignDeviceAction(deviceId, selectedEmployeeId);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  const selectedEmp = employees.find((e) => e.id === selectedEmployeeId);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border shadow-xl rounded-xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <UserCheck className="w-5 h-5 text-primary" />
            <span>Assign / Reassign Device</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs">
            <span className="font-semibold text-foreground">Target Device: </span>
            <span className="text-muted-foreground">{deviceTitle}</span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Select Employee
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="">-- Choose an Employee --</option>
              {employees.map((emp) => {
                const isCurrent = emp.id === currentAssignedEmployeeId;
                const activeDevice = emp.currentAssignment?.device;

                return (
                  <option key={emp.id} value={emp.id} disabled={isCurrent}>
                    {emp.name} ({emp.department})
                    {isCurrent
                      ? " - Currently Assigned"
                      : activeDevice
                      ? ` [Has ${activeDevice.brand} ${activeDevice.model}]`
                      : " [No active device]"}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedEmp?.currentAssignment?.device && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
              ⚠️ <strong>Note:</strong> {selectedEmp.name} currently holds{" "}
              {selectedEmp.currentAssignment.device.brand}{" "}
              {selectedEmp.currentAssignment.device.model}. Reassigning will automatically
              unassign their previous laptop and set it to <strong>In Stock</strong>.
            </div>
          )}

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
              disabled={loading || !selectedEmployeeId}
              className="px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Processing..." : "Confirm Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
