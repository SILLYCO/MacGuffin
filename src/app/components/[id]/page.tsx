import React from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { ComponentDetailView } from "@/components/components/ComponentDetailView";

interface ComponentPageProps {
  params: Promise<{ id: string }>;
}

export default async function ComponentDetailPage({ params }: ComponentPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const [component, devices] = await Promise.all([
    db.component.findUnique({
      where: { id },
      include: {
        device: {
          select: {
            id: true,
            brand: true,
            model: true,
            serialNumber: true,
            deviceType: true,
            cpu: true,
            ram: true,
            storage: true,
            status: true,
            components: {
              select: {
                id: true,
                type: true,
                brand: true,
                model: true,
                capacity: true,
                specs: true,
              },
            },
            assignments: {
              where: { unassignedAt: null },
              select: {
                assignedAt: true,
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
        },
        purchaseItem: {
          select: {
            id: true,
            name: true,
            unitPrice: true,
            quantity: true,
            totalPrice: true,
            purchase: {
              select: {
                id: true,
                title: true,
                vendor: true,
                invoiceNumber: true,
                purchaseDate: true,
              },
            },
          },
        },
        transfers: {
          orderBy: { transferredAt: "desc" },
        },
      },
    }),
    db.device.findMany({
      where: {
        status: { not: "RETIRED" },
      },
      select: {
        id: true,
        brand: true,
        model: true,
        serialNumber: true,
        deviceType: true,
      },
      orderBy: { brand: "asc" },
    }),
  ]);

  if (!component) {
    notFound();
  }

  return (
    <AppShell user={session.user}>
      <ComponentDetailView
        component={component}
        devices={devices}
        userRole={session.user.role}
      />
    </AppShell>
  );
}
