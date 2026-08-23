"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireITRole } from "@/lib/permissions";
import { DeviceStatus, AuditAction, AuditEntityType } from "@prisma/client";
import { logAuditAction } from "@/lib/audit";

export async function createDeviceAction(formData: FormData) {
  const user = await requireITRole();

  const brand = formData.get("brand") as string;
  const model = formData.get("model") as string;
  const cpu = formData.get("cpu") as string;
  const ram = formData.get("ram") as string;
  const storage = formData.get("storage") as string;
  const serialNumber = (formData.get("serialNumber") as string)?.trim();
  const purchaseDateStr = formData.get("purchaseDate") as string;
  const warrantyExpiryStr = formData.get("warrantyExpiry") as string;

  if (!brand || !model || !cpu || !ram || !storage || !serialNumber) {
    return { error: "Brand, model, CPU, RAM, storage, and serial number are required." };
  }

  // Check unique serial number
  const existing = await db.device.findUnique({
    where: { serialNumber },
  });

  if (existing) {
    return { error: `Device with serial number "${serialNumber}" already exists.` };
  }

  try {
    const purchaseDate = purchaseDateStr ? new Date(purchaseDateStr) : null;
    const warrantyExpiry = warrantyExpiryStr ? new Date(warrantyExpiryStr) : null;

    const device = await db.device.create({
      data: {
        brand,
        model,
        cpu,
        ram,
        storage,
        serialNumber,
        purchaseDate,
        warrantyExpiry,
        status: DeviceStatus.IN_STOCK,
      },
    });

    await logAuditAction({
      action: AuditAction.DEVICE_CREATED,
      entityType: AuditEntityType.DEVICE,
      entityId: device.id,
      entityName: `${brand} ${model} (${serialNumber})`,
      details: {
        brand,
        model,
        cpu,
        ram,
        storage,
        serialNumber,
        purchaseDate: purchaseDate?.toISOString() || null,
        warrantyExpiry: warrantyExpiry?.toISOString() || null,
        status: DeviceStatus.IN_STOCK,
      },
      actor: user,
    });

    revalidatePath("/devices");
    revalidatePath("/dashboard");
    revalidatePath("/audit-logs");
    return { success: true, deviceId: device.id };
  } catch (error: any) {
    console.error("createDeviceAction error:", error);
    return { error: error?.message || "Failed to create device." };
  }
}

export async function updateDeviceAction(deviceId: string, formData: FormData) {
  const user = await requireITRole();

  const brand = formData.get("brand") as string;
  const model = formData.get("model") as string;
  const cpu = formData.get("cpu") as string;
  const ram = formData.get("ram") as string;
  const storage = formData.get("storage") as string;
  const serialNumber = (formData.get("serialNumber") as string)?.trim();
  const purchaseDateStr = formData.get("purchaseDate") as string;
  const warrantyExpiryStr = formData.get("warrantyExpiry") as string;

  if (!brand || !model || !cpu || !ram || !storage || !serialNumber) {
    return { error: "Brand, model, CPU, RAM, storage, and serial number are required." };
  }

  const existingSerial = await db.device.findFirst({
    where: {
      serialNumber,
      NOT: { id: deviceId },
    },
  });

  if (existingSerial) {
    return { error: `Serial number "${serialNumber}" is already in use by another device.` };
  }

  try {
    const purchaseDate = purchaseDateStr ? new Date(purchaseDateStr) : null;
    const warrantyExpiry = warrantyExpiryStr ? new Date(warrantyExpiryStr) : null;

    const updated = await db.device.update({
      where: { id: deviceId },
      data: {
        brand,
        model,
        cpu,
        ram,
        storage,
        serialNumber,
        purchaseDate,
        warrantyExpiry,
      },
    });

    await logAuditAction({
      action: AuditAction.DEVICE_UPDATED,
      entityType: AuditEntityType.DEVICE,
      entityId: deviceId,
      entityName: `${brand} ${model} (${serialNumber})`,
      details: {
        brand,
        model,
        cpu,
        ram,
        storage,
        serialNumber,
        purchaseDate: purchaseDate?.toISOString() || null,
        warrantyExpiry: warrantyExpiry?.toISOString() || null,
      },
      actor: user,
    });

    revalidatePath("/devices");
    revalidatePath(`/devices/${deviceId}`);
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("updateDeviceAction error:", error);
    return { error: error?.message || "Failed to update device." };
  }
}

export async function updateDeviceStatusAction(deviceId: string, newStatus: DeviceStatus) {
  const user = await requireITRole();

  // Check if device currently has an active assignment
  const activeAssignment = await db.assignment.findFirst({
    where: { deviceId, unassignedAt: null },
  });

  if (activeAssignment && newStatus !== DeviceStatus.ASSIGNED) {
    return {
      error: "Cannot manually change status while device is assigned to an employee. Unassign the device first.",
    };
  }

  try {
    const prevDevice = await db.device.findUnique({
      where: { id: deviceId },
      select: { brand: true, model: true, serialNumber: true, status: true },
    });

    await db.device.update({
      where: { id: deviceId },
      data: { status: newStatus },
    });

    await logAuditAction({
      action: AuditAction.DEVICE_STATUS_CHANGED,
      entityType: AuditEntityType.DEVICE,
      entityId: deviceId,
      entityName: prevDevice ? `${prevDevice.brand} ${prevDevice.model} (${prevDevice.serialNumber})` : "Device",
      details: {
        fromStatus: prevDevice?.status,
        toStatus: newStatus,
      },
      actor: user,
    });

    revalidatePath("/devices");
    revalidatePath(`/devices/${deviceId}`);
    revalidatePath("/dashboard");
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("updateDeviceStatusAction error:", error);
    return { error: error?.message || "Failed to update device status." };
  }
}

