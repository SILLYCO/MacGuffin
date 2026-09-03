"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  Network,
  Save,
  AlertCircle,
  MapPin,
  Droplets,
  Wrench,
  Sparkles,
  Palette,
  Scan,
  Copy,
  Check,
  FileText,
  Wifi,
  Globe,
  Usb,
  Cable,
  Layers,
  Download,
  Link2,
} from "lucide-react";
import { PRINTER_BRAND_OPTIONS, PRINTER_CONNECTION_TYPES } from "@/lib/constants";
import { PrinterStatus, PrinterConnectionType } from "@prisma/client";
import { createPrinterAction, updatePrinterAction } from "@/lib/actions/printers";

interface PrinterFormProps {
  initialData?: {
    id: string;
    brand: string;
    model: string;
    ipAddress: string;
    macAddress: string;
    location?: string | null;
    status?: PrinterStatus;
    isColor?: boolean;
    canScan?: boolean;
    canCopy?: boolean;
    isDuplex?: boolean;
    connectionType?: PrinterConnectionType;
    driverUrl?: string | null;
    lastInkRefillDate?: Date | string | null;
    lastInkRefillNotes?: string | null;
  };
  isEdit?: boolean;
}

export function PrinterForm({ initialData, isEdit = false }: PrinterFormProps) {
  const router = useRouter();

  const isPredefinedBrand = initialData?.brand
    ? (PRINTER_BRAND_OPTIONS as readonly string[]).includes(initialData.brand)
    : true;

  const [selectedBrandOption, setSelectedBrandOption] = useState<string>(
    initialData?.brand
      ? isPredefinedBrand
        ? initialData.brand
        : "CUSTOM"
      : PRINTER_BRAND_OPTIONS[0]
  );
  const [customBrand, setCustomBrand] = useState<string>(
    initialData?.brand && !isPredefinedBrand ? initialData.brand : ""
  );

  const [model, setModel] = useState(initialData?.model || "");
  const [ipAddress, setIpAddress] = useState(initialData?.ipAddress || "");
  const [macAddress, setMacAddress] = useState(initialData?.macAddress || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [status, setStatus] = useState<PrinterStatus>(
    initialData?.status || PrinterStatus.WORKING
  );

  // Hardware Capabilities
  const [isColor, setIsColor] = useState<boolean>(
    initialData?.isColor !== undefined ? initialData.isColor : false
  );
  const [canScan, setCanScan] = useState<boolean>(
    initialData?.canScan !== undefined ? initialData.canScan : true
  );
  const [canCopy, setCanCopy] = useState<boolean>(
    initialData?.canCopy !== undefined ? initialData.canCopy : true
  );
  const [isDuplex, setIsDuplex] = useState<boolean>(
    initialData?.isDuplex !== undefined ? initialData.isDuplex : true
  );
  const [connectionType, setConnectionType] = useState<PrinterConnectionType>(
    initialData?.connectionType || "ETHERNET"
  );
  const [driverUrl, setDriverUrl] = useState<string>(
    initialData?.driverUrl || ""
  );

  // Initial ink refill info (creation only)
  const [recordInitialInk, setRecordInitialInk] = useState(false);
  const [initialInkDate, setInitialInkDate] = useState(
    initialData?.lastInkRefillDate
      ? new Date(initialData.lastInkRefillDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [initialInkNotes, setInitialInkNotes] = useState(
    initialData?.lastInkRefillNotes || ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveBrand =
    selectedBrandOption === "CUSTOM" ? customBrand.trim() : selectedBrandOption;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!effectiveBrand) {
      setError("Please select or specify a printer brand.");
      return;
    }

    if (!model.trim()) {
      setError("Printer model is required.");
      return;
    }

    if (!ipAddress.trim()) {
      setError("IP Address is required.");
      return;
    }

    if (!macAddress.trim()) {
      setError("MAC Address is required.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("brand", effectiveBrand);
    formData.append("model", model.trim());
    formData.append("ipAddress", ipAddress.trim());
    formData.append("macAddress", macAddress.trim().toUpperCase());
    formData.append("location", location.trim());
    formData.append("status", status);
    formData.append("isColor", String(isColor));
    formData.append("canScan", String(canScan));
    formData.append("canCopy", String(canCopy));
    formData.append("isDuplex", String(isDuplex));
    formData.append("connectionType", connectionType);
    formData.append("driverUrl", driverUrl.trim());

    if (!isEdit && recordInitialInk && initialInkDate) {
      formData.append("lastInkRefillDate", initialInkDate);
      formData.append("lastInkRefillNotes", initialInkNotes.trim());
    }

    const res = isEdit && initialData
      ? await updatePrinterAction(initialData.id, formData)
      : await createPrinterAction(formData);

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      if (isEdit && initialData) {
        router.push(`/printers/${initialData.id}`);
      } else if (res && "printerId" in res && res.printerId) {
        router.push(`/printers/${res.printerId}`);
      } else {
        router.push("/printers");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hardware & Identity Section */}
      <div className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border/60">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Printer Specifications</h2>
            <p className="text-xs text-muted-foreground">
              Manufacturer brand, model title, and physical installation location
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brand */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
              Brand / Manufacturer <span className="text-destructive">*</span>
            </label>
            <select
              value={selectedBrandOption}
              onChange={(e) => setSelectedBrandOption(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              required
            >
              {PRINTER_BRAND_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value="CUSTOM">-- Other / Custom Brand --</option>
            </select>

            {selectedBrandOption === "CUSTOM" && (
              <input
                type="text"
                placeholder="Enter custom manufacturer..."
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                className="w-full mt-2 px-4 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            )}
          </div>

          {/* Model */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
              Printer Model <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. LaserJet Pro MFP M428fdw"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
              Physical Location / Department <span className="text-[11px] text-muted-foreground font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="e.g. 2nd Floor - Main Office Hallway, Finance Dept"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Helps employees and IT technicians quickly locate the printer physically.
            </p>
          </div>
        </div>
      </div>

      {/* Capabilities & Print Technology Section */}
      <div className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Print Technology & Capabilities</h2>
              <p className="text-xs text-muted-foreground">
                Specify color mode, document scanning, and direct photocopying support
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isColor ? "Color" : "Monochrome"}{" "}
              {canScan && canCopy
                ? "Multi-Function MFP"
                : canCopy
                ? "Copier"
                : canScan
                ? "Printer & Scanner"
                : "Single-Function"}
              {isDuplex ? " (Duplex)" : ""}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Color Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
              Print Color Mode <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Monochrome Card */}
              <button
                type="button"
                onClick={() => setIsColor(false)}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                  !isColor
                    ? "bg-slate-500/10 border-slate-400 dark:border-slate-600 text-foreground ring-2 ring-slate-400/20"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                  !isColor ? "bg-slate-700 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">Black & White Only</span>
                    {!isColor && (
                      <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Monochrome printing. Uses black toner / ink only. Ideal for text documents, spreadsheets, and invoices.
                  </p>
                </div>
              </button>

              {/* Color Card */}
              <button
                type="button"
                onClick={() => setIsColor(true)}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                  isColor
                    ? "bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-blue-500/15 border-purple-500 text-foreground ring-2 ring-purple-500/25"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                  isColor
                    ? "bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-muted text-muted-foreground"
                }`}>
                  <Palette className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">Full Color (CMYK)</span>
                    {isColor && (
                      <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Supports high-resolution color document & graphic reproduction with Cyan, Magenta, Yellow & Black.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Multifunction & Duplex Capabilities */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
              Multifunction & Duplex Features (Scan, Copy & 2-Sided)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Document Scanner Toggle */}
              <div
                onClick={() => setCanScan(!canScan)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 select-none ${
                  canScan
                    ? "bg-primary/10 border-primary text-foreground ring-2 ring-primary/20"
                    : "bg-card border-border text-muted-foreground hover:text-foreground opacity-75"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                  canScan ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <Scan className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">Document Scanner</span>
                    <input
                      type="checkbox"
                      checked={canScan}
                      onChange={() => {}} // Handled by container
                      className="rounded border-input text-primary focus:ring-ring w-4 h-4 pointer-events-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Optical flatbed or ADF scanner to digitize documents to PC, email, or network.
                  </p>
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider mt-1 ${
                    canScan ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {canScan ? "✓ Scanner Enabled" : "✕ No Scanner"}
                  </span>
                </div>
              </div>

              {/* Photocopier Toggle */}
              <div
                onClick={() => setCanCopy(!canCopy)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 select-none ${
                  canCopy
                    ? "bg-blue-500/10 border-blue-500 text-foreground ring-2 ring-blue-500/20"
                    : "bg-card border-border text-muted-foreground hover:text-foreground opacity-75"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                  canCopy ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  <Copy className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">Photocopier</span>
                    <input
                      type="checkbox"
                      checked={canCopy}
                      onChange={() => {}} // Handled by container
                      className="rounded border-input text-primary focus:ring-ring w-4 h-4 pointer-events-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Direct hardware copying and document replication right from machine panel.
                  </p>
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider mt-1 ${
                    canCopy ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                  }`}>
                    {canCopy ? "✓ Copier Enabled" : "✕ No Copier"}
                  </span>
                </div>
              </div>

              {/* Duplex Toggle */}
              <div
                onClick={() => setIsDuplex(!isDuplex)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 select-none ${
                  isDuplex
                    ? "bg-purple-500/10 border-purple-500 text-foreground ring-2 ring-purple-500/20"
                    : "bg-card border-border text-muted-foreground hover:text-foreground opacity-75"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                  isDuplex ? "bg-purple-600 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">Auto-Duplex</span>
                    <input
                      type="checkbox"
                      checked={isDuplex}
                      onChange={() => {}} // Handled by container
                      className="rounded border-input text-purple-600 focus:ring-ring w-4 h-4 pointer-events-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Automatically prints double-sided pages without manual page flipping.
                  </p>
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider mt-1 ${
                    isDuplex ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"
                  }`}>
                    {isDuplex ? "✓ 2-Sided Enabled" : "✕ Single-Sided Only"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Configuration Section */}
      <div className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border/60">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Network Setup & Identification</h2>
            <p className="text-xs text-muted-foreground">
              Static IP address for network printing setup and MAC address for router DHCP reservation
            </p>
          </div>
        </div>

        {/* Connection Interface Selector */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
            Connection Interface <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Ethernet */}
            <button
              type="button"
              onClick={() => setConnectionType("ETHERNET")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                connectionType === "ETHERNET"
                  ? "bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Cable className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-xs">Ethernet (LAN)</span>
              </div>
              <p className="text-[11px] opacity-75">Wired RJ-45 switch cable</p>
            </button>

            {/* Wi-Fi */}
            <button
              type="button"
              onClick={() => setConnectionType("WIFI")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                connectionType === "WIFI"
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-xs">Wi-Fi Wireless</span>
              </div>
              <p className="text-[11px] opacity-75">802.11 b/g/n office Wi-Fi</p>
            </button>

            {/* Dual */}
            <button
              type="button"
              onClick={() => setConnectionType("ETHERNET_AND_WIFI")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                connectionType === "ETHERNET_AND_WIFI"
                  ? "bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-xs">Dual (LAN+Wi-Fi)</span>
              </div>
              <p className="text-[11px] opacity-75">Both wired and wireless</p>
            </button>

            {/* USB */}
            <button
              type="button"
              onClick={() => setConnectionType("USB")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                connectionType === "USB"
                  ? "bg-slate-500/10 border-slate-500 text-slate-700 dark:text-slate-300 ring-2 ring-slate-500/20"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Usb className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-xs">Direct USB</span>
              </div>
              <p className="text-[11px] opacity-75">Local USB host cable</p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* IP Address */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
              IPv4 Address <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 192.168.1.150"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-mono bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Used by employees to add the printer via IP port and by IT to access the embedded web console.
            </p>
          </div>

          {/* MAC Address */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
              Hardware MAC Address <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 00:1A:2B:3C:4D:5E"
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 text-sm font-mono uppercase bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Used for network switch port mapping and router DHCP static lease reservations.
            </p>
          </div>
        </div>

        {/* Driver Download URL / Share Path */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
            Official Driver Download URL or Network Share Path <span className="text-[11px] text-muted-foreground font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Link2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="e.g. https://support.hp.com/drivers/... or \\printserver\drivers\office-printer"
              value={driverUrl}
              onChange={(e) => setDriverUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-mono text-xs"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Provides a direct 1-click button on the printer's page for employees to download software or drivers.
          </p>
        </div>
      </div>

      {/* Initial Status & Ink Tracking (Only on Creation) */}
      {!isEdit && (
        <div className="glass-card p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border/60">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Operational Status & Ink Baseline</h2>
              <p className="text-xs text-muted-foreground">
                Set initial printer readiness and optionally record initial ink/toner installation
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Initial Operational Status
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setStatus(PrinterStatus.WORKING)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    status === PrinterStatus.WORKING
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="font-bold text-sm">Working</div>
                  <div className="text-xs opacity-80 mt-0.5">Online and ready for office printing jobs</div>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus(PrinterStatus.IN_REPAIR)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    status === PrinterStatus.IN_REPAIR
                      ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="font-bold text-sm">In Repair</div>
                  <div className="text-xs opacity-80 mt-0.5">Under maintenance, awaiting parts or servicing</div>
                </button>
              </div>
            </div>

            {/* Ink Refill Checkbox */}
            <div className="pt-3 border-t border-border/40">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={recordInitialInk}
                  onChange={(e) => setRecordInitialInk(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-ring w-4 h-4"
                />
                <span className="text-xs font-bold text-foreground">
                  Record initial toner / ink refill date now
                </span>
              </label>

              {recordInitialInk && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 rounded-xl bg-muted/40 border border-border/60 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Refill / Setup Date
                    </label>
                    <input
                      type="date"
                      value={initialInkDate}
                      onChange={(e) => setInitialInkDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Cartridge / Refill Notes <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Installed full HP 58A Black Toner"
                      value={initialInkNotes}
                      onChange={(e) => setInitialInkNotes(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-all hover:scale-105"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving Printer..." : isEdit ? "Update Printer" : "Register Printer"}
        </button>
      </div>
    </form>
  );
}
