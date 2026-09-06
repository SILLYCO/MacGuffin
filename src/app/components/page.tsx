import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { ComponentTable } from "@/components/components/ComponentTable";

export default async function ComponentsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [components, devices] = await Promise.all([
    db.component.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        device: {
          select: {
            id: true,
            brand: true,
            model: true,
            serialNumber: true,
            deviceType: true,
          },
        },
        transfers: {
          orderBy: { transferredAt: "desc" },
        },
      },
    }),
    db.device.findMany({
      where: {
        status: { not: "RETIRED" },
      },
      select: {
        id: true,
        brand: true,
        model: true,
        serialNumber: true,
        deviceType: true,
      },
      orderBy: { brand: "asc" },
    }),
  ]);

  return (
    <AppShell user={session.user}>
      <ComponentTable
        components={components as any}
        devices={devices as any}
        userRole={session.user.role}
      />
    </AppShell>
  );
}
