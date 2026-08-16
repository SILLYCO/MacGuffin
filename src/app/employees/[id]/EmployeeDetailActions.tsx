"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Trash2 } from "lucide-react";
import { deleteEmployeeAction } from "@/lib/actions/employees";

interface EmployeeDetailActionsProps {
  employeeId: string;
  employeeName: string;
  userRole: string;
}

export function EmployeeDetailActions({
  employeeId,
  employeeName,
  userRole,
}: EmployeeDetailActionsProps) {
  const router = useRouter();
  const isIT = userRole === "IT";

  if (!isIT) return null;

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${employeeName}? Any active laptop assignment will be unassigned and returned to inventory.`
      )
    ) {
      return;
    }

    const res = await deleteEmployeeAction(employeeId);
    if (res?.error) {
      alert(res.error);
    } else {
      router.push("/employees");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/employees/${employeeId}/edit`}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors shadow-sm"
      >
        <Edit className="w-3.5 h-3.5 text-muted-foreground" />
        Edit Profile
      </Link>

      <button
        onClick={handleDelete}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete Employee
      </button>
    </div>
  );
}
