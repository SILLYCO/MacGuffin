"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireITRole } from "@/lib/permissions";
import {
  NetworkDeviceType,
  NetworkDeviceStatus,
  CableType,
  ConnectionSpeed,
  AuditAction,
  AuditEntityType,
} from "@prisma/client";
import { logAuditAction } from "@/lib/audit";
import type { PatchPortInput } from "@/types/network";

/**
 * Register a new network hardware device (Router, Switch, AP, etc.)
 */
export async function createNetworkDeviceAction(formData: FormData) {
  const user = await requireITRole();

  const name = (formData.get("name") as string)?.trim();
  const deviceType = (formData.get("deviceType") as NetworkDeviceType) || NetworkDeviceType.SWITCH;
  const brand = (formData.get("brand") as string)?.trim();
  const model = (formData.get("model") as string)?.trim();
  const totalPorts = parseInt((formData.get("totalPorts") as string) || "24", 10);
  const ipAddress = (formData.get("ipAddress") as string)?.trim() || null;
  const macAddress = (formData.get("macAddress") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const status = (formData.get("status") as NetworkDeviceStatus) || NetworkDeviceStatus.ONLINE;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name || !brand || !model) {
    return { error: "Device name, brand, and model are required." };
  }

  if (isNaN(totalPorts) || totalPorts < 1 || totalPorts > 96) {
    return { error: "Total ports must be a valid number between 1 and 96." };
  }

  try {
    const device = await db.networkDevice.create({
      data: {
        name,
        deviceType,
        brand,
        model,
        totalPorts,
        ipAddress,
        macAddress,
        location,
        status,
        notes,
      },
    });

    await logAuditAction({
      action: AuditAction.NETWORK_DEVICE_CREATED,
      entityType: AuditEntityType.NETWORK_DEVICE,
      entityId: device.id,
      entityName: device.name,
      details: {
        deviceType: device.deviceType,
        brand: device.brand,
        model: device.model,
        totalPorts: device.totalPorts,
        ipAddress: device.ipAddress,
        location: device.location,
      },
      actor: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    revalidatePath("/network");
    return { success: true, deviceId: device.id };
  } catch (error) {
    console.error("Error creating network device:", error);
    return { error: "Failed to create network device." };
  }
}

/**
 * Update an existing network device
 */
export async function updateNetworkDeviceAction(id: string, formData: FormData) {
  const user = await requireITRole();

  const name = (formData.get("name") as string)?.trim();
  const deviceType = (formData.get("deviceType") as NetworkDeviceType) || NetworkDeviceType.SWITCH;
  const brand = (formData.get("brand") as string)?.trim();
  const model = (formData.get("model") as string)?.trim();
  const totalPorts = parseInt((formData.get("totalPorts") as string) || "24", 10);
  const ipAddress = (formData.get("ipAddress") as string)?.trim() || null;
  const macAddress = (formData.get("macAddress") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const status = (formData.get("status") as NetworkDeviceStatus) || NetworkDeviceStatus.ONLINE;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name || !brand || !model) {
    return { error: "Device name, brand, and model are required." };
  }

  try {
    const existing = await db.networkDevice.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Network device not found." };
    }

    const updated = await db.networkDevice.update({
      where: { id },
      data: {
        name,
        deviceType,
        brand,
        model,
        totalPorts,
        ipAddress,
        macAddress,
        location,
        status,
        notes,
      },
    });

    await logAuditAction({
      action: AuditAction.NETWORK_DEVICE_UPDATED,
      entityType: AuditEntityType.NETWORK_DEVICE,
      entityId: updated.id,
      entityName: updated.name,
      details: {
        changes: {
          name: name !== existing.name ? { from: existing.name, to: name } : undefined,
          status: status !== existing.status ? { from: existing.status, to: status } : undefined,
          ipAddress: ipAddress !== existing.ipAddress ? { from: existing.ipAddress, to: ipAddress } : undefined,
          location: location !== existing.location ? { from: existing.location, to: location } : undefined,
        },
      },
      actor: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    revalidatePath("/network");
    return { success: true };
  } catch (error) {
    console.error("Error updating network device:", error);
    return { error: "Failed to update network device." };
  }
}

/**
 * Delete a network device
 */
export async function deleteNetworkDeviceAction(id: string) {
  const user = await requireITRole();

  try {
    const existing = await db.networkDevice.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Network device not found." };
    }

    // 1. Unlink incoming connections targeting this device from other switches
    await db.networkConnection.updateMany({
      where: { targetNetworkDeviceId: id },
      data: { targetNetworkDeviceId: null, targetNetworkPort: null },
    });

    // 2. Delete all outgoing port connections from this device
    await db.networkConnection.deleteMany({
      where: { fromDeviceId: id },
    });

    // 3. Delete the device record
    await db.networkDevice.delete({ where: { id } });

    await logAuditAction({
      action: AuditAction.NETWORK_DEVICE_DELETED,
      entityType: AuditEntityType.NETWORK_DEVICE,
      entityId: id,
      entityName: existing.name,
      details: {
        deviceType: existing.deviceType,
        brand: existing.brand,
        model: existing.model,
      },
      actor: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    revalidatePath("/network");
    return { success: true };
  } catch (error) {
    console.error("Error deleting network device:", error);
    return { error: "Failed to delete network device." };
  }
}

/**
 * Patch / wire an Ethernet or Fiber cable into a switch or router port
 */
export async function patchNetworkPortAction(input: PatchPortInput) {
  const user = await requireITRole();

  if (!input.fromDeviceId || !input.fromPort) {
    return { error: "Source network device and port number are required." };
  }

  // Validate target based on targetType
  let targetNetworkDeviceId: string | null = null;
  let targetNetworkPort: number | null = null;
  let targetDeviceId: string | null = null;
  let targetPrinterId: string | null = null;
  let endpointName: string | null = null;
  let endpointType: string | null = null;

  if (input.targetType === "NETWORK_DEVICE") {
    if (!input.targetNetworkDeviceId) {
      return { error: "Please select the target switch or router for this uplink." };
    }
    if (input.targetNetworkDeviceId === input.fromDeviceId) {
      return { error: "Cannot connect a device to itself." };
    }
    targetNetworkDeviceId = input.targetNetworkDeviceId;
    targetNetworkPort = input.targetNetworkPort || null;
  } else if (input.targetType === "COMPUTER") {
    if (!input.targetDeviceId) {
      return { error: "Please select an inventory computer or server." };
    }
    targetDeviceId = input.targetDeviceId;
  } else if (input.targetType === "PRINTER") {
    if (!input.targetPrinterId) {
      return { error: "Please select a network printer." };
    }
    targetPrinterId = input.targetPrinterId;
  } else {
    // Custom endpoint / Wall Jack
    if (!input.endpointName?.trim()) {
      return { error: "Please provide an endpoint label (e.g. Wall Jack 3B, Meeting Room TV)." };
    }
    endpointName = input.endpointName.trim();
    endpointType = input.endpointType || "WALL_JACK";
  }

  try {
    const fromDev = await db.networkDevice.findUnique({
      where: { id: input.fromDeviceId },
    });

    if (!fromDev) {
      return { error: "Origin network switch/router not found." };
    }

    if (input.fromPort < 1 || input.fromPort > fromDev.totalPorts) {
      return { error: `Port ${input.fromPort} exceeds device maximum of ${fromDev.totalPorts} ports.` };
    }

    // Check if the source port on this device already has an incoming trunk cable plugged in
    const existingIncoming = await db.networkConnection.findFirst({
      where: {
        targetNetworkDeviceId: input.fromDeviceId,
        targetNetworkPort: input.fromPort,
      },
      include: { fromDevice: true },
    });

    if (existingIncoming) {
      return {
        error: `Port ${input.fromPort} already has an incoming trunk cable plugged in from ${existingIncoming.fromDevice.name} (Port ${existingIncoming.fromPort}). Unplug that cable first before patching an outgoing connection on this port.`,
      };
    }

    // If connecting to another switch port, validate target port availability
    if (targetNetworkDeviceId && targetNetworkPort) {
      const destOutgoing = await db.networkConnection.findUnique({
        where: {
          fromDeviceId_fromPort: {
            fromDeviceId: targetNetworkDeviceId,
            fromPort: targetNetworkPort,
          },
        },
        include: { fromDevice: true },
      });

      if (destOutgoing) {
        return {
          error: `Port ${targetNetworkPort} on target device ${destOutgoing.fromDevice.name} is already plugged into another connection.`,
        };
      }

      const destIncoming = await db.networkConnection.findFirst({
        where: {
          targetNetworkDeviceId,
          targetNetworkPort,
          NOT: {
            fromDeviceId: input.fromDeviceId,
            fromPort: input.fromPort,
          },
        },
        include: { fromDevice: true },
      });

      if (destIncoming) {
        return {
          error: `Port ${targetNetworkPort} on target device already has an incoming cable plugged in from ${destIncoming.fromDevice.name} (Port ${destIncoming.fromPort}).`,
        };
      }
    }

    // Upsert connection on this port
    const connection = await db.networkConnection.upsert({
      where: {
        fromDeviceId_fromPort: {
          fromDeviceId: input.fromDeviceId,
          fromPort: input.fromPort,
        },
      },
      create: {
        fromDeviceId: input.fromDeviceId,
        fromPort: input.fromPort,
        fromPortLabel: input.fromPortLabel || `Port ${input.fromPort}`,
        targetNetworkDeviceId,
        targetNetworkPort,
        targetDeviceId,
        targetPrinterId,
        endpointName,
        endpointType,
        cableType: input.cableType || CableType.CAT6,
        cableColor: input.cableColor || null,
        speed: input.speed || ConnectionSpeed.SPEED_1_GBPS,
        vlan: input.vlan || null,
        wallOutlet: input.wallOutlet || null,
        notes: input.notes || null,
      },
      update: {
        fromPortLabel: input.fromPortLabel || `Port ${input.fromPort}`,
        targetNetworkDeviceId,
        targetNetworkPort,
        targetDeviceId,
        targetPrinterId,
        endpointName,
        endpointType,
        cableType: input.cableType || CableType.CAT6,
        cableColor: input.cableColor || null,
        speed: input.speed || ConnectionSpeed.SPEED_1_GBPS,
        vlan: input.vlan || null,
        wallOutlet: input.wallOutlet || null,
        notes: input.notes || null,
      },
    });

    await logAuditAction({
      action: AuditAction.NETWORK_PORT_PATCHED,
      entityType: AuditEntityType.NETWORK_CONNECTION,
      entityId: connection.id,
      entityName: `${fromDev.name} - Port ${input.fromPort}`,
      details: {
        switchName: fromDev.name,
        port: input.fromPort,
        targetType: input.targetType,
        cableType: input.cableType,
        vlan: input.vlan,
        speed: input.speed,
      },
      actor: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    revalidatePath("/network");
    if (targetDeviceId) revalidatePath(`/devices/${targetDeviceId}`);
    if (targetPrinterId) revalidatePath(`/printers/${targetPrinterId}`);

    return { success: true, connectionId: connection.id };
  } catch (error) {
    console.error("Error patching port:", error);
    return { error: "Failed to patch network port." };
  }
}

/**
 * Unpatch / unplug a cable from a switch port
 */
export async function unpatchNetworkPortAction(connectionId: string) {
  const user = await requireITRole();

  try {
    const existing = await db.networkConnection.findUnique({
      where: { id: connectionId },
      include: { fromDevice: true },
    });

    if (!existing) {
      return { error: "Port connection not found." };
    }

    await db.networkConnection.delete({ where: { id: connectionId } });

    await logAuditAction({
      action: AuditAction.NETWORK_PORT_UNPATCHED,
      entityType: AuditEntityType.NETWORK_CONNECTION,
      entityId: connectionId,
      entityName: `${existing.fromDevice.name} - Port ${existing.fromPort}`,
      details: {
        switchName: existing.fromDevice.name,
        port: existing.fromPort,
      },
      actor: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    revalidatePath("/network");
    if (existing.targetDeviceId) revalidatePath(`/devices/${existing.targetDeviceId}`);
    if (existing.targetPrinterId) revalidatePath(`/printers/${existing.targetPrinterId}`);

    return { success: true };
  } catch (error) {
    console.error("Error unpatching port:", error);
    return { error: "Failed to unpatch port." };
  }
}
