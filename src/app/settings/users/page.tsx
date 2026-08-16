import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { UserTable } from "@/components/users/UserTable";

export default async function SettingsUsersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // IT-only route protection
  if (session.user.role !== "IT") {
    redirect("/dashboard");
  }

  const [users, employees] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    }),
    db.employee.findMany({
      orderBy: { name: "asc" },
      include: {
        user: {
          select: { id: true },
        },
      },
    }),
  ]);

  return (
    <AppShell user={session.user}>
      <UserTable
        users={users}
        employees={employees}
        currentUserId={session.user.id}
      />
    </AppShell>
  );
}
