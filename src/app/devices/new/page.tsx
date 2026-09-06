import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { DeviceForm } from "@/components/devices/DeviceForm";

export default async function NewDevicePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Server-side IT role restriction
  if (session.user.role !== "IT") {
    redirect("/dashboard");
  }

  const [employees, inStockComponents] = await Promise.all([
    db.employee.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
      },
    }),
    db.component.findMany({
      where: { status: "IN_STOCK" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        brand: true,
        model: true,
        capacity: true,
        specs: true,
        serialNumber: true,
        status: true,
      },
    }),
  ]);

  return (
    <AppShell user={session.user}>
      <DeviceForm
        employees={employees}
        inStockComponents={inStockComponents as any}
      />
    </AppShell>
  );
}
