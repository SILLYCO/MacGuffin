"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeviceStatus } from "@prisma/client";
import { Edit, UserCheck, RefreshCw, UserX, Trash2 } from "lucide-react";
import { ReassignModal } from "@/components/devices/ReassignModal";
import { ChangeStatusModal } from "@/components/devices/ChangeStatusModal";
import { unassignDeviceAction, deleteDeviceAction } from "@/lib/actions/devices";

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

interface DeviceDetailActionsProps {
  deviceId: string;
  deviceTitle: string;
  currentStatus: DeviceStatus;
  hasActiveAssignment: boolean;
  activeEmployeeId?: string | null;
  activeRepair?: {
    id: string;
    issueDescription: string;
    vendor?: string | null;
    reportedAt: Date | string;
    reportedByEmail: string;
  } | null;
  employees: EmployeeOption[];
  userRole: string;
}

export function DeviceDetailActions({
  deviceId,
  deviceTitle,
  currentStatus,
  hasActiveAssignment,
  activeEmployeeId,
  activeRepair,
  employees,
  userRole,
}: DeviceDetailActionsProps) {
  const router = useRouter();
  const isIT = userRole === "IT";

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  if (!isIT) {
    return null; // Manager role is read-only
  }

  const handleUnassign = async () => {
    if (
      !confirm(
        "Are you sure you want to unassign this device? It will be returned to In Stock status."
      )
    ) {
      return;
    }

    setUnassigning(true);
    const res = await unassignDeviceAction(deviceId);
    setUnassigning(false);

    if (res?.error) {
      alert(res.error);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY delete ${deviceTitle}? This action cannot be undone.`
      )
    ) {
      return;
    }

    const res = await deleteDeviceAction(deviceId);
    if (res?.error) {
      alert(res.error);
    } else {
      router.push("/devices");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Edit Specs */}
        <Link
          href={`/devices/${deviceId}/edit`}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors shadow-sm"
        >
          <Edit className="w-3.5 h-3.5 text-muted-foreground" />
          Edit Specs
        </Link>

        {/* Reassign / Assign */}
        <button
          onClick={() => setShowReassignModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <UserCheck className="w-3.5 h-3.5" />
          {hasActiveAssignment ? "Reassign Device" : "Assign to Employee"}
        </button>

        {/* Unassign (if active) */}
        {hasActiveAssignment && (
          <button
            onClick={handleUnassign}
            disabled={unassigning}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            <UserX className="w-3.5 h-3.5" />
            {unassigning ? "Unassigning..." : "Unassign Device"}
          </button>
        )}

        {/* Change Manual Status */}
        <button
          onClick={() => setShowStatusModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          Change Status
        </button>

        {/* Delete Device */}
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
          title="Delete Device from Inventory"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>

      {showReassignModal && (
        <ReassignModal
          deviceId={deviceId}
          deviceTitle={deviceTitle}
          employees={employees}
          currentAssignedEmployeeId={activeEmployeeId}
          onClose={() => setShowReassignModal(false)}
        />
      )}

      {showStatusModal && (
        <ChangeStatusModal
          deviceId={deviceId}
          currentStatus={currentStatus}
          hasActiveAssignment={hasActiveAssignment}
          activeRepair={activeRepair}
          onClose={() => setShowStatusModal(false)}
        />
      )}
    </>
  );
}
