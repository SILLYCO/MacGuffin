import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
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

  return (
    <AppShell user={session.user}>
      <DeviceForm />
    </AppShell>
  );
}
