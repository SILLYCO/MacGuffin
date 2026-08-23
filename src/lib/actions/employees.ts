"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireITRole } from "@/lib/permissions";
import { DeviceStatus, AuditAction, AuditEntityType } from "@prisma/client";
import { logAuditAction } from "@/lib/audit";

export async function createEmployeeAction(formData: FormData) {
  const user = await requireITRole();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const department = (formData.get("department") as string)?.trim();

  if (!name || !email || !department) {
    return { error: "Name, email, and department are required." };
  }

  const existing = await db.employee.findUnique({
    where: { email },
  });

  if (existing) {
    return { error: `Employee with email "${email}" already exists.` };
  }

  try {
    const employee = await db.employee.create({
      data: { name, email, department },
    });

    await logAuditAction({
      action: AuditAction.EMPLOYEE_CREATED,
      entityType: AuditEntityType.EMPLOYEE,
      entityId: employee.id,
      entityName: `${name} (${department})`,
      details: {
        name,
        email,
        department,
      },
      actor: user,
    });

    revalidatePath("/employees");
    revalidatePath("/dashboard");
    revalidatePath("/audit-logs");
    return { success: true, employeeId: employee.id };
  } catch (error: any) {
    console.error("createEmployeeAction error:", error);
    return { error: error?.message || "Failed to create employee." };
  }
}

export async function updateEmployeeAction(employeeId: string, formData: FormData) {
  const user = await requireITRole();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const department = (formData.get("department") as string)?.trim();

  if (!name || !email || !department) {
    return { error: "Name, email, and department are required." };
  }

  const existingEmail = await db.employee.findFirst({
    where: {
      email,
      NOT: { id: employeeId },
    },
  });

  if (existingEmail) {
    return { error: `Email "${email}" is already used by another employee.` };
  }

  try {
    await db.employee.update({
      where: { id: employeeId },
      data: { name, email, department },
    });

    await logAuditAction({
      action: AuditAction.EMPLOYEE_UPDATED,
      entityType: AuditEntityType.EMPLOYEE,
      entityId: employeeId,
      entityName: `${name} (${department})`,
      details: {
        name,
        email,
        department,
      },
      actor: user,
    });

    revalidatePath("/employees");
    revalidatePath(`/employees/${employeeId}`);
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("updateEmployeeAction error:", error);
    return { error: error?.message || "Failed to update employee." };
  }
}

export async function deleteEmployeeAction(employeeId: string) {
  const user = await requireITRole();

  try {
    let empName = "Employee";

    await db.$transaction(async (tx) => {
      const emp = await tx.employee.findUnique({ where: { id: employeeId } });
      if (emp) empName = `${emp.name} (${emp.department})`;

      // Find active device assignment for this employee if any
      const activeAssignment = await tx.assignment.findFirst({
        where: { employeeId, unassignedAt: null },
      });

      if (activeAssignment) {
        // Set unassignedAt and reset device status to IN_STOCK
        await tx.assignment.update({
          where: { id: activeAssignment.id },
          data: { unassignedAt: new Date() },
        });

        await tx.device.update({
          where: { id: activeAssignment.deviceId },
          data: { status: DeviceStatus.IN_STOCK },
        });
      }

      await tx.employee.delete({
        where: { id: employeeId },
      });

      await logAuditAction({
        tx,
        action: AuditAction.EMPLOYEE_DELETED,
        entityType: AuditEntityType.EMPLOYEE,
        entityId: employeeId,
        entityName: empName,
        details: {
          employeeId,
          hadActiveAssignment: !!activeAssignment,
        },
        actor: user,
      });
    });

    revalidatePath("/employees");
    revalidatePath("/devices");
    revalidatePath("/dashboard");
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("deleteEmployeeAction error:", error);
    return { error: error?.message || "Failed to delete employee." };
  }
}
