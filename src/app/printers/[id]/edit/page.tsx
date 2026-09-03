import React from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { PrinterForm } from "@/components/printers/PrinterForm";

interface EditPrinterPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPrinterPage({ params }: EditPrinterPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Server-side IT role restriction
  if (session.user.role !== "IT") {
    redirect("/printers");
  }

  const { id } = await params;

  const printer = await db.printer.findUnique({
    where: { id },
  });

  if (!printer) {
    notFound();
  }

  return (
    <AppShell user={session.user}>
      <div className="space-y-6">
        <div className="text-center max-w-lg mx-auto">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Edit Printer Specifications
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Update model, IP address, MAC address, and office location
          </p>
        </div>
        <PrinterForm
          initialData={{
            id: printer.id,
            brand: printer.brand,
            model: printer.model,
            ipAddress: printer.ipAddress,
            macAddress: printer.macAddress,
            location: printer.location,
            status: printer.status,
            isColor: printer.isColor,
            canScan: printer.canScan,
            canCopy: printer.canCopy,
            isDuplex: printer.isDuplex,
            connectionType: printer.connectionType,
            driverUrl: printer.driverUrl,
            lastInkRefillDate: printer.lastInkRefillDate,
            lastInkRefillNotes: printer.lastInkRefillNotes,
          }}
          isEdit={true}
        />
      </div>
    </AppShell>
  );
}
