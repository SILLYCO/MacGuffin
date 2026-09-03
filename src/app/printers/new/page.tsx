import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PrinterForm } from "@/components/printers/PrinterForm";

export default async function NewPrinterPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Server-side IT role restriction
  if (session.user.role !== "IT") {
    redirect("/printers");
  }

  return (
    <AppShell user={session.user}>
      <div className="space-y-6">
        <div className="text-center max-w-lg mx-auto">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Register New Network Printer
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Add a company printer with its network IP, MAC address, and ink tracking
          </p>
        </div>
        <PrinterForm />
      </div>
    </AppShell>
  );
}
