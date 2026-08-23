import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Laptop,
  Users,
  CheckCircle2,
  UserCheck,
  Wrench,
  Archive,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { DeviceStatus } from "@prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch summary counts with efficient aggregation
  const [deviceStats, totalEmployees, recentDevices] = await Promise.all([
    db.device.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    db.employee.count(),
    db.device.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        assignments: {
          where: { unassignedAt: null },
          include: { employee: true },
        },
      },
    }),
  ]);

  const statusCounts: Record<DeviceStatus, number> = {
    IN_STOCK: 0,
    ASSIGNED: 0,
    IN_REPAIR: 0,
    RETIRED: 0,
  };

  let totalDevices = 0;
  for (const stat of deviceStats) {
    statusCounts[stat.status] = stat._count.status;
    totalDevices += stat._count.status;
  }

  const inStockCount = statusCounts.IN_STOCK;
  const assignedCount = statusCounts.ASSIGNED;
  const inRepairCount = statusCounts.IN_REPAIR;
  const retiredCount = statusCounts.RETIRED;

  const assignedPercentage = totalDevices > 0 ? Math.round((assignedCount / totalDevices) * 100) : 0;
  const inStockPercentage = totalDevices > 0 ? Math.round((inStockCount / totalDevices) * 100) : 0;

  return (
    <AppShell user={session.user}>
      <div className="space-y-8 pb-8">
        {/* Banner / Welcome Header */}
        <div className="relative overflow-hidden glass-card p-8 border-primary/30 bg-gradient-to-r from-card via-card to-primary/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                IT Asset Command Center
              </div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                Hardware Inventory Overview
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Real-time metrics, device allocation rates, and lifecycle status across all company laptops and employees.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {session.user.role === "IT" ? (
                <Link
                  href="/devices/new"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105 transition-all"
                >
                  <Laptop className="w-4 h-4" />
                  + Register Device
                </Link>
              ) : (
                <div className="px-4 py-2.5 rounded-xl bg-muted/60 border border-border text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Read-Only Manager View</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Total Devices */}
          <Link href="/devices" className="glass-card-interactive p-5 space-y-3 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Total Devices
              </span>
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Laptop className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight">{totalDevices}</div>
              <p className="text-[11px] font-semibold text-muted-foreground mt-1 flex items-center gap-1">
                Hardware fleet <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </Link>

          {/* Assigned Devices */}
          <Link href="/devices?status=ASSIGNED" className="glass-card-interactive p-5 space-y-3 border-blue-500/30 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
                Assigned
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm glow-pill-blue">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight">{assignedCount}</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${assignedPercentage}%` }} />
              </div>
              <p className="text-[11px] font-semibold text-blue-400/80 mt-1.5">{assignedPercentage}% active deployment</p>
            </div>
          </Link>

          {/* In Stock Devices */}
          <Link href="/devices?status=IN_STOCK" className="glass-card-interactive p-5 space-y-3 border-emerald-500/30 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                In Stock
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm glow-pill-emerald">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight">{inStockCount}</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${inStockPercentage}%` }} />
              </div>
              <p className="text-[11px] font-semibold text-emerald-400/80 mt-1.5">{inStockCount} ready for assignment</p>
            </div>
          </Link>

          {/* In Repair Devices */}
          <Link href="/devices?status=IN_REPAIR" className="glass-card-interactive p-5 space-y-3 border-amber-500/30 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                In Repair
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm glow-pill-amber">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight">{inRepairCount}</div>
              <p className="text-[11px] font-semibold text-amber-400/80 mt-1">Under IT maintenance</p>
            </div>
          </Link>

          {/* Retired Devices */}
          <Link href="/devices?status=RETIRED" className="glass-card-interactive p-5 space-y-3 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                Retired
              </span>
              <div className="w-9 h-9 rounded-xl bg-zinc-500/10 text-zinc-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Archive className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight">{retiredCount}</div>
              <p className="text-[11px] font-semibold text-zinc-400 mt-1">Decommissioned</p>
            </div>
          </Link>

          {/* Total Employees */}
          <Link href="/employees" className="glass-card-interactive p-5 space-y-3 border-purple-500/30 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-400">
                Employees
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm glow-pill-purple">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight">{totalEmployees}</div>
              <p className="text-[11px] font-semibold text-purple-400/80 mt-1 flex items-center gap-1">
                Staff directory <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </Link>
        </div>

        {/* Inventory Stream Cards Grid */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Hardware Stream
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Latest laptops added to company inventory and their active assignments
              </p>
            </div>
            <Link
              href="/devices"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20"
            >
              <span>View Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentDevices.map((device) => {
              const activeEmp = device.assignments[0]?.employee;
              return (
                <div
                  key={device.id}
                  className="p-5 rounded-2xl bg-card/60 border border-border/70 hover:border-primary/40 hover:bg-card/90 transition-all space-y-4 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <Link
                          href={`/devices/${device.id}`}
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors block leading-tight"
                        >
                          {device.brand} {device.model}
                        </Link>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {device.serialNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground p-2.5 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                    <div className="flex justify-between">
                      <span>CPU:</span>
                      <strong className="text-foreground">{device.cpu}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>RAM / Storage:</span>
                      <strong className="text-foreground">{device.ram} • {device.storage}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                    <StatusBadge status={device.status} />

                    {activeEmp ? (
                      <Link
                        href={`/employees/${activeEmp.id}`}
                        className="font-bold text-primary hover:underline"
                      >
                        {activeEmp.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground italic text-[11px]">Unassigned</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
