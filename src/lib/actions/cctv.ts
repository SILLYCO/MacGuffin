"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireITRole } from "@/lib/permissions";
import { logAuditAction } from "@/lib/audit";
import { AuditAction, AuditEntityType, Role } from "@prisma/client";
import { testDvrConnectivity } from "@/lib/cctv/dvr-client";

export async function updateCameraChannelAction(data: {
  id: string;
  name: string;
  location?: string | null;
  transcodeSub?: boolean;
  enabled?: boolean;
  notes?: string | null;
}) {
  const user = await requireITRole();

  if (!data.id || !data.name?.trim()) {
    return { error: "Channel ID and valid channel name are required." };
  }

  try {
    const existing = await db.cameraChannel.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return { error: "Camera channel not found." };
    }

    const updated = await db.cameraChannel.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        location: data.location?.trim() || null,
        transcodeSub: data.transcodeSub ?? existing.transcodeSub,
        enabled: data.enabled ?? existing.enabled,
        notes: data.notes?.trim() || null,
      },
    });

    await logAuditAction({
      action: AuditAction.CCTV_CONFIG_UPDATED,
      entityType: AuditEntityType.CCTV_CAMERA,
      entityId: updated.id,
      entityName: updated.name,
      details: {
        channelNumber: updated.channelNumber,
        previous: {
          name: existing.name,
          location: existing.location,
          transcodeSub: existing.transcodeSub,
          enabled: existing.enabled,
        },
        updated: {
          name: updated.name,
          location: updated.location,
          transcodeSub: updated.transcodeSub,
          enabled: updated.enabled,
        },
      },
      actor: {
        id: user.id,
        email: user.email,
        role: user.role as Role,
      },
    });

    revalidatePath("/cctv");
    return { success: true, channel: updated };
  } catch (error: any) {
    console.error("Failed to update camera channel:", error);
    return { error: error.message || "Failed to update camera channel." };
  }
}

export async function toggleChannelEnabledAction(channelId: string, enabled: boolean) {
  const user = await requireITRole();

  try {
    const channel = await db.cameraChannel.update({
      where: { id: channelId },
      data: { enabled },
    });

    await logAuditAction({
      action: AuditAction.CCTV_CONFIG_UPDATED,
      entityType: AuditEntityType.CCTV_CAMERA,
      entityId: channel.id,
      entityName: channel.name,
      details: {
        channelNumber: channel.channelNumber,
        enabled,
      },
      actor: {
        id: user.id,
        email: user.email,
        role: user.role as Role,
      },
    });

    revalidatePath("/cctv");
    return { success: true, enabled: channel.enabled };
  } catch (error: any) {
    return { error: error.message || "Failed to toggle channel status." };
  }
}

export async function testDvrConnectionAction() {
  await requireITRole();
  try {
    const result = await testDvrConnectivity();
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, online: false, message: error.message || "Connection check failed" };
  }
}
