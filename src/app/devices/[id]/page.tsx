import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DeviceDetailActions } from "./DeviceDetailActions";
import {
  Laptop,
  ArrowLeft,
  Calendar,
  Cpu,
  HardDrive,
  User,
  History,
  ShieldAlert,
} from "lucide-react";

interface DeviceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DeviceDetailPage({ params }: DeviceDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const device = await db.device.findUnique({
    where: { id },
    include: {
      assignments: {
        orderBy: { assignedAt: "desc" },
        include: {
          employee: true,
        },
      },
    },
  });

  if (!device) {
    notFound();
  }

  // Active assignment
  const activeAssignment = device.assignments.find((a) => a.unassignedAt === null);

  // All employees for IT reassign modal
  const allEmployees = session.user.role === "IT"
    ? await db.employee.findMany({
        orderBy: { name: "asc" },
        include: {
          assignments: {
            where: { unassignedAt: null },
            include: { device: true },
          },
        },
      })
    : [];

  const formattedEmployees = allEmployees.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    department: e.department,
    currentAssignment: e.assignments[0]
      ? { device: e.assignments[0].device }
      : null,
  }));

  const isIT = session.user.role === "IT";

  return (
    <AppShell user={session.user}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/devices"
              className="p-2 rounded-lg bg-card border border-border hover:bg-muted text-muted-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {device.brand} {device.model}
                </h1>
                <StatusBadge status={device.status} />
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                Serial Number: {device.serialNumber}
              </p>
            </div>
          </div>

          {/* IT Actions (Edit, Reassign, Status, Unassign) */}
          <DeviceDetailActions
            deviceId={device.id}
            deviceTitle={`${device.brand} ${device.model}`}
            currentStatus={device.status}
            hasActiveAssignment={!!activeAssignment}
            activeEmployeeId={activeAssignment?.employeeId || null}
            employees={formattedEmployees}
            userRole={session.user.role}
          />
        </div>

        {/* Specs & Current Assignment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Assignment Status Box */}
          <div className="md:col-span-1 glass-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Current Status & User
              </h2>

              {activeAssignment ? (
                <div className="space-y-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-400">
                      Assigned To
                    </span>
                    <Link
                      href={`/employees/${activeAssignment.employee.id}`}
                      className="block font-bold text-foreground hover:text-primary transition-colors text-base"
                    >
                      {activeAssignment.employee.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {activeAssignment.employee.email}
                    </div>
                    <div className="text-xs font-medium text-blue-400 mt-1">
                      {activeAssignment.employee.department}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-500/20 text-xs text-muted-foreground">
                    Assigned on:{" "}
                    <strong className="text-foreground">
                      {new Date(activeAssignment.assignedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-muted/40 border border-border text-center space-y-1">
                  <div className="text-sm font-semibold text-foreground">Unassigned</div>
                  <p className="text-xs text-muted-foreground">
                    This laptop is currently in inventory and available for assignment.
                  </p>
                </div>
              )}
            </div>

            {!isIT && (
              <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/20 border border-border/60 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Read-Only View (Manager Role)</span>
              </div>
            )}
          </div>

          {/* Hardware Specs Card */}
          <div className="md:col-span-2 glass-card p-6 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              Hardware Specifications
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="block text-[11px] font-semibold text-muted-foreground uppercase">
                  Processor (CPU)
                </span>
                <span className="font-semibold text-foreground text-sm">{device.cpu}</span>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="block text-[11px] font-semibold text-muted-foreground uppercase">
                  Memory (RAM)
                </span>
                <span className="font-semibold text-foreground text-sm">{device.ram}</span>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="block text-[11px] font-semibold text-muted-foreground uppercase">
                  Storage
                </span>
                <span className="font-semibold text-foreground text-sm">{device.storage}</span>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="block text-[11px] font-semibold text-muted-foreground uppercase">
                  Brand & Model
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {device.brand} {device.model}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="block text-[11px] font-semibold text-muted-foreground uppercase">
                  Purchase Date
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {new Date(device.purchaseDate).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="block text-[11px] font-semibold text-muted-foreground uppercase">
                  Warranty Expiration
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {new Date(device.warrantyExpiry).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment History Log Section */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Assignment History Audit Log
            </h2>
            <span className="text-xs text-muted-foreground">
              Append-only historical records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/60 uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Assigned Date</th>
                  <th className="px-4 py-3">Unassigned Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {device.assignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground italic">
                      No past assignment records found.
                    </td>
                  </tr>
                ) : (
                  device.assignments.map((assignment) => {
                    const isActive = assignment.unassignedAt === null;
                    return (
                      <tr key={assignment.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-semibold text-foreground">
                          <Link
                            href={`/employees/${assignment.employee.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {assignment.employee.name}
                          </Link>
                          <span className="block text-[11px] font-normal text-muted-foreground">
                            {assignment.employee.email}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {assignment.employee.department}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {new Date(assignment.assignedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {assignment.unassignedAt
                            ? new Date(assignment.unassignedAt).toLocaleDateString(
                                undefined,
                                { year: "numeric", month: "short", day: "numeric" }
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {isActive ? (
                            <span className="inline-flex px-2 py-0.5 font-semibold text-[10px] rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Active Assignment
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 font-medium text-[10px] rounded-full bg-muted text-muted-foreground border border-border">
                              Closed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
