"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireITRole } from "@/lib/permissions";
import {
  ComponentType,
  ComponentStatus,
  ComponentTransferAction,
  AuditAction,
  AuditEntityType,
} from "@prisma/client";
import { logAuditAction } from "@/lib/audit";

/**
 * Register a new physical component into inventory stock (or directly mounted to a device).
 */
export async function createComponentAction(formData: FormData) {
  const user = await requireITRole();

  const type = formData.get("type") as ComponentType;
  const brand = (formData.get("brand") as string)?.trim();
  const model = (formData.get("model") as string)?.trim();
  const capacity = (formData.get("capacity") as string)?.trim() || null;
  const specs = (formData.get("specs") as string)?.trim() || null;
  const serialNumber = (formData.get("serialNumber") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;
  const targetDeviceId = (formData.get("deviceId") as string)?.trim() || null;

  if (!type || !brand) {
    return { error: "Component type and brand are required." };
  }

  if ((type === "RAM" || type.startsWith("STORAGE")) && !capacity) {
    return { error: "Capacity is required for RAM and Storage components (e.g. 16 GB, 512 GB)." };
  }

  const finalModel =
    model ||
    (type === "RAM"
      ? "Memory Module"
      : type === "STORAGE_SSD"
      ? "Solid State Drive"
      : type === "STORAGE_HDD"
      ? "Hard Disk Drive"
      : type === "GPU"
      ? "Graphics Card"
      : type === "CPU"
      ? "Processor"
      : type === "MOTHERBOARD"
      ? "Mainboard"
      : type === "POWER_SUPPLY"
      ? "Power Supply"
      : type === "NETWORK_CARD"
      ? "Network Adapter"
      : type === "PERIPHERAL_MOUSE"
      ? "Optical Mouse"
      : type === "PERIPHERAL_KEYBOARD"
      ? "Standard Keyboard"
      : type === "PERIPHERAL_MONITOR"
      ? "Display Monitor"
      : type === "CABLES_ADAPTERS"
      ? "Cable / Adapter"
      : "Standard Module");

  const prefixMap: Record<string, string> = {
    RAM: "RAM",
    STORAGE_SSD: "SSD",
    STORAGE_HDD: "HDD",
    GPU: "GPU",
    CPU: "CPU",
    MOTHERBOARD: "MOB",
    POWER_SUPPLY: "PSU",
    NETWORK_CARD: "NIC",
    PERIPHERAL_MOUSE: "MOU",
    PERIPHERAL_KEYBOARD: "KBD",
    PERIPHERAL_MONITOR: "MON",
    CABLES_ADAPTERS: "CBL",
  };
  const prefix = prefixMap[type] || "CMP";

  const finalSerial =
    serialNumber ||
    `GEN-${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

  // Check unique serial number
  const existing = await db.component.findUnique({
    where: { serialNumber: finalSerial },
  });

  if (existing) {
    return { error: `A component with serial number "${finalSerial}" already exists in inventory.` };
  }

  try {
    let initialStatus: ComponentStatus = ComponentStatus.IN_STOCK;
    let targetDevice = null;

    if (targetDeviceId) {
      targetDevice = await db.device.findUnique({
        where: { id: targetDeviceId },
        select: { id: true, brand: true, model: true, serialNumber: true },
      });
      if (targetDevice) {
        initialStatus = ComponentStatus.INSTALLED;
      }
    }

    const component = await db.component.create({
      data: {
        type,
        brand,
        model: finalModel,
        capacity,
        specs,
        serialNumber: finalSerial,
        notes,
        status: initialStatus,
        deviceId: targetDevice ? targetDevice.id : null,
      },
    });

    // If installed right away, record initial installation transfer
    if (targetDevice) {
      await db.componentTransfer.create({
        data: {
          componentId: component.id,
          fromDeviceId: null,
          fromDeviceName: "IT Storage Stock",
          toDeviceId: targetDevice.id,
          toDeviceName: `${targetDevice.brand} ${targetDevice.model}`,
          actionType: ComponentTransferAction.INSTALLED_FROM_STOCK,
          reason: "Initial component installation upon receipt",
          performedByEmail: user.email,
        },
      });
    }

    await logAuditAction({
      action: AuditAction.COMPONENT_CREATED,
      entityType: AuditEntityType.COMPONENT,
      entityId: component.id,
      entityName: `${brand} ${finalModel} (${finalSerial})`,
      details: {
        type,
        brand,
        model: finalModel,
        capacity,
        specs,
        serialNumber: finalSerial,
        status: initialStatus,
        mountedTo: targetDevice ? `${targetDevice.brand} ${targetDevice.model}` : "IT Storage Shelf",
      },
      actor: user,
    });

    revalidatePath("/components");
    revalidatePath("/devices");
    if (targetDeviceId) {
      revalidatePath(`/devices/${targetDeviceId}`);
    }
    revalidatePath("/dashboard");
    return { success: true, componentId: component.id };
  } catch (error: any) {
    console.error("createComponentAction error:", error);
    return { error: error?.message || "Failed to register component." };
  }
}

/**
 * Update component metadata (brand, model, capacity, specs, serial, notes).
 */
export async function updateComponentAction(componentId: string, formData: FormData) {
  const user = await requireITRole();

  const type = formData.get("type") as ComponentType;
  const brand = (formData.get("brand") as string)?.trim();
  const model = (formData.get("model") as string)?.trim();
  const capacity = (formData.get("capacity") as string)?.trim() || null;
  const specs = (formData.get("specs") as string)?.trim() || null;
  const serialNumber = (formData.get("serialNumber") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!type || !brand) {
    return { error: "Component type and brand are required." };
  }

  if ((type === "RAM" || type.startsWith("STORAGE")) && !capacity) {
    return { error: "Capacity is required for RAM and Storage components (e.g. 16 GB, 512 GB)." };
  }

  const existingComponent = await db.component.findUnique({
    where: { id: componentId },
  });
  if (!existingComponent) {
    return { error: "Component not found." };
  }

  const finalModel = model || existingComponent.model;
  const finalSerial = serialNumber || existingComponent.serialNumber;

  const existingSerial = await db.component.findFirst({
    where: {
      serialNumber: finalSerial,
      NOT: { id: componentId },
    },
  });

  if (existingSerial) {
    return { error: `Serial number "${finalSerial}" is already in use by another component.` };
  }

  try {
    const updated = await db.component.update({
      where: { id: componentId },
      data: {
        type,
        brand,
        model: finalModel,
        capacity,
        specs,
        serialNumber: finalSerial,
        notes,
      },
    });

    await logAuditAction({
      action: AuditAction.COMPONENT_UPDATED,
      entityType: AuditEntityType.COMPONENT,
      entityId: componentId,
      entityName: `${brand} ${finalModel} (${finalSerial})`,
      details: {
        type,
        brand,
        model: finalModel,
        capacity,
        specs,
        serialNumber: finalSerial,
      },
      actor: user,
    });

    revalidatePath("/components");
    if (updated.deviceId) {
      revalidatePath(`/devices/${updated.deviceId}`);
    }
    return { success: true };
  } catch (error: any) {
    console.error("updateComponentAction error:", error);
    return { error: error?.message || "Failed to update component." };
  }
}

/**
 * Delete a component from inventory.
 */
export async function deleteComponentAction(componentId: string) {
  const user = await requireITRole();

  const component = await db.component.findUnique({
    where: { id: componentId },
  });

  if (!component) {
    return { error: "Component not found." };
  }

  try {
    const deviceId = component.deviceId;

    await db.component.delete({
      where: { id: componentId },
    });

    await logAuditAction({
      action: AuditAction.COMPONENT_DELETED,
      entityType: AuditEntityType.COMPONENT,
      entityId: componentId,
      entityName: `${component.brand} ${component.model} (${component.serialNumber})`,
      details: {
        type: component.type,
        serialNumber: component.serialNumber,
        wasInstalledInDeviceId: deviceId,
      },
      actor: {
        id: user.id,
        email: user.email,
        role: user.role as any,
      },
    });

    revalidatePath("/components");
    revalidatePath(`/components/${componentId}`);
    if (deviceId) {
      revalidatePath(`/devices/${deviceId}`);
    }
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("deleteComponentAction error:", error);
    return { error: error?.message || "Failed to delete component." };
  }
}

/**
 * Mount / Install an in-stock component into a specific PC / Device.
 */
export async function installComponentAction(componentId: string, deviceId: string, reason?: string) {
  const user = await requireITRole();

  const component = await db.component.findUnique({
    where: { id: componentId },
  });

  if (!component) {
    return { error: "Component not found." };
  }

  if (component.status === ComponentStatus.INSTALLED) {
    return { error: "Component is already installed in a machine. Detach it first." };
  }

  const device = await db.device.findUnique({
    where: { id: deviceId },
    select: { id: true, brand: true, model: true, serialNumber: true },
  });

  if (!device) {
    return { error: "Target computer device not found." };
  }

  try {
    // 1. Update component record
    await db.component.update({
      where: { id: componentId },
      data: {
        deviceId: device.id,
        status: ComponentStatus.INSTALLED,
      },
    });

    // 2. Create immutable transfer audit record
    await db.componentTransfer.create({
      data: {
        componentId: component.id,
        fromDeviceId: null,
        fromDeviceName: "IT Storage Stock",
        toDeviceId: device.id,
        toDeviceName: `${device.brand} ${device.model} (${device.serialNumber})`,
        actionType: ComponentTransferAction.INSTALLED_FROM_STOCK,
        reason: reason?.trim() || "Installed into device from spare inventory",
        performedByEmail: user.email,
      },
    });

    // 3. System audit log
    await logAuditAction({
      action: AuditAction.COMPONENT_INSTALLED,
      entityType: AuditEntityType.COMPONENT,
      entityId: component.id,
      entityName: `${component.brand} ${component.model} (${component.serialNumber})`,
      details: {
        action: "INSTALLED_FROM_STOCK",
        installedIntoDevice: `${device.brand} ${device.model}`,
        deviceId: device.id,
        reason: reason || null,
      },
      actor: user,
    });

    revalidatePath("/components");
    revalidatePath(`/devices/${deviceId}`);
    revalidatePath("/devices");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("installComponentAction error:", error);
    return { error: error?.message || "Failed to install component." };
  }
}

/**
 * Detach a component from a computer back to IT Stock Shelf or quarantine as Defective.
 */
export async function detachComponentAction(
  componentId: string,
  targetStatus: "IN_STOCK" | "DEFECTIVE",
  reason?: string
) {
  const user = await requireITRole();

  const component = await db.component.findUnique({
    where: { id: componentId },
    include: { device: true },
  });

  if (!component) {
    return { error: "Component not found." };
  }

  const currentDevice = component.device;
  const currentDeviceId = component.deviceId;

  try {
    const nextStatus =
      targetStatus === "DEFECTIVE" ? ComponentStatus.DEFECTIVE : ComponentStatus.IN_STOCK;

    const actionType =
      targetStatus === "DEFECTIVE"
        ? ComponentTransferAction.MARKED_DEFECTIVE
        : ComponentTransferAction.DETACHED_TO_STOCK;

    // 1. Clear device link and set new status
    await db.component.update({
      where: { id: componentId },
      data: {
        deviceId: null,
        status: nextStatus,
      },
    });

    // 2. Create transfer record
    await db.componentTransfer.create({
      data: {
        componentId: component.id,
        fromDeviceId: currentDeviceId,
        fromDeviceName: currentDevice
          ? `${currentDevice.brand} ${currentDevice.model} (${currentDevice.serialNumber})`
          : "Computer Device",
        toDeviceId: null,
        toDeviceName: targetStatus === "DEFECTIVE" ? "Quarantine / Repair" : "IT Storage Stock",
        actionType,
        reason: reason?.trim() || (targetStatus === "DEFECTIVE" ? "Removed due to hardware defect" : "Detached back to IT stock closet"),
        performedByEmail: user.email,
      },
    });

    // 3. System audit log
    await logAuditAction({
      action: AuditAction.COMPONENT_DETACHED,
      entityType: AuditEntityType.COMPONENT,
      entityId: component.id,
      entityName: `${component.brand} ${component.model} (${component.serialNumber})`,
      details: {
        action: actionType,
        detachedFrom: currentDevice ? `${currentDevice.brand} ${currentDevice.model}` : "Unknown",
        newStatus: nextStatus,
        reason: reason || null,
      },
      actor: user,
    });

    revalidatePath("/components");
    if (currentDeviceId) {
      revalidatePath(`/devices/${currentDeviceId}`);
    }
    revalidatePath("/devices");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("detachComponentAction error:", error);
    return { error: error?.message || "Failed to detach component." };
  }
}

/**
 * Hot-swap / transfer a component directly from Device A to Device B.
 */
export async function transferComponentAction(
  componentId: string,
  targetDeviceId: string,
  reason?: string
) {
  const user = await requireITRole();

  const component = await db.component.findUnique({
    where: { id: componentId },
    include: { device: true },
  });

  if (!component) {
    return { error: "Component not found." };
  }

  const currentDevice = component.device;
  const currentDeviceId = component.deviceId;

  const targetDevice = await db.device.findUnique({
    where: { id: targetDeviceId },
    select: { id: true, brand: true, model: true, serialNumber: true },
  });

  if (!targetDevice) {
    return { error: "Target computer device not found." };
  }

  if (currentDeviceId === targetDeviceId) {
    return { error: "Component is already mounted in this device." };
  }

  try {
    // 1. Mount to target device
    await db.component.update({
      where: { id: componentId },
      data: {
        deviceId: targetDevice.id,
        status: ComponentStatus.INSTALLED,
      },
    });

    // 2. Transfer log
    await db.componentTransfer.create({
      data: {
        componentId: component.id,
        fromDeviceId: currentDeviceId,
        fromDeviceName: currentDevice
          ? `${currentDevice.brand} ${currentDevice.model} (${currentDevice.serialNumber})`
          : "IT Storage Stock",
        toDeviceId: targetDevice.id,
        toDeviceName: `${targetDevice.brand} ${targetDevice.model} (${targetDevice.serialNumber})`,
        actionType: ComponentTransferAction.TRANSFERRED_BETWEEN_DEVICES,
        reason: reason?.trim() || `Transferred directly to ${targetDevice.brand} ${targetDevice.model}`,
        performedByEmail: user.email,
      },
    });

    // 3. System audit log
    await logAuditAction({
      action: AuditAction.COMPONENT_TRANSFERRED,
      entityType: AuditEntityType.COMPONENT,
      entityId: component.id,
      entityName: `${component.brand} ${component.model} (${component.serialNumber})`,
      details: {
        from: currentDevice ? `${currentDevice.brand} ${currentDevice.model}` : "IT Stock",
        to: `${targetDevice.brand} ${targetDevice.model}`,
        reason: reason || null,
      },
      actor: user,
    });

    revalidatePath("/components");
    if (currentDeviceId) {
      revalidatePath(`/devices/${currentDeviceId}`);
    }
    revalidatePath(`/devices/${targetDeviceId}`);
    revalidatePath("/devices");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("transferComponentAction error:", error);
    return { error: error?.message || "Failed to transfer component." };
  }
}
