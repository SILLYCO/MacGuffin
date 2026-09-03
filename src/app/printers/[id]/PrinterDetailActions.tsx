"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wrench, Droplets, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { PrinterStatus } from "@prisma/client";
import { deletePrinterAction } from "@/lib/actions/printers";
import { PrinterStatusModal } from "@/components/printers/PrinterStatusModal";
import { RecordInkRefillModal } from "@/components/printers/RecordInkRefillModal";

interface PrinterDetailActionsProps {
  printer: {
    id: string;
    brand: string;
    model: string;
    status: PrinterStatus;
    lastInkRefillDate?: Date | string | null;
  };
  activeRepair?: {
    issueDescription: string;
    vendor?: string | null;
  } | null;
  userRole: string;
}

export function PrinterDetailActions({
  printer,
  activeRepair,
  userRole,
}: PrinterDetailActionsProps) {
  const router = useRouter();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showInkModal, setShowInkModal] = useState(false);
  const isIT = userRole === "IT";

  if (!isIT) return null;

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${printer.brand} ${printer.model}? All repair and ink refill history will be permanently deleted.`
      )
    ) {
      return;
    }

    const res = await deletePrinterAction(printer.id);
    if (res?.error) {
      alert(res.error);
    } else {
      router.push("/printers");
    }
  };

  const printerTitle = `${printer.brand} ${printer.model}`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Change Status Button */}
        <button
          onClick={() => setShowStatusModal(true)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
            printer.status === PrinterStatus.IN_REPAIR
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
              : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
          }`}
        >
          {printer.status === PrinterStatus.IN_REPAIR ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark as Working
            </>
          ) : (
            <>
              <Wrench className="w-3.5 h-3.5" />
              Report Repair / Issue
            </>
          )}
        </button>

        {/* Record Ink Refill Button */}
        <button
          onClick={() => setShowInkModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm shadow-blue-600/20"
        >
          <Droplets className="w-3.5 h-3.5" />
          Record Ink Refill
        </button>

        {/* Edit Button */}
        <Link
          href={`/printers/${printer.id}/edit`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-card border border-border text-foreground hover:bg-muted transition-colors shadow-sm"
        >
          <Edit className="w-3.5 h-3.5 text-muted-foreground" />
          Edit
        </Link>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>

      {showStatusModal && (
        <PrinterStatusModal
          printerId={printer.id}
          currentStatus={printer.status}
          printerTitle={printerTitle}
          activeRepair={activeRepair}
          onClose={() => setShowStatusModal(false)}
        />
      )}

      {showInkModal && (
        <RecordInkRefillModal
          printerId={printer.id}
          printerTitle={printerTitle}
          lastInkRefillDate={printer.lastInkRefillDate}
          onClose={() => setShowInkModal(false)}
        />
      )}
    </>
  );
}