export async function assignDeviceAction(deviceId: string, employeeId: string) {
  const user = await requireITRole();

  const now = new Date();

  try {
    let deviceName = "Device";
    let employeeName = "Employee";

    await db.$transaction(async (tx) => {
      const targetDevice = await tx.device.findUnique({ where: { id: deviceId } });
      const targetEmployee = await tx.employee.findUnique({ where: { id: employeeId } });

      if (targetDevice) deviceName = `${targetDevice.brand} ${targetDevice.model} (${targetDevice.serialNumber})`;
      if (targetEmployee) employeeName = `${targetEmployee.name} (${targetEmployee.department})`;

      // 1. Close out device's current active assignment if any
      const currentDeviceAssignment = await tx.assignment.findFirst({
        where: { deviceId, unassignedAt: null },
      });
      if (currentDeviceAssignment) {
        await tx.assignment.update({
          where: { id: currentDeviceAssignment.id },
          data: { unassignedAt: now },
        });
      }

      // 2. Close out employee's current active assignment if any (enforce at most 1 active assignment per employee)
      const currentEmployeeAssignment = await tx.assignment.findFirst({
        where: { employeeId, unassignedAt: null },
      });
      if (currentEmployeeAssignment) {
        await tx.assignment.update({
          where: { id: currentEmployeeAssignment.id },
          data: { unassignedAt: now },
        });
        // If the employee was assigned to a DIFFERENT device, mark that old device as IN_STOCK
        if (currentEmployeeAssignment.deviceId !== deviceId) {
          await tx.device.update({
            where: { id: currentEmployeeAssignment.deviceId },
            data: { status: DeviceStatus.IN_STOCK },
          });
        }
      }

      // 3. Create new assignment row
      await tx.assignment.create({
        data: {
          deviceId,
          employeeId,
          assignedAt: now,
        },
      });

      // 4. Automatically update device status to ASSIGNED
      await tx.device.update({
        where: { id: deviceId },
        data: { status: DeviceStatus.ASSIGNED },
      });

      // 5. Log audit action in transaction
      await logAuditAction({
        tx,
        action: AuditAction.DEVICE_ASSIGNED,
        entityType: AuditEntityType.ASSIGNMENT,
        entityId: deviceId,
        entityName: deviceName,
        details: {
          assignedToEmployee: employeeName,
          employeeId,
          deviceId,
        },
        actor: user,
      });
    });

    revalidatePath("/devices");
    revalidatePath(`/devices/${deviceId}`);
    revalidatePath("/employees");
    revalidatePath(`/employees/${employeeId}`);
    revalidatePath("/dashboard");
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("assignDeviceAction error:", error);
    return { error: error?.message || "Failed to assign device." };
  }
}

export async function unassignDeviceAction(deviceId: string) {
  const user = await requireITRole();

  const now = new Date();

  try {
    const activeAssignment = await db.assignment.findFirst({
      where: { deviceId, unassignedAt: null },
      include: { device: true, employee: true },
    });

    if (!activeAssignment) {
      return { error: "Device is not currently assigned to anyone." };
    }

    await db.$transaction(async (tx) => {
      // 1. Close assignment row
      await tx.assignment.update({
        where: { id: activeAssignment.id },
        data: { unassignedAt: now },
      });

      // 2. Update device status to IN_STOCK
      await tx.device.update({
        where: { id: deviceId },
        data: { status: DeviceStatus.IN_STOCK },
      });

      // 3. Log audit action
      await logAuditAction({
        tx,
        action: AuditAction.DEVICE_UNASSIGNED,
        entityType: AuditEntityType.ASSIGNMENT,
        entityId: deviceId,
        entityName: `${activeAssignment.device.brand} ${activeAssignment.device.model} (${activeAssignment.device.serialNumber})`,
        details: {
          unassignedFromEmployee: `${activeAssignment.employee.name} (${activeAssignment.employee.department})`,
          employeeId: activeAssignment.employeeId,
          deviceId,
        },
        actor: user,
      });
    });

    revalidatePath("/devices");
    revalidatePath(`/devices/${deviceId}`);
    revalidatePath("/employees");
    revalidatePath(`/employees/${activeAssignment.employeeId}`);
    revalidatePath("/dashboard");
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("unassignDeviceAction error:", error);
    return { error: error?.message || "Failed to unassign device." };
  }
}

export async function deleteDeviceAction(deviceId: string) {
  const user = await requireITRole();

  try {
    const device = await db.device.findUnique({
      where: { id: deviceId },
      select: { brand: true, model: true, serialNumber: true },
    });

    await db.device.delete({
      where: { id: deviceId },
    });

    await logAuditAction({
      action: AuditAction.DEVICE_DELETED,
      entityType: AuditEntityType.DEVICE,
      entityId: deviceId,
      entityName: device ? `${device.brand} ${device.model} (${device.serialNumber})` : "Device",
      details: {
        brand: device?.brand,
        model: device?.model,
        serialNumber: device?.serialNumber,
      },
      actor: user,
    });

    revalidatePath("/devices");
    revalidatePath("/dashboard");
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("deleteDeviceAction error:", error);
    return { error: error?.message || "Failed to delete device." };
  }
}
