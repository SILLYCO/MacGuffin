import React from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeeForm } from "@/components/employees/EmployeeForm";

interface EditEmployeePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Server-side IT role restriction
  if (session.user.role !== "IT") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const employee = await db.employee.findUnique({
    where: { id },
  });

  if (!employee) {
    notFound();
  }

  return (
    <AppShell user={session.user}>
      <EmployeeForm
        initialData={{
          id: employee.id,
          name: employee.name,
          email: employee.email,
          department: employee.department,
        }}
      />
    </AppShell>
  );
}
