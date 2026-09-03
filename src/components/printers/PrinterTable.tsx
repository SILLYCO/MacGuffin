"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Filter,
  Printer,
  Eye,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Droplets,
  Wrench,
  MapPin,
  Palette,
  Scan,
  FileText,
  Wifi,
  Cable,
  Globe,
  Usb,
  Layers,
  Download,
  RotateCcw,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PRINTER_BRAND_OPTIONS, PRINTER_STATUS_LABELS, PRINTER_CONNECTION_TYPES } from "@/lib/constants";
import { PrinterStatus, PrinterConnectionType } from "@prisma/client";

interface PrinterItem {
  id: string;
  brand: string;
  model: string;
  ipAddress: string;
  macAddress: string;
  status: PrinterStatus;
  location?: string | null;
  isColor: boolean;
  canScan: boolean;
  canCopy: boolean;
  isDuplex: boolean;
  connectionType: PrinterConnectionType;
  driverUrl?: string | null;
  lastInkRefillDate?: Date | string | null;
  lastInkRefillNotes?: string | null;
  repairs?: {
    id: string;
    issueDescription: string;
    resolvedAt: Date | string | null;
    reportedAt: Date | string;
  }[];
}

interface PrinterTableProps {
  printers: PrinterItem[];
  userRole: string;
}

