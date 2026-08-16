import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeeForm } from "@/components/employees/EmployeeForm";

export default async function NewEmployeePage() {
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
      <EmployeeForm />
    </AppShell>
  );
}
