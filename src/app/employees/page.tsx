import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeeTable } from "@/components/employees/EmployeeTable";

export default async function EmployeesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const employees = await db.employee.findMany({
    orderBy: { name: "asc" },
    include: {
      assignments: {
        where: { unassignedAt: null },
        include: {
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
  });

  const formattedEmployees = employees.map((emp) => ({
    id: emp.id,
    name: emp.name,
    email: emp.email,
    department: emp.department,
    currentAssignment: emp.assignments[0]
      ? { device: emp.assignments[0].device }
      : null,
  }));

  return (
    <AppShell user={session.user}>
      <EmployeeTable employees={formattedEmployees} userRole={session.user.role} />
    </AppShell>
  );
}
