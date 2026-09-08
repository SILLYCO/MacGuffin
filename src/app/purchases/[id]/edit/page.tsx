import React from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { PurchaseForm } from "@/components/purchases/PurchaseForm";

interface EditPurchasePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPurchasePage({ params }: EditPurchasePageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "IT") {
    redirect("/purchases");
  }

  const { id } = await params;

  const purchase = await db.purchase.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!purchase) {
    notFound();
  }

  const formattedPurchase = {
    id: purchase.id,
    title: purchase.title,
    vendor: purchase.vendor,
    invoiceNumber: purchase.invoiceNumber,
    purchaseDate: purchase.purchaseDate,
    notes: purchase.notes,
    items: purchase.items.map((it) => ({
      id: it.id,
      name: it.name,
      category: it.category,
      unitPrice: it.unitPrice.toString(),
      quantity: it.quantity.toString(),
      isTracked: it.isTracked,
      autoStock: it.autoStocked,
      notes: it.notes || "",
    })),
  };

  return (
    <AppShell user={session.user}>
      <PurchaseForm initialPurchase={formattedPurchase} />
    </AppShell>
  );
}
