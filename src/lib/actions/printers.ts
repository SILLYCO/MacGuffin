"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireITRole } from "@/lib/permissions";
import { PrinterStatus, PrinterConnectionType, AuditAction, AuditEntityType } from "@prisma/client";
import { logAuditAction } from "@/lib/audit";

export async function createPrinterAction(formData: FormData) {
  const user = await requireITRole();

  const brand = (formData.get("brand") as string)?.trim();
  const model = (formData.get("model") as string)?.trim();
  const ipAddress = (formData.get("ipAddress") as string)?.trim();
  const macAddress = (formData.get("macAddress") as string)?.trim().toUpperCase();
  const location = (formData.get("location") as string)?.trim() || null;
  const status = (formData.get("status") as PrinterStatus) || PrinterStatus.WORKING;
  const isColor = formData.get("isColor") === "true";
  const canScan = formData.get("canScan") === "true";
  const canCopy = formData.get("canCopy") === "true";
  const isDuplex = formData.get("isDuplex") === "true";
  const connectionType =
    (formData.get("connectionType") as PrinterConnectionType) || PrinterConnectionType.ETHERNET;
  const driverUrl = (formData.get("driverUrl") as string)?.trim() || null;
  const initialRefillDateStr = (formData.get("lastInkRefillDate") as string)?.trim();
  const initialRefillNotes = (formData.get("lastInkRefillNotes") as string)?.trim() || null;

  if (!brand || !model || !ipAddress || !macAddress) {
    return { error: "Brand, Model, IP Address, and MAC Address are required." };
  }

  const lastInkRefillDate = initialRefillDateStr ? new Date(initialRefillDateStr) : null;

  try {
    const printer = await db.printer.create({
      data: {
        brand,
        model,
        ipAddress,
        macAddress,
        location,
        status,
        isColor,
        canScan,
        canCopy,
        isDuplex,
        connectionType,
        driverUrl,
        lastInkRefillDate,
        lastInkRefillNotes: initialRefillNotes,
      },
    });

    if (lastInkRefillDate) {
      await db.printerInkRefill.create({
        data: {
          printerId: printer.id,
          refillDate: lastInkRefillDate,
          notes: initialRefillNotes || "Initial ink/toner level recorded on setup",
          refilledByEmail: user.email,
        },
      });
    }

    await logAuditAction({
      action: AuditAction.PRINTER_CREATED,
      entityType: AuditEntityType.PRINTER,
      entityId: printer.id,
      entityName: `${brand} ${model} (${ipAddress})`,
      details: {
        brand,
        model,
        ipAddress,
        macAddress,
        location,
        status,
        isColor,
        canScan,
        canCopy,
        isDuplex,
        connectionType,
        driverUrl,
        lastInkRefillDate: lastInkRefillDate ? lastInkRefillDate.toISOString() : null,
      },
      actor: user,
    });

    revalidatePath("/printers");
    revalidatePath("/dashboard");
    revalidatePath("/audit-logs");
    return { success: true, printerId: printer.id };
  } catch (error: any) {
    console.error("createPrinterAction error:", error);
    return { error: error?.message || "Failed to register printer." };
  }
}

export async function updatePrinterAction(printerId: string, formData: FormData) {
  const user = await requireITRole();

  const brand = (formData.get("brand") as string)?.trim();
  const model = (formData.get("model") as string)?.trim();
  const ipAddress = (formData.get("ipAddress") as string)?.trim();
  const macAddress = (formData.get("macAddress") as string)?.trim().toUpperCase();
  const location = (formData.get("location") as string)?.trim() || null;
  const isColor = formData.get("isColor") === "true";
  const canScan = formData.get("canScan") === "true";
  const canCopy = formData.get("canCopy") === "true";
  const isDuplex = formData.get("isDuplex") === "true";
  const connectionType =
    (formData.get("connectionType") as PrinterConnectionType) || PrinterConnectionType.ETHERNET;
  const driverUrl = (formData.get("driverUrl") as string)?.trim() || null;

  if (!brand || !model || !ipAddress || !macAddress) {
    return { error: "Brand, Model, IP Address, and MAC Address are required." };
  }

  try {
    const prev = await db.printer.findUnique({ where: { id: printerId } });
    if (!prev) {
      return { error: "Printer not found." };
    }

    const updated = await db.printer.update({
      where: { id: printerId },
      data: {
        brand,
        model,
        ipAddress,
        macAddress,
        location,
        isColor,
        canScan,
        canCopy,
        isDuplex,
        connectionType,
        driverUrl,
      },
    });

    await logAuditAction({
      action: AuditAction.PRINTER_UPDATED,
      entityType: AuditEntityType.PRINTER,
      entityId: printerId,
      entityName: `${brand} ${model} (${ipAddress})`,
      details: {
        brand,
        model,
        ipAddress,
        macAddress,
        location,
        isColor,
        canScan,
        canCopy,
        isDuplex,
        connectionType,
        driverUrl,
        prevIpAddress: prev.ipAddress,
        prevMacAddress: prev.macAddress,
      },
      actor: user,
    });

    revalidatePath("/printers");
    revalidatePath(`/printers/${printerId}`);
    revalidatePath("/dashboard");
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("updatePrinterAction error:", error);
    return { error: error?.message || "Failed to update printer." };
  }
}

