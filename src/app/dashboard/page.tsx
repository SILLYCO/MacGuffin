import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Laptop,
  Monitor,
  Server,
  Printer,
  Cpu,
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
  Receipt,
} from "lucide-react";
import { DeviceStatus, DeviceType, PrinterStatus, ComponentStatus } from "@prisma/client";
import { formatEGP } from "@/lib/constants";
import { computeDeviceLiveSpecs } from "@/lib/hardware";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch summary counts with efficient aggregation
  const [deviceStats, deviceTypeStats, printerStats, componentStats, totalEmployees, purchaseStats, recentDevices] = await Promise.all([
    db.device.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    db.device.groupBy({
      by: ["deviceType"],
      _count: { deviceType: true },
    }),
    db.printer.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    db.component.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    db.employee.count(),
    db.purchase.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    db.device.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        assignments: {
          where: { unassignedAt: null },
          include: { employee: true },
        },
        components: {
          select: { id: true, type: true, brand: true, model: true, capacity: true, specs: true },
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

  let laptopCount = 0;
  let desktopCount = 0;
  for (const stat of deviceTypeStats) {
    if (stat.deviceType === DeviceType.LAPTOP) laptopCount += stat._count.deviceType;
    else desktopCount += stat._count.deviceType;
  }

  let workingPrinters = 0;
  let inRepairPrinters = 0;
  let totalPrinters = 0;
  for (const stat of printerStats) {
    if (stat.status === PrinterStatus.WORKING) workingPrinters = stat._count.status;
    if (stat.status === PrinterStatus.IN_REPAIR) inRepairPrinters = stat._count.status;
    totalPrinters += stat._count.status;
  }

  let inStockComponents = 0;
  let installedComponents = 0;
  let totalComponents = 0;
  for (const stat of componentStats) {
    if (stat.status === ComponentStatus.IN_STOCK) inStockComponents = stat._count.status;
    if (stat.status === ComponentStatus.INSTALLED) installedComponents = stat._count.status;
    totalComponents += stat._count.status;
  }

  const totalPurchaseSpend = purchaseStats._sum.totalAmount ?? 0;
  const totalPurchasesCount = purchaseStats._count.id ?? 0;

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
                Real-time metrics, device allocation rates, and lifecycle status across all company laptops, desktop PCs, components, and employees.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {session.user.role === "IT" ? (
                <>
                  <Link
                    href="/devices/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105 transition-all"
                  >
                    <Laptop className="w-4 h-4" />
                    + Register Device
                  </Link>
                  <Link
                    href="/purchases/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground font-bold text-sm shadow-sm hover:bg-muted transition-all"
                  >
                    <Receipt className="w-4 h-4 text-emerald-500" />
                    + Record Purchase
                  </Link>
                  <Link
                    href="/components"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground font-bold text-sm shadow-sm hover:bg-muted transition-all"
                  >
                    <Cpu className="w-4 h-4 text-purple-500" />
                    + Stock Component
                  </Link>
                  <Link
                    href="/printers/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground font-bold text-sm shadow-sm hover:bg-muted transition-all"
                  >
                    <Printer className="w-4 h-4 text-primary" />
                    + Register Printer
                  </Link>
                </>
              ) : (
                <div className="px-4 py-2.5 rounded-xl bg-muted/60 border border-border text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Read-Only Manager View</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metric Cards Grid - Organized in 2 Clean Rows */}
        <div className="space-y-4">
          {/* Row 1: Core Computers Fleet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Computers */}
            <Link href="/devices" className="glass-card-interactive p-5 space-y-3 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  Total Computers
                </span>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Laptop className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">{totalDevices}</div>
                <p className="text-[11px] font-semibold text-muted-foreground mt-1 flex items-center gap-1">
                  {laptopCount} Laptops • {desktopCount} Desktops
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
                  In Stock Computers
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
                <p className="text-[11px] font-semibold text-emerald-400/80 mt-1.5">{inStockCount} ready for deployment</p>
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
          </div>

          {/* Row 2: Components, Purchases & Infrastructure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Spare Hardware Components */}
            <Link href="/components" className="glass-card-interactive p-5 space-y-3 border-purple-500/30 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-400">
                  Spare Components Stock
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm glow-pill-purple">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">{inStockComponents}</div>
                <p className="text-[11px] font-semibold text-purple-400/80 mt-1 flex items-center gap-1">
                  Ready on shelf • {installedComponents} mounted in PCs
                </p>
              </div>
            </Link>

            {/* Network Printers */}
            <Link href="/printers" className="glass-card-interactive p-5 space-y-3 border-sky-500/30 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-400">
                  Network Printers
                </span>
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm glow-pill-blue">
                  <Printer className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">{totalPrinters}</div>
                <p className="text-[11px] font-semibold text-sky-400/80 mt-1 flex items-center gap-1">
                  {workingPrinters} working • {inRepairPrinters} in repair
                </p>
              </div>
            </Link>

            {/* IT Purchases & Expenses */}
            <Link href="/purchases" className="glass-card-interactive p-5 space-y-3 border-emerald-500/30 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  IT Purchases & Expenses
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm glow-pill-emerald">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground tracking-tight truncate">
                  {formatEGP(totalPurchaseSpend)}
                </div>
                <p className="text-[11px] font-semibold text-emerald-400/80 mt-1 flex items-center gap-1">
                  {totalPurchasesCount} orders recorded
                </p>
              </div>
            </Link>

            {/* Total Employees */}
            <Link href="/employees" className="glass-card-interactive p-5 space-y-3 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  Staff Directory
                </span>
                <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">{totalEmployees}</div>
                <p className="text-[11px] font-semibold text-muted-foreground mt-1 flex items-center gap-1">
                  Company personnel <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </p>
              </div>
            </Link>
          </div>
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
                Latest computers & hardware added to company inventory and their active assignments
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
              const isDesktop = device.deviceType === DeviceType.DESKTOP_PC;
              const isWorkstation = device.deviceType === DeviceType.WORKSTATION || device.deviceType === DeviceType.SERVER;
              const liveSpecs = computeDeviceLiveSpecs(device);

              const hasRam = liveSpecs.ramSummary && liveSpecs.ramSummary !== "Modular / None";
              const hasStorage = liveSpecs.storageSummary && liveSpecs.storageSummary !== "Modular / None";

              return (
                <div
                  key={device.id}
                  className="p-5 rounded-2xl bg-card/60 border border-border/70 hover:border-primary/40 hover:bg-card/90 transition-all space-y-4 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isDesktop
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            : isWorkstation
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {isDesktop ? (
                          <Monitor className="w-5 h-5" />
                        ) : isWorkstation ? (
                          <Server className="w-5 h-5" />
                        ) : (
                          <Laptop className="w-5 h-5" />
                        )}
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
                      <strong className="text-foreground">{device.cpu || "N/A"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>RAM / Storage:</span>
                      <strong className="text-foreground">
                        {hasRam && hasStorage ? (
                          <span>
                            {liveSpecs.ramSummary} <span className="text-muted-foreground/60 font-normal mx-0.5">•</span> {liveSpecs.storageSummary}
                          </span>
                        ) : hasRam ? (
                          <span>{liveSpecs.ramSummary}</span>
                        ) : hasStorage ? (
                          <span>{liveSpecs.storageSummary}</span>
                        ) : (
                          <span className="text-muted-foreground font-normal italic">Modular / None</span>
                        )}
                      </strong>
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