export function PrinterTable({ printers, userRole }: PrinterTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [brandFilter, setBrandFilter] = useState<string>("ALL");
  const [featureFilter, setFeatureFilter] = useState<string>("ALL");
  const [connectionFilter, setConnectionFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isIT = userRole === "IT";

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "ALL" ||
    brandFilter !== "ALL" ||
    featureFilter !== "ALL" ||
    connectionFilter !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setBrandFilter("ALL");
    setFeatureFilter("ALL");
    setConnectionFilter("ALL");
  };

  const totalWorking = printers.filter((p) => p.status === PrinterStatus.WORKING).length;
  const totalInRepair = printers.filter((p) => p.status === PrinterStatus.IN_REPAIR).length;

  const filteredPrinters = printers.filter((printer) => {
    const searchLower = search.toLowerCase();

    const matchesSearch =
      printer.brand.toLowerCase().includes(searchLower) ||
      printer.model.toLowerCase().includes(searchLower) ||
      printer.ipAddress.toLowerCase().includes(searchLower) ||
      printer.macAddress.toLowerCase().includes(searchLower) ||
      (printer.location && printer.location.toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === "ALL" || printer.status === statusFilter;
    const matchesBrand = brandFilter === "ALL" || printer.brand === brandFilter;

    let matchesFeature = true;
    if (featureFilter === "COLOR") matchesFeature = printer.isColor;
    else if (featureFilter === "BW") matchesFeature = !printer.isColor;
    else if (featureFilter === "SCAN") matchesFeature = printer.canScan;
    else if (featureFilter === "COPY") matchesFeature = printer.canCopy;
    else if (featureFilter === "DUPLEX") matchesFeature = printer.isDuplex;

    const matchesConnection =
      connectionFilter === "ALL" || printer.connectionType === connectionFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesBrand &&
      matchesFeature &&
      matchesConnection
    );
  });

  const getDaysAgo = (dateStr?: Date | string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Network Printers Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track printer hardware models, IP & MAC addresses, ink refill dates, and repair lifecycles
          </p>
        </div>

        {isIT && (
          <Link
            href="/printers/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Register New Printer
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 md:p-5 space-y-4">
        {/* Top Row: Search & Status Segments */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by brand, model, IP, MAC, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick 1-Click Status Segmented Control */}
          <div className="inline-flex p-1 bg-muted/60 border border-border/80 rounded-xl self-start sm:self-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                statusFilter === "ALL"
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({printers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter(PrinterStatus.WORKING)}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === PrinterStatus.WORKING
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Working ({totalWorking})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter(PrinterStatus.IN_REPAIR)}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === PrinterStatus.IN_REPAIR
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              In Repair ({totalInRepair})
            </button>
          </div>
        </div>

        {/* Secondary Clean Filter Row: Brand, Specs, Connection, & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-primary" />
              Specs:
            </span>

            {/* Brand Dropdown */}
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-background/80 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              <option value="ALL">All Brands</option>
              {PRINTER_BRAND_OPTIONS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            {/* Consolidated Capabilities Dropdown */}
            <select
              value={featureFilter}
              onChange={(e) => setFeatureFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-background/80 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              <option value="ALL">All Print Capabilities</option>
              <option value="COLOR">🎨 Full Color</option>
              <option value="BW">⬛ Black & White (Mono)</option>
              <option value="SCAN">📄 Document Scanner</option>
              <option value="COPY">📑 Direct Photocopier</option>
              <option value="DUPLEX">📑 Auto 2-Sided (Duplex)</option>
            </select>

            {/* Connection Dropdown */}
            <select
              value={connectionFilter}
              onChange={(e) => setConnectionFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-background/80 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              <option value="ALL">All Connections</option>
              <option value="ETHERNET">🔌 Ethernet (LAN)</option>
              <option value="WIFI">📶 Wi-Fi Wireless</option>
              <option value="ETHERNET_AND_WIFI">🌐 Dual Network</option>
              <option value="USB">🖲️ Direct USB</option>
            </select>
          </div>

          {/* Reset Filters Pill */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted rounded-lg transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Printers Table - Clean 5-Column Design */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border/80 text-[11px] uppercase font-extrabold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-6 py-4">Printer & Placement</th>
                <th className="px-6 py-4">Hardware Profile</th>
                <th className="px-6 py-4">Network (IP & MAC)</th>
                <th className="px-6 py-4">Status & Supplies</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPrinters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                    <Printer className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-base text-foreground">No printers found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try adjusting your search query or filter parameters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPrinters.map((printer) => {
                  const daysAgo = getDaysAgo(printer.lastInkRefillDate);
                  const lastRepair =
                    printer.repairs && printer.repairs.length > 0
                      ? printer.repairs[0]
                      : null;

                  // Hardware profile label
                  const isMFP = printer.canScan && printer.canCopy;
                  const profileType = isMFP
                    ? "MFP"
                    : printer.canCopy
                    ? "Copier"
                    : printer.canScan
                    ? "Scanner"
                    : "Printer";

                  return (
                    <tr
                      key={printer.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* 1. Printer Model & Location */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                            <Printer className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <Link
                              href={`/printers/${printer.id}`}
                              className="font-bold text-foreground group-hover:text-primary transition-colors text-sm block"
                            >
                              {printer.brand} {printer.model}
                            </Link>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-0.5">
                              {printer.location ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                                  <span className="truncate max-w-[220px]">{printer.location}</span>
                                </span>
                              ) : (
                                <span>Brand: {printer.brand}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Hardware Profile */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div>
                            {printer.isColor ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-blue-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                                <Palette className="w-3 h-3" />
                                Color {profileType}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                                <FileText className="w-3 h-3" />
                                Mono {profileType}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <span>{printer.isDuplex ? "Auto 2-Sided" : "1-Sided"}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {printer.connectionType === "WIFI" ? (
                                <Wifi className="w-3 h-3 text-emerald-500" />
                              ) : printer.connectionType === "ETHERNET_AND_WIFI" ? (
                                <Globe className="w-3 h-3 text-purple-500" />
                              ) : printer.connectionType === "USB" ? (
                                <Usb className="w-3 h-3 text-slate-500" />
                              ) : (
                                <Cable className="w-3 h-3 text-blue-500" />
                              )}
                              {PRINTER_CONNECTION_TYPES[printer.connectionType]?.shortLabel || "LAN"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Network (IP & MAC) */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/80">
                              {printer.ipAddress}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(printer.ipAddress, `ip-${printer.id}`)}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Copy IP Address"
                            >
                              {copiedId === `ip-${printer.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <a
                              href={`http://${printer.ipAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                              title="Open Printer Web Console"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            {printer.driverUrl && (
                              <a
                                href={printer.driverUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                                title="Download Official Drivers"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                            <span>MAC: {printer.macAddress}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(printer.macAddress, `mac-${printer.id}`)}
                              className="p-0.5 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                              title="Copy MAC Address"
                            >
                              {copiedId === `mac-${printer.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 4. Status & Supplies */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <StatusBadge status={printer.status} />
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            {printer.status === PrinterStatus.IN_REPAIR ? (
                              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium truncate max-w-[190px]" title={lastRepair?.issueDescription}>
                                <Wrench className="w-3 h-3 shrink-0" />
                                {lastRepair ? lastRepair.issueDescription : "Under active repair"}
                              </span>
                            ) : printer.lastInkRefillDate ? (
                              <span className="flex items-center gap-1">
                                <Droplets className="w-3 h-3 text-blue-500 shrink-0" />
                                {daysAgo === 0
                                  ? "Refilled today"
                                  : daysAgo === 1
                                  ? "Refilled yesterday"
                                  : `Refilled ${daysAgo}d ago`}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/70 italic">No ink recorded</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 5. Action */}
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/printers/${printer.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-all border border-primary/20 hover:scale-105"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3 opacity-70" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border/60 bg-muted/20 text-xs font-semibold text-muted-foreground flex justify-between items-center">
          <span>
            Showing <strong className="text-foreground">{filteredPrinters.length}</strong> of{" "}
            <strong className="text-foreground">{printers.length}</strong> printers
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Clear active filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