export async function deletePrinterAction(printerId: string) {
  const user = await requireITRole();

  try {
    const printer = await db.printer.findUnique({
      where: { id: printerId },
      select: { brand: true, model: true, ipAddress: true },
    });

    await db.printer.delete({
      where: { id: printerId },
    });

    await logAuditAction({
      action: AuditAction.PRINTER_DELETED,
      entityType: AuditEntityType.PRINTER,
      entityId: printerId,
      entityName: printer ? `${printer.brand} ${printer.model} (${printer.ipAddress})` : "Printer",
      details: {
        printerId,
        brand: printer?.brand,
        model: printer?.model,
      },
      actor: user,
    });

    revalidatePath("/printers");
    revalidatePath("/dashboard");
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("deletePrinterAction error:", error);
    return { error: error?.message || "Failed to delete printer." };
  }
}

export async function updatePrinterStatusAction(
  printerId: string,
  newStatus: PrinterStatus,
  repairData?: {
    issueDescription?: string;
    resolutionNotes?: string;
    vendor?: string | null;
  }
) {
  const user = await requireITRole();

  try {
    const prev = await db.printer.findUnique({
      where: { id: printerId },
    });

    if (!prev) {
      return { error: "Printer not found." };
    }

    if (newStatus === PrinterStatus.IN_REPAIR && !repairData?.issueDescription?.trim()) {
      const open = await db.printerRepairRecord.findFirst({
        where: { printerId, resolvedAt: null },
      });
      if (!open) {
        return { error: "Please provide a description of the issue requiring repair." };
      }
    }

    let activeRepairInfo: { issueDescription?: string; vendor?: string | null } | null = null;

    // 1. Update status
    await db.printer.update({
      where: { id: printerId },
      data: { status: newStatus },
    });

    // 2. If moving into IN_REPAIR, create repair ticket
    if (newStatus === PrinterStatus.IN_REPAIR && prev.status !== PrinterStatus.IN_REPAIR) {
      await db.printerRepairRecord.create({
        data: {
          printerId,
          issueDescription: repairData?.issueDescription?.trim() || "Maintenance / Hardware Repair",
          vendor: repairData?.vendor?.trim() || null,
          reportedAt: new Date(),
          reportedByEmail: user.email,
        },
      });
    }

    // 3. If resolving back to WORKING, resolve open repair ticket
    if (prev.status === PrinterStatus.IN_REPAIR && newStatus === PrinterStatus.WORKING) {
      const openRepair = await db.printerRepairRecord.findFirst({
        where: { printerId, resolvedAt: null },
        orderBy: { createdAt: "desc" },
      });

      if (openRepair) {
        activeRepairInfo = {
          issueDescription: openRepair.issueDescription,
          vendor: openRepair.vendor,
        };
        await db.printerRepairRecord.update({
          where: { id: openRepair.id },
          data: {
            resolvedAt: new Date(),
            resolvedByEmail: user.email,
            resolutionNotes: repairData?.resolutionNotes?.trim() || null,
          },
        });
      }
    }

    // 4. Log audit action
    await logAuditAction({
      action: AuditAction.PRINTER_STATUS_CHANGED,
      entityType: AuditEntityType.PRINTER,
      entityId: printerId,
      entityName: `${prev.brand} ${prev.model} (${prev.ipAddress})`,
      details: {
        fromStatus: prev.status,
        toStatus: newStatus,
        issueDescription:
          repairData?.issueDescription?.trim() || activeRepairInfo?.issueDescription || null,
        resolutionNotes: repairData?.resolutionNotes?.trim() || null,
        vendor: repairData?.vendor?.trim() || activeRepairInfo?.vendor || null,
      },
      actor: user,
    });

    revalidatePath("/printers");
    revalidatePath(`/printers/${printerId}`);
    revalidatePath("/dashboard");
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("updatePrinterStatusAction error:", error);
    return { error: error?.message || "Failed to update printer status." };
  }
}

export async function recordPrinterInkRefillAction(
  printerId: string,
  data: {
    refillDate: string; // YYYY-MM-DD format from input
    notes?: string;
  }
) {
  const user = await requireITRole();

  if (!data.refillDate) {
    return { error: "Refill date is required." };
  }

  const refillDate = new Date(data.refillDate);
  const notes = data.notes?.trim() || null;

  try {
    const printer = await db.printer.findUnique({
      where: { id: printerId },
      select: { brand: true, model: true, ipAddress: true, lastInkRefillDate: true },
    });

    if (!printer) {
      return { error: "Printer not found." };
    }

    // 1. Create history record
    await db.printerInkRefill.create({
      data: {
        printerId,
        refillDate,
        notes: notes || "Ink/Toner cartridge refilled or replaced",
        refilledByEmail: user.email,
      },
    });

    // 2. Update printer's last ink refill pointer
    await db.printer.update({
      where: { id: printerId },
      data: {
        lastInkRefillDate: refillDate,
        lastInkRefillNotes: notes,
      },
    });

    // 3. Log audit action
    await logAuditAction({
      action: AuditAction.PRINTER_INK_REFILLED,
      entityType: AuditEntityType.PRINTER,
      entityId: printerId,
      entityName: `${printer.brand} ${printer.model} (${printer.ipAddress})`,
      details: {
        refillDate: refillDate.toISOString(),
        notes,
        prevRefillDate: printer.lastInkRefillDate ? printer.lastInkRefillDate.toISOString() : null,
      },
      actor: user,
    });

    revalidatePath("/printers");
    revalidatePath(`/printers/${printerId}`);
    revalidatePath("/dashboard");
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("recordPrinterInkRefillAction error:", error);
    return { error: error?.message || "Failed to record ink refill." };
  }
}
