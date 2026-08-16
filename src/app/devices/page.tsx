import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { DeviceTable } from "@/components/devices/DeviceTable";

export default async function DevicesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const devices = await db.device.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      assignments: {
        where: { unassignedAt: null },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
        },
      },
    },
  });

  const formattedDevices = devices.map((d) => ({
    id: d.id,
    brand: d.brand,
    model: d.model,
    cpu: d.cpu,
    ram: d.ram,
    storage: d.storage,
    serialNumber: d.serialNumber,
    status: d.status,
    currentAssignment: d.assignments[0]
      ? { employee: d.assignments[0].employee }
      : null,
  }));

  return (
    <AppShell user={session.user}>
      <DeviceTable devices={formattedDevices} userRole={session.user.role} />
    </AppShell>
  );
}
