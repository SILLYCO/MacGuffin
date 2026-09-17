import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PrinterDetailActions } from "./PrinterDetailActions";
import {
  ArrowLeft,
  Printer,
  Network,
  Droplets,
  Wrench,
  Copy,
  ExternalLink,
  MapPin,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  User,
  Palette,
  Scan,
  Sparkles,
  Layers,
  Wifi,
  Cable,
  Globe,
  Usb,
  Download,
  Link2,
} from "lucide-react";
import { PRINTER_CONNECTION_TYPES } from "@/lib/constants";
import { PrinterStatus } from "@prisma/client";

interface PrinterDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrinterDetailPage({ params }: PrinterDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const printer = await db.printer.findUnique({
    where: { id },
    include: {
      repairs: {
        orderBy: { reportedAt: "desc" },
      },
      inkRefills: {
        orderBy: { refillDate: "desc" },
      },
      networkConnections: {
        include: {
          fromDevice: true,
        },
      },
    },
  });

  if (!printer) {
    notFound();
  }

  const activeRepair = printer.repairs.find((r) => r.resolvedAt === null);

  const getDaysAgo = (dateStr?: Date | string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const inkDaysAgo = getDaysAgo(printer.lastInkRefillDate);

  return (
    <AppShell user={session.user}>
      <div className="space-y-8 pb-12 max-w-5xl mx-auto">
        {/* Back navigation */}
        <div>
          <Link
            href="/printers"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Printers Directory
          </Link>
        </div>

        {/* Top Header Card */}
        <div className="glass-card p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 border-primary/20">
          <div className="flex items-start md:items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary flex items-center justify-center font-bold shrink-0 shadow-inner border border-primary/20">
              <Printer className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {printer.brand} {printer.model}
                </h1>
                <StatusBadge status={printer.status} />
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Brand: {printer.brand}</span>
                {printer.location && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    • <MapPin className="w-3.5 h-3.5 text-primary" /> {printer.location}
                  </span>
                )}
                <span>• Added on {new Date(printer.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <PrinterDetailActions
            printer={{
              id: printer.id,
              brand: printer.brand,
              model: printer.model,
              status: printer.status,
              lastInkRefillDate: printer.lastInkRefillDate,
            }}
            activeRepair={activeRepair ? { issueDescription: activeRepair.issueDescription, vendor: activeRepair.vendor } : null}
            userRole={session.user.role}
          />
        </div>

        {/* Active Repair Warning Banner */}
        {printer.status === PrinterStatus.IN_REPAIR && activeRepair && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5 animate-in fade-in">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded text-amber-700 dark:text-amber-300">
                    Printer Currently In Repair
                  </span>
                  <span className="text-xs opacity-75">
                    Reported on {new Date(activeRepair.reportedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Issue: "{activeRepair.issueDescription}"
                </p>
                {activeRepair.vendor && (
                  <p className="text-xs opacity-80">
                    Assigned Service Vendor: <strong>{activeRepair.vendor}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hardware Capabilities & Functions Card */}
        <div className="glass-card p-6 md:p-8 space-y-5 border-purple-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Hardware Capabilities & Functions</h2>
                <p className="text-xs text-muted-foreground">
                  Color printing support, optical document scanner, and standalone photocopying
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                PRINTER_CONNECTION_TYPES[printer.connectionType]?.badge || "bg-primary/10 border-primary/20 text-primary"
              }`}>
                {printer.connectionType === "WIFI" ? (
                  <Wifi className="w-3.5 h-3.5" />
                ) : printer.connectionType === "ETHERNET_AND_WIFI" ? (
                  <Globe className="w-3.5 h-3.5" />
                ) : printer.connectionType === "USB" ? (
                  <Usb className="w-3.5 h-3.5" />
                ) : (
                  <Cable className="w-3.5 h-3.5" />
                )}
                <span>{PRINTER_CONNECTION_TYPES[printer.connectionType]?.label || "Ethernet"}</span>
              </span>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {printer.isColor ? "Color" : "Monochrome"}{" "}
                  {printer.canScan && printer.canCopy
                    ? "Multi-Function MFP"
                    : printer.canCopy
                    ? "Copier"
                    : printer.canScan
                    ? "Printer & Scanner"
                    : "Single-Function Printer"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Color Output Mode */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Print Output Mode
                </span>
                {printer.isColor ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-purple-500/20 via-pink-500/15 to-blue-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    Full Color (CMYK)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
                    Black & White Only
                  </span>
                )}
              </div>
              <div className="text-base font-bold text-foreground flex items-center gap-2">
                {printer.isColor ? (
                  <>
                    <Palette className="w-4.5 h-4.5 text-purple-500" />
                    <span>Color Printing</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4.5 h-4.5 text-slate-500" />
                    <span>Monochrome</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {printer.isColor
                  ? "Full-color document, image, and graphic printouts with CMYK ink/toner."
                  : "Black & white grayscale only. Cost-effective for invoices and documents."}
              </p>
            </div>

            {/* Document Scanner */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Document Scanner
                </span>
                {printer.canScan ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Supported
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-500/10 text-muted-foreground border border-border">
                    Not Supported
                  </span>
                )}
              </div>
              <div className="text-base font-bold text-foreground flex items-center gap-2">
                <Scan className={`w-4.5 h-4.5 ${printer.canScan ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                <span>{printer.canScan ? "Document Scanner" : "No Scanner"}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {printer.canScan
                  ? "Flatbed or ADF feeder to scan papers directly to PC, email, or network."
                  : "This device does not have an optical scanner. Printing output only."}
              </p>
            </div>

            {/* Direct Photocopier */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Photocopier
                </span>
                {printer.canCopy ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                    Supported
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-500/10 text-muted-foreground border border-border">
                    Not Supported
                  </span>
                )}
              </div>
              <div className="text-base font-bold text-foreground flex items-center gap-2">
                <Copy className={`w-4.5 h-4.5 ${printer.canCopy ? "text-blue-500" : "text-muted-foreground/50"}`} />
                <span>{printer.canCopy ? "Direct Copier" : "No Copier"}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {printer.canCopy
                  ? "Allows immediate photocopying directly from the physical console."
                  : "Direct photocopying without computer connection is not supported."}
              </p>
            </div>

            {/* Duplex Printing (2-Sided) */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Duplex (Double-Sided)
                </span>
                {printer.isDuplex ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    Auto-Duplex
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-500/10 text-muted-foreground border border-border">
                    Single-Sided
                  </span>
                )}
              </div>
              <div className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className={`w-4.5 h-4.5 ${printer.isDuplex ? "text-purple-500" : "text-muted-foreground/50"}`} />
                <span>{printer.isDuplex ? "2-Sided Printing" : "1-Sided Only"}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {printer.isDuplex
                  ? "Automatically prints on both sides of each sheet without manual page flipping."
                  : "Automatic two-sided printing is not supported. Requires manual paper re-insertion."}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Overview: Network Config & Ink Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Network Configuration Card */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
              <Network className="w-5 h-5 text-blue-500" />
              <h2 className="text-base font-bold text-foreground">Network Configuration</h2>
            </div>

            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                    IP Address (Setup & Web Console)
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground block mt-0.5">
                    {printer.ipAddress}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`http://${printer.ipAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    title="Open Printer Web Console"
                  >
                    <span>Open Web GUI</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                    Hardware MAC Address
                  </span>
                  <span className="font-mono text-sm font-semibold text-muted-foreground block mt-0.5">
                    {printer.macAddress}
                  </span>
                </div>
              </div>

              {/* Connection Interface */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                    Connection Interface
                  </span>
                  <span className="text-xs font-bold text-foreground block mt-0.5">
                    {PRINTER_CONNECTION_TYPES[printer.connectionType]?.label || printer.connectionType}
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  PRINTER_CONNECTION_TYPES[printer.connectionType]?.badge || "bg-muted text-muted-foreground"
                }`}>
                  {printer.connectionType === "WIFI" ? (
                    <Wifi className="w-3.5 h-3.5" />
                  ) : printer.connectionType === "ETHERNET_AND_WIFI" ? (
                    <Globe className="w-3.5 h-3.5" />
                  ) : printer.connectionType === "USB" ? (
                    <Usb className="w-3.5 h-3.5" />
                  ) : (
                    <Cable className="w-3.5 h-3.5" />
                  )}
                  <span>{PRINTER_CONNECTION_TYPES[printer.connectionType]?.shortLabel || "LAN"}</span>
                </span>
              </div>

              {printer.location && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                      Physical Placement
                    </span>
                    <span className="text-xs font-bold text-foreground block mt-0.5">
                      {printer.location}
                    </span>
                  </div>
                </div>
              )}

              {/* Network Switch Port Link */}
              {printer.networkConnections && printer.networkConnections.length > 0 && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-400">
                      {printer.networkConnections[0].fromDevice?.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300">
                      Port {printer.networkConnections[0].fromPort}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t border-blue-500/20">
                    <div>Cable: <strong className="text-foreground">{printer.networkConnections[0].cableType}</strong></div>
                    {printer.networkConnections[0].vlan && (
                      <div>VLAN: <strong className="text-foreground">{printer.networkConnections[0].vlan}</strong></div>
                    )}
                    {printer.networkConnections[0].wallOutlet && (
                      <div>Outlet: <strong className="text-foreground">{printer.networkConnections[0].wallOutlet}</strong></div>
                    )}
                  </div>
                  <Link
                    href="/network"
                    className="inline-block text-[11px] font-bold text-primary hover:underline pt-1"
                  >
                    View on Network Map ➔
                  </Link>
                </div>
              )}

              {/* Official Drivers & Software */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Official Drivers & Software</span>
                  </div>
                  {printer.driverUrl ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      No URL Set
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {printer.driverUrl
                    ? "Direct manufacturer driver download package or company setup utility."
                    : "No direct download link was configured. Search manufacturer portal to obtain drivers."}
                </p>

                <div className="pt-1 flex flex-wrap items-center gap-2">
                  {printer.driverUrl ? (
                    <a
                      href={printer.driverUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Official Drivers</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  ) : (
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(`${printer.brand} ${printer.model} official driver download`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors border border-border/80"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Search {printer.brand} Drivers Online</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground ml-0.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground space-y-1">
                <span className="font-bold text-foreground block">Setup Instructions for Employees:</span>
                <p>
                  To connect: Settings ➔ Printers & Scanners ➔ Add Device via IP / TCP/IP Port. Enter IP address <strong className="text-foreground">{printer.ipAddress}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Ink & Toner Status Card */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
              <Droplets className="w-5 h-5 text-blue-500" />
              <h2 className="text-base font-bold text-foreground">Ink / Toner Cartridge Status</h2>
            </div>

            <div className="space-y-4">
              {printer.lastInkRefillDate ? (
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Last Recorded Refill
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-full">
                      {inkDaysAgo === 0
                        ? "Refilled Today"
                        : inkDaysAgo === 1
                        ? "1 day ago"
                        : `${inkDaysAgo} days ago`}
                    </span>
                  </div>
                  <div className="text-lg font-extrabold text-foreground">
                    {new Date(printer.lastInkRefillDate).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  {printer.lastInkRefillNotes && (
                    <p className="text-xs text-muted-foreground italic border-t border-blue-500/10 pt-2 mt-1">
                      "{printer.lastInkRefillNotes}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-muted/30 border border-dashed border-border/80 text-center space-y-2">
                  <Droplets className="w-8 h-8 mx-auto text-muted-foreground/50" />
                  <p className="text-xs font-bold text-foreground">No ink refills recorded yet</p>
                  <p className="text-[11px] text-muted-foreground">
                    Click "Record Ink Refill" to track toner/cartridge replacements over time.
                  </p>
                </div>
              )}

              {/* Total Refill Count Badge */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Lifetime Refills:</span>
                <span className="font-bold text-foreground bg-background px-2.5 py-0.5 rounded-md border border-border">
                  {printer.inkRefills.length} recorded
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ink Refill History Timeline */}
        <div className="glass-card p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-foreground">Ink & Toner Refill Log</h2>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              {printer.inkRefills.length} event{printer.inkRefills.length === 1 ? "" : "s"}
            </span>
          </div>

          {printer.inkRefills.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs">
              No ink refills logged for this printer yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b border-border/60">
                  <tr>
                    <th className="px-4 py-2.5">Refill Date</th>
                    <th className="px-4 py-2.5">Cartridge / Notes</th>
                    <th className="px-4 py-2.5">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {printer.inkRefills.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                        {new Date(log.refillDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.notes || <span className="italic">No notes provided</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {log.refilledByEmail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hardware Maintenance & Repair History Timeline */}
        <div className="glass-card p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">Hardware Maintenance & Repair History</h2>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              {printer.repairs.length} maintenance ticket{printer.repairs.length === 1 ? "" : "s"}
            </span>
          </div>

          {printer.repairs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs">
              No repair or maintenance records on file. Printer has experienced zero hardware downtime!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b border-border/60">
                  <tr>
                    <th className="px-4 py-2.5">Reported Date</th>
                    <th className="px-4 py-2.5">Issue Description</th>
                    <th className="px-4 py-2.5">Vendor / Tech</th>
                    <th className="px-4 py-2.5">Resolution Notes</th>
                    <th className="px-4 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {printer.repairs.map((repair) => (
                    <tr key={repair.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                        {new Date(repair.reportedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium max-w-xs">
                        {repair.issueDescription}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {repair.vendor || <span className="italic">Internal IT</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs">
                        {repair.resolutionNotes || (
                          <span className="italic text-amber-600 dark:text-amber-400">
                            Awaiting resolution
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {repair.resolvedAt ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Resolved on {new Date(repair.resolvedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            Active Repair
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
