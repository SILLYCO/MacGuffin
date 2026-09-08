import React from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { PurchaseDetailView } from "@/components/purchases/PurchaseDetailView";

interface PurchasePageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseDetailPage({ params }: PurchasePageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const purchase = await db.purchase.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          components: {
            select: {
              id: true,
              type: true,
              brand: true,
              model: true,
              serialNumber: true,
              status: true,
              deviceId: true,
              device: {
                select: {
                  id: true,
                  brand: true,
                  model: true,
                  serialNumber: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!purchase) {
    notFound();
  }

  return (
    <AppShell user={session.user}>
      <PurchaseDetailView purchase={purchase} userRole={session.user.role} />
    </AppShell>
  );
}
