import { db } from "@/lib/db";
import { AuditAction, AuditEntityType, Role, Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/permissions";

export interface LogAuditOptions {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  entityName?: string | null;
  details?: Record<string, any> | null;
  actor?: {
    id?: string;
    email: string;
    role: Role;
  } | null;
  tx?: Prisma.TransactionClient;
}

export async function logAuditAction(options: LogAuditOptions) {
  try {
    const client = options.tx || db;
    let actor = options.actor;

    if (!actor) {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        actor = {
          id: currentUser.id,
          email: currentUser.email,
          role: currentUser.role as Role,
        };
      }
    }

    const actorEmail = actor?.email || "system@internal";
    const actorRole = actor?.role || Role.IT;
    const actorId = actor?.id && actor.id !== "system" ? actor.id : null;

    const log = await client.auditLog.create({
      data: {
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId || null,
        entityName: options.entityName || null,
        actorId,
        actorEmail,
        actorRole,
        details: options.details ? JSON.stringify(options.details) : null,
      },
    });

    return log;
  } catch (err) {
    console.error("Failed to write audit log:", err);
    return null;
  }
}
