"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireITRole } from "@/lib/permissions";
import { Role, AuditAction, AuditEntityType } from "@prisma/client";
import { logAuditAction } from "@/lib/audit";

export async function createUserAction(formData: FormData) {
  const currentUser = await requireITRole();

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const role = formData.get("role") as Role;
  const employeeIdStr = (formData.get("employeeId") as string)?.trim();
  const employeeId = employeeIdStr && employeeIdStr !== "none" ? employeeIdStr : null;

  if (!email || !password || !role) {
    return { error: "Email, password, and role are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  if (![Role.IT, Role.MANAGER].includes(role)) {
    return { error: "Invalid role specified." };
  }

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: `User with email "${email}" already exists.` };
  }

  if (employeeId) {
    const existingEmployeeLink = await db.user.findUnique({
      where: { employeeId },
    });

    if (existingEmployeeLink) {
      return { error: "Selected employee is already linked to another user account." };
    }
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        email,
        passwordHash,
        role,
        employeeId,
      },
      include: {
        employee: true,
      },
    });

    await logAuditAction({
      action: AuditAction.USER_CREATED,
      entityType: AuditEntityType.USER,
      entityId: newUser.id,
      entityName: `${email} (${role})`,
      details: {
        email,
        role,
        linkedEmployee: newUser.employee ? `${newUser.employee.name} (${newUser.employee.department})` : null,
      },
      actor: currentUser,
    });

    revalidatePath("/settings/users");
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("createUserAction error:", error);
    return { error: error?.message || "Failed to create user account." };
  }
}

export async function updateUserRoleAction(userId: string, newRole: Role) {
  const currentUser = await requireITRole();

  if (![Role.IT, Role.MANAGER].includes(newRole)) {
    return { error: "Invalid role specified." };
  }

  try {
    const prevUser = await db.user.findUnique({ where: { id: userId } });

    await db.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    await logAuditAction({
      action: AuditAction.USER_ROLE_UPDATED,
      entityType: AuditEntityType.USER,
      entityId: userId,
      entityName: prevUser?.email || "User",
      details: {
        fromRole: prevUser?.role,
        toRole: newRole,
      },
      actor: currentUser,
    });

    revalidatePath("/settings/users");
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("updateUserRoleAction error:", error);
    return { error: error?.message || "Failed to update user role." };
  }
}

export async function deleteUserAction(userId: string) {
  const currentUser = await requireITRole();

  if (currentUser.id === userId) {
    return { error: "You cannot delete your own active user account." };
  }

  try {
    const userToDelete = await db.user.findUnique({ where: { id: userId } });

    await db.user.delete({
      where: { id: userId },
    });

    await logAuditAction({
      action: AuditAction.USER_DELETED,
      entityType: AuditEntityType.USER,
      entityId: userId,
      entityName: userToDelete?.email || "User",
      details: {
        email: userToDelete?.email,
        role: userToDelete?.role,
      },
      actor: currentUser,
    });

    revalidatePath("/settings/users");
    revalidatePath("/audit-logs");
    return { success: true };
  } catch (error: any) {
    console.error("deleteUserAction error:", error);
    return { error: error?.message || "Failed to delete user account." };
  }
}
