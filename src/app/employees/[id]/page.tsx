import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmployeeDetailActions } from "./EmployeeDetailActions";
import {
  User,
  ArrowLeft,
  Mail,
  Building,
  Laptop,
  Monitor,
  History,
  ShieldAlert,
  Layers,
} from "lucide-react";
import { COMPONENT_TYPES } from "@/lib/constants";
import { computeDeviceLiveSpecs } from "@/lib/hardware";
import { ComponentIconBadge } from "@/components/ui/ComponentIcon";

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      user: true,
      assignments: {
        orderBy: { assignedAt: "desc" },
        include: {
          device: {
            include: {
              components: {
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
    },
  });

  if (!employee) {
    notFound();
  }

  const activeAssignment = employee.assignments.find((a) => a.unassignedAt === null);
  const liveSpecs = activeAssignment ? computeDeviceLiveSpecs(activeAssignment.device) : null;

  return (
    <AppShell user={session.user}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header & Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/employees"
              className="p-2 rounded-lg bg-card border border-border hover:bg-muted text-muted-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{employee.name}</h1>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                {employee.email}
              </p>
            </div>
          </div>

          <EmployeeDetailActions
            employeeId={employee.id}
            employeeName={employee.name}
            userRole={session.user.role}
          />
        </div>

        {/* Profile Info & Current Device Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Employee Details Card */}
          <div className="md:col-span-1 glass-card p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Employee Profile
            </h2>

            <div className="space-y-3 text-sm">
              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="block text-[11px] font-semibold text-muted-foreground uppercase mb-0.5">
                  Department
                </span>
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-primary" />
                  {employee.department}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60">
                <span className="block text-[11px] font-semibold text-muted-foreground uppercase mb-0.5">
                  Linked User Login Account
                </span>
                <span className="font-semibold text-foreground text-xs">
                  {employee.user ? (
                    <span className="text-purple-400 font-mono">{employee.user.email} ({employee.user.role})</span>
                  ) : (
                    <span className="text-muted-foreground italic font-normal">None (Passive Record)</span>
                  )}
                </span>
              </div>
            </div>

            {session.user.role !== "IT" && (
              <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/20 border border-border/60 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Read-Only View (Manager Role)</span>
              </div>
            )}
          </div>

          {/* Currently Assigned Laptop */}
          <div className="md:col-span-2 glass-card p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Laptop className="w-4 h-4 text-primary" />
              Currently Assigned Device
            </h2>

            {activeAssignment ? (
              <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-400">
                      Active Laptop
                    </span>
                    <Link
                      href={`/devices/${activeAssignment.device.id}`}
                      className="block font-bold text-foreground text-lg hover:text-primary transition-colors"
                    >
                      {activeAssignment.device.brand} {activeAssignment.device.model}
                    </Link>
                    <div className="text-xs font-mono text-muted-foreground mt-0.5">
                      Serial: {activeAssignment.device.serialNumber}
                    </div>
                  </div>

                  <StatusBadge status={activeAssignment.device.status} />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-blue-500/20 text-xs">
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">CPU</span>
                    <span className="font-medium text-foreground">{activeAssignment.device.cpu}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">RAM</span>
                    <span className="font-medium text-foreground">
                      {liveSpecs?.ramSummary || activeAssignment.device.ram}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Storage</span>
                    <span className="font-medium text-foreground">
                      {liveSpecs?.storageSummary || activeAssignment.device.storage}
                    </span>
                  </div>
                </div>

                {/* Installed Modular Components in Employee Custody */}
                {activeAssignment.device.components && activeAssignment.device.components.length > 0 && (
                  <div className="pt-3 border-t border-blue-500/20 space-y-2">
                    <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      Hardware Parts in Employee's Possession ({activeAssignment.device.components.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeAssignment.device.components.map((part) => {
                        const typeDef = COMPONENT_TYPES[part.type as keyof typeof COMPONENT_TYPES] || COMPONENT_TYPES.OTHER;
                        return (
                          <div
                            key={part.id}
                            className="p-2.5 rounded-lg bg-background/80 border border-border/80 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ComponentIconBadge type={part.type} size="xs" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold border ${typeDef.badge}`}>
                                    {typeDef.shortLabel}
                                  </span>
                                  <span className="font-bold text-foreground text-xs truncate">
                                    {part.brand} {part.model}
                                  </span>
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  {part.capacity ? `${part.capacity} • ` : ""}{part.specs || ""}
                                </div>
                              </div>
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/60 shrink-0">
                              {part.serialNumber}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2">
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
              <div className="p-8 rounded-xl bg-muted/30 border border-border text-center space-y-2">
                <Laptop className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
                <div className="text-sm font-semibold text-foreground">No Currently Assigned Laptop</div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  This employee does not currently have an active company laptop.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Device Assignment History Log Section */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Employee Device History Log
            </h2>
            <span className="text-xs text-muted-foreground">Historical records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/60 uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Serial Number</th>
                  <th className="px-4 py-3">Assigned Date</th>
                  <th className="px-4 py-3">Unassigned Date</th>
                  <th className="px-4 py-3">Assignment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {employee.assignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground italic">
                      No device assignment history on record.
                    </td>
                  </tr>
                ) : (
                  employee.assignments.map((assignment) => {
                    const isActive = assignment.unassignedAt === null;
                    return (
                      <tr key={assignment.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-semibold text-foreground">
                          <Link
                            href={`/devices/${assignment.device.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {assignment.device.brand} {assignment.device.model}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {assignment.device.serialNumber}
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
                            ? new Date(assignment.unassignedAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {isActive ? (
                            <span className="inline-flex px-2 py-0.5 font-semibold text-[10px] rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 font-medium text-[10px] rounded-full bg-muted text-muted-foreground border border-border">
                              Unassigned (Past)
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
