import React from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { DeviceForm } from "@/components/devices/DeviceForm";

interface EditDevicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDevicePage({ params }: EditDevicePageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Server-side IT role restriction
  if (session.user.role !== "IT") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const device = await db.device.findUnique({
    where: { id },
  });

  if (!device) {
    notFound();
  }

  return (
    <AppShell user={session.user}>
      <DeviceForm
        initialData={{
          id: device.id,
          brand: device.brand,
          model: device.model,
          cpu: device.cpu,
          ram: device.ram,
          storage: device.storage,
          serialNumber: device.serialNumber,
          purchaseDate: device.purchaseDate,
          warrantyExpiry: device.warrantyExpiry,
        }}
      />
    </AppShell>
  );
}
