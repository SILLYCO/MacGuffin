"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Cpu,
  HardDrive,
  Calendar,
  Laptop,
  Monitor,
  Server,
  Layers,
  Sparkles,
} from "lucide-react";
import { BRAND_OPTIONS, DEVICE_TYPES } from "@/lib/constants";
import { DeviceType } from "@prisma/client";
import { createDeviceAction, updateDeviceAction } from "@/lib/actions/devices";

interface DeviceFormProps {
  initialData?: {
    id: string;
    deviceType?: DeviceType;
    brand: string;
    model: string;
    cpu: string;
    ram: string;
    storage: string;
    serialNumber: string;
    purchaseDate?: Date | string | null;
    warrantyExpiry?: Date | string | null;
  };
}

export function DeviceForm({ initialData }: DeviceFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Parse initial RAM (e.g. "16 GB" -> amount: 16, unit: "GB")
  const parseRam = (ramStr?: string) => {
    if (!ramStr) return { amount: "16", unit: "GB" };
    const match = ramStr.match(/^(\d+)\s*(GB|TB)?/i);
    if (match) {
      return { amount: match[1], unit: match[2]?.toUpperCase() || "GB" };
    }
    return { amount: ramStr.replace(/\D/g, "") || "16", unit: "GB" };
  };

  // Parse initial Storage (e.g. "512 GB SSD" -> amount: 512, unit: "GB", type: "SSD")
  const parseStorage = (storageStr?: string) => {
    if (!storageStr) return { amount: "512", unit: "GB", type: "SSD" };
    const match = storageStr.match(/^(\d+)\s*(GB|TB)?\s*(SSD|NVMe SSD|HDD|NVMe)?/i);
    if (match) {
      return {
        amount: match[1],
        unit: match[2]?.toUpperCase() || "GB",
        type: match[3] || "SSD",
      };
    }
    return { amount: "512", unit: "GB", type: "SSD" };
  };

  const initialRamParsed = parseRam(initialData?.ram);
  const initialStorageParsed = parseStorage(initialData?.storage);

  // Form field states
  const [deviceType, setDeviceType] = useState<DeviceType>(
    initialData?.deviceType || DeviceType.LAPTOP
  );
  const [brand, setBrand] = useState(initialData?.brand || BRAND_OPTIONS[0]);
  const [model, setModel] = useState(initialData?.model || "");
  const [cpu, setCpu] = useState(initialData?.cpu || "");

  // Specs mode: Modular auto-calculation vs Optional static baseline
  const hasExistingSpecs = Boolean(initialData?.ram?.trim() || initialData?.storage?.trim());
  const [specsMode, setSpecsMode] = useState<"MODULAR" | "BASELINE">(
    hasExistingSpecs ? "BASELINE" : "MODULAR"
  );

  // RAM state
  const [ramAmount, setRamAmount] = useState(initialRamParsed.amount);
  const [ramUnit, setRamUnit] = useState(initialRamParsed.unit);

  // Storage state
  const [storageAmount, setStorageAmount] = useState(initialStorageParsed.amount);
  const [storageUnit, setStorageUnit] = useState(initialStorageParsed.unit);
  const [storageType, setStorageType] = useState(initialStorageParsed.type);

  const [serialNumber, setSerialNumber] = useState(initialData?.serialNumber || "");

  const formatDateForInput = (d: Date | string | undefined | null) => {
    if (!d) return "";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return isNaN(dateObj.getTime()) ? "" : dateObj.toISOString().split("T")[0];
  };

  const [purchaseDate, setPurchaseDate] = useState(
    formatDateForInput(initialData?.purchaseDate)
  );
  const [warrantyExpiry, setWarrantyExpiry] = useState(
    formatDateForInput(initialData?.warrantyExpiry)
  );

  const ramPresets = ["8", "16", "24", "32", "36", "48", "64", "96", "128"];
  const storagePresets = [
    { amount: "256", unit: "GB", type: "SSD" },
    { amount: "512", unit: "GB", type: "SSD" },
    { amount: "1", unit: "TB", type: "SSD" },
    { amount: "2", unit: "TB", type: "SSD" },
    { amount: "4", unit: "TB", type: "SSD" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setLoading(true);

    let formattedRam = "";
    let formattedStorage = "";

    if (specsMode === "BASELINE") {
      if (ramAmount && !isNaN(Number(ramAmount)) && Number(ramAmount) > 0) {
        formattedRam = `${ramAmount.trim()} ${ramUnit}`;
      }
      if (storageAmount && !isNaN(Number(storageAmount)) && Number(storageAmount) > 0) {
        formattedStorage = `${storageAmount.trim()} ${storageUnit} ${storageType}`.trim();
      }
    }

    const formData = new FormData();
    formData.append("deviceType", deviceType);
    formData.append("brand", brand);
    formData.append("model", model);
    formData.append("cpu", cpu);
    formData.append("ram", formattedRam);
    formData.append("storage", formattedStorage);
    formData.append("serialNumber", serialNumber);
    formData.append("purchaseDate", purchaseDate || "");
    formData.append("warrantyExpiry", warrantyExpiry || "");

    let res;
    if (isEditing && initialData) {
      res = await updateDeviceAction(initialData.id, formData);
    } else {
      res = await createDeviceAction(formData);
    }

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      if (isEditing && initialData) {
        router.push(`/devices/${initialData.id}`);
      } else if (res && "deviceId" in res && res.deviceId) {
        router.push(`/devices/${(res as any).deviceId}`);
      } else {
        router.push("/devices");
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Link
          href={isEditing ? `/devices/${initialData.id}` : "/devices"}
          className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-muted-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {isEditing ? "Edit Computer Specs" : "Add New Computer"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Update machine specifications or warranty details"
              : "Register a new laptop or desktop PC into company inventory"}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
        {/* Computer Form Factor Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase text-muted-foreground">
            Computer Form Factor
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: DeviceType.LAPTOP, label: "Laptop", desc: "Mobile notebook", icon: Laptop },
              { type: DeviceType.DESKTOP_PC, label: "Desktop PC", desc: "Tower / Mini PC", icon: Monitor },
              { type: DeviceType.WORKSTATION, label: "Workstation", desc: "High-power tower", icon: Cpu },
              { type: DeviceType.SERVER, label: "Server Node", desc: "Rack / Standalone", icon: Server },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = deviceType === item.type;
              return (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setDeviceType(item.type)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary"
                      : "border-border bg-card/60 hover:bg-muted/60 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-foreground">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {/* Device Brand & Model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
              Brand
            </label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              {BRAND_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
              Model Name / Series
            </label>
            <input
              type="text"
              placeholder='e.g. MacBook Pro 16" or XPS 15'
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </div>

        {/* Hardware Specs Section */}
        <div className="p-5 rounded-2xl bg-muted/20 border border-border/60 space-y-5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            <Cpu className="w-4 h-4 text-primary" />
            Hardware Specifications
          </div>

          {/* CPU Input */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              CPU / Processor
            </label>
            <input
              type="text"
              placeholder="e.g. Apple M3 Max, Intel i7-13700H, AMD Ryzen 7 7840HS"
              value={cpu}
              onChange={(e) => setCpu(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Memory & Storage Configuration Section */}
          <div className="space-y-4 pt-3 border-t border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-bold text-foreground">
                  Memory (RAM) & Storage Configuration
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Dynamic auto-calculation from swappable parts vs optional static baseline
                </span>
              </div>

              {/* Mode Segmented Switcher */}
              <div className="inline-flex p-1 bg-muted/60 border border-border/70 rounded-xl text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setSpecsMode("MODULAR")}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    specsMode === "MODULAR"
                      ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Modular Auto-Calculated</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSpecsMode("BASELINE")}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    specsMode === "BASELINE"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Quick Baseline</span>
                </button>
              </div>
            </div>

            {specsMode === "MODULAR" ? (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 shrink-0 text-purple-500" />
                  <span>Dynamic Live Modular Tracking (Zero Form Editing)</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Total RAM and Storage are automatically calculated in real-time from the physical modules (SO-DIMM sticks, M.2 NVMe SSDs) mounted inside this machine. When you unplug, upgrade, or swap parts, the live hardware specs update automatically without needing to edit this form.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setSpecsMode("BASELINE")}
                    className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Want to specify an optional fallback text baseline instead? Click here.
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl bg-muted/30 border border-border/60">
                {/* Optional Baseline RAM */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-foreground">
                      Baseline RAM (Optional)
                    </label>
                    <span className="text-[10px] text-muted-foreground">e.g. 16 GB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="1024"
                      placeholder="e.g. 16, 32"
                      value={ramAmount}
                      onChange={(e) => setRamAmount(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                    />
                    <select
                      value={ramUnit}
                      onChange={(e) => setRamUnit(e.target.value)}
                      className="px-3 py-2 text-sm font-bold bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="GB">GB</option>
                      <option value="TB">TB</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {ramPresets.slice(0, 5).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setRamAmount(val);
                          setRamUnit("GB");
                        }}
                        className={`px-2 py-0.5 text-[11px] font-mono rounded-lg border transition-all ${
                          ramAmount === val && ramUnit === "GB"
                            ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                            : "bg-background/80 text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {val}GB
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Baseline Storage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-foreground">
                      Baseline Storage (Optional)
                    </label>
                    <span className="text-[10px] text-muted-foreground">e.g. 512 GB SSD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="8000"
                      placeholder="e.g. 512, 1"
                      value={storageAmount}
                      onChange={(e) => setStorageAmount(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                    />
                    <select
                      value={storageUnit}
                      onChange={(e) => setStorageUnit(e.target.value)}
                      className="px-2.5 py-2 text-sm font-bold bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
                    >
                      <option value="GB">GB</option>
                      <option value="TB">TB</option>
                    </select>
                    <select
                      value={storageType}
                      onChange={(e) => setStorageType(e.target.value)}
                      className="px-2.5 py-2 text-xs font-medium bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
                    >
                      <option value="SSD">SSD</option>
                      <option value="NVMe SSD">NVMe SSD</option>
                      <option value="HDD">HDD</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {storagePresets.slice(0, 4).map((p) => (
                      <button
                        key={`${p.amount}${p.unit}`}
                        type="button"
                        onClick={() => {
                          setStorageAmount(p.amount);
                          setStorageUnit(p.unit);
                          setStorageType(p.type);
                        }}
                        className={`px-2 py-0.5 text-[11px] font-mono rounded-lg border transition-all ${
                          storageAmount === p.amount && storageUnit === p.unit
                            ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                            : "bg-background/80 text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {p.amount}{p.unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Serial Number */}
        <div>
          <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
            Serial Number (Unique Hardware Identifier)
          </label>
          <input
            type="text"
            placeholder="e.g. C02G1234MD6R"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm font-mono bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        {/* Purchase & Warranty Dates (Optional) */}
        <div className="p-4 rounded-2xl bg-muted/10 border border-border/60 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            Warranty & Acquisition Dates <span className="text-[11px] font-normal lowercase">(optional)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex justify-between">
                <span>Purchase Date</span>
                <span className="text-[11px] text-muted-foreground">Optional</span>
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex justify-between">
                <span>Warranty Expiration Date</span>
                <span className="text-[11px] text-muted-foreground">Optional</span>
              </label>
              <input
                type="date"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Link
            href={isEditing ? `/devices/${initialData.id}` : "/devices"}
            className="px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-primary-foreground bg-primary rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : isEditing ? "Update Device" : "Add Device"}
          </button>
        </div>
      </form>
    </div>
  );
}
