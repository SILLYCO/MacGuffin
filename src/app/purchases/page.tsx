import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { PurchaseTable } from "@/components/purchases/PurchaseTable";

export default async function PurchasesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const purchases = await db.purchase.findMany({
    orderBy: { purchaseDate: "desc" },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return (
    <AppShell user={session.user}>
      <PurchaseTable purchases={purchases} userRole={session.user.role} />
    </AppShell>
  );
}
