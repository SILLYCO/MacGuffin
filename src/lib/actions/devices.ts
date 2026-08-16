"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireITRole } from "@/lib/permissions";
import { DeviceStatus } from "@prisma/client";

export async function createDeviceAction(formData: FormData) {
  await requireITRole();

  const brand = formData.get("brand") as string;
  const model = formData.get("model") as string;
  const cpu = formData.get("cpu") as string;
  const ram = formData.get("ram") as string;
  const storage = formData.get("storage") as string;
  const serialNumber = (formData.get("serialNumber") as string)?.trim();
  const purchaseDateStr = formData.get("purchaseDate") as string;
  const warrantyExpiryStr = formData.get("warrantyExpiry") as string;

  if (!brand || !model || !cpu || !ram || !storage || !serialNumber || !purchaseDateStr || !warrantyExpiryStr) {
    return { error: "All device specification fields are required." };
  }

  // Check unique serial number
  const existing = await db.device.findUnique({
    where: { serialNumber },
  });

  if (existing) {
    return { error: `Device with serial number "${serialNumber}" already exists.` };
  }

  try {
    const device = await db.device.create({
      data: {
        brand,
        model,
        cpu,
        ram,
        storage,
        serialNumber,
        purchaseDate: new Date(purchaseDateStr),
        warrantyExpiry: new Date(warrantyExpiryStr),
        status: DeviceStatus.IN_STOCK,
      },
    });

    revalidatePath("/devices");
    revalidatePath("/dashboard");
    return { success: true, deviceId: device.id };
  } catch (error: any) {
    console.error("createDeviceAction error:", error);
    return { error: error?.message || "Failed to create device." };
  }
}

export async function updateDeviceAction(deviceId: string, formData: FormData) {
  await requireITRole();

  const brand = formData.get("brand") as string;
  const model = formData.get("model") as string;
  const cpu = formData.get("cpu") as string;
  const ram = formData.get("ram") as string;
  const storage = formData.get("storage") as string;
  const serialNumber = (formData.get("serialNumber") as string)?.trim();
  const purchaseDateStr = formData.get("purchaseDate") as string;
  const warrantyExpiryStr = formData.get("warrantyExpiry") as string;

  if (!brand || !model || !cpu || !ram || !storage || !serialNumber || !purchaseDateStr || !warrantyExpiryStr) {
    return { error: "All device specification fields are required." };
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
    await db.device.update({
      where: { id: deviceId },
      data: {
        brand,
        model,
        cpu,
        ram,
        storage,
        serialNumber,
        purchaseDate: new Date(purchaseDateStr),
        warrantyExpiry: new Date(warrantyExpiryStr),
      },
    });

    revalidatePath("/devices");
    revalidatePath(`/devices/${deviceId}`);
    return { success: true };
  } catch (error: any) {
    console.error("updateDeviceAction error:", error);
    return { error: error?.message || "Failed to update device." };
  }
}

export async function updateDeviceStatusAction(deviceId: string, newStatus: DeviceStatus) {
  await requireITRole();

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
    await db.device.update({
      where: { id: deviceId },
      data: { status: newStatus },
    });

    revalidatePath("/devices");
    revalidatePath(`/devices/${deviceId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("updateDeviceStatusAction error:", error);
    return { error: error?.message || "Failed to update device status." };
  }
}

export async function assignDeviceAction(deviceId: string, employeeId: string) {
  await requireITRole();

  const now = new Date();

  try {
    await db.$transaction(async (tx) => {
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
    });

    revalidatePath("/devices");
    revalidatePath(`/devices/${deviceId}`);
    revalidatePath("/employees");
    revalidatePath(`/employees/${employeeId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("assignDeviceAction error:", error);
    return { error: error?.message || "Failed to assign device." };
  }
}

export async function unassignDeviceAction(deviceId: string) {
  await requireITRole();

  const now = new Date();

  try {
    const activeAssignment = await db.assignment.findFirst({
      where: { deviceId, unassignedAt: null },
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
    });

    revalidatePath("/devices");
    revalidatePath(`/devices/${deviceId}`);
    revalidatePath("/employees");
    revalidatePath(`/employees/${activeAssignment.employeeId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("unassignDeviceAction error:", error);
    return { error: error?.message || "Failed to unassign device." };
  }
}

export async function deleteDeviceAction(deviceId: string) {
  await requireITRole();

  try {
    await db.device.delete({
      where: { id: deviceId },
    });

    revalidatePath("/devices");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("deleteDeviceAction error:", error);
    return { error: error?.message || "Failed to delete device." };
  }
}
