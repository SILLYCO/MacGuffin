import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { PrinterTable } from "@/components/printers/PrinterTable";

export default async function PrintersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const printers = await db.printer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      repairs: {
        orderBy: { reportedAt: "desc" },
        take: 1,
        select: {
          id: true,
          issueDescription: true,
          resolvedAt: true,
          reportedAt: true,
        },
      },
    },
  });

  return (
    <AppShell user={session.user}>
      <PrinterTable printers={printers} userRole={session.user.role} />
    </AppShell>
  );
}
