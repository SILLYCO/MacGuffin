import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PurchaseForm } from "@/components/purchases/PurchaseForm";

export default async function NewPurchasePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "IT") {
    redirect("/purchases");
  }

  return (
    <AppShell user={session.user}>
      <PurchaseForm />
    </AppShell>
  );
}
