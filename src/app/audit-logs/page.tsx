import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { AuditLogTable } from "@/components/audit/AuditLogTable";

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const formattedLogs = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    entityName: log.entityName,
    actorEmail: log.actorEmail,
    actorRole: log.actorRole,
    details: log.details,
    createdAt: log.createdAt,
  }));

  return (
    <AppShell user={session.user}>
      <AuditLogTable logs={formattedLogs} userRole={session.user.role} />
    </AppShell>
  );
}
