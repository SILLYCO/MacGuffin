"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Plus,
  Trash2,
  Wrench,
  User,
  Shuffle,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  BRAND_OPTIONS,
  DEVICE_TYPES,
  COMPONENT_TYPES,
  COMPONENT_BRAND_OPTIONS,
} from "@/lib/constants";
import { DeviceType, ComponentType } from "@prisma/client";
import { createDeviceAction, updateDeviceAction } from "@/lib/actions/devices";
import { computeDeviceLiveSpecs } from "@/lib/hardware";

export interface StagedComponent {
  id: string; // unique local ID for React key
  stockComponentId?: string; // if selected from in-stock closet
  type: ComponentType;
  brand: string;
  model: string;
  capacity?: string;
  specs?: string;
  serialNumber: string;
  notes?: string;
}

interface DeviceFormProps {
  initialData?: {
    id: string;
    deviceType?: DeviceType;
    brand: string;
    model: string;
    cpu: string;
    ram?: string | null;
    storage?: string | null;
    serialNumber: string;
    purchaseDate?: Date | string | null;
    warrantyExpiry?: Date | string | null;
  };
  employees?: Array<{
    id: string;
    name: string;
    email: string;
    department: string;
  }>;
  inStockComponents?: Array<{
    id: string;
    type: ComponentType;
    brand: string;
    model: string;
    capacity?: string | null;
    specs?: string | null;
    serialNumber: string;
    status: string;
  }>;
}

export function DeviceForm({
  initialData,
  employees = [],
  inStockComponents = [],
}: DeviceFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const initialRamParsed = parseRam(initialData?.ram || "");
  const initialStorageParsed = parseStorage(initialData?.storage || "");

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

  // Staged components for Modular mode
  const [stagedParts, setStagedParts] = useState<StagedComponent[]>([]);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isStockSelectOpen, setIsStockSelectOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState(inStockComponents[0]?.id || "");

  // Immediate employee assignment
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");

  // RAM baseline state
  const [ramAmount, setRamAmount] = useState(initialRamParsed.amount);
  const [ramUnit, setRamUnit] = useState(initialRamParsed.unit);

  // Storage baseline state
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

  // Dynamically calculate live hardware preview for staged modular parts
  const livePreview = computeDeviceLiveSpecs({
    ram: null,
    storage: null,
    components: stagedParts,
  });

  const handleAddStagedPart = (part: Omit<StagedComponent, "id">) => {
    const newPart: StagedComponent = {
      ...part,
      id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setStagedParts((prev) => [...prev, newPart]);
    setIsAddPartModalOpen(false);
  };

  const handleMountStockPart = () => {
    if (!selectedStockId) return;
    const stockItem = inStockComponents.find((c) => c.id === selectedStockId);
    if (!stockItem) return;

    // Check if already staged
    if (stagedParts.some((p) => p.stockComponentId === stockItem.id)) {
      alert("This stock part is already added to this device.");
      return;
    }

    const staged: StagedComponent = {
      id: `staged-stock-${stockItem.id}`,
      stockComponentId: stockItem.id,
      type: stockItem.type,
      brand: stockItem.brand,
      model: stockItem.model,
      capacity: stockItem.capacity || undefined,
      specs: stockItem.specs || undefined,
      serialNumber: stockItem.serialNumber,
    };

    setStagedParts((prev) => [...prev, staged]);
    setIsStockSelectOpen(false);
  };

  const handleRemoveStagedPart = (id: string) => {
    setStagedParts((prev) => prev.filter((p) => p.id !== id));
  };

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

    // Staged modular parts
    if (specsMode === "MODULAR" && stagedParts.length > 0) {
      formData.append("componentsJson", JSON.stringify(stagedParts));
    }

    // Initial assignment
    if (!isEditing && assignedEmployeeId) {
      formData.append("assignedEmployeeId", assignedEmployeeId);
    }

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
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? `Edit ${initialData.brand} ${initialData.model}` : "Add New Computer"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEditing
              ? "Update chassis details, processor, and baseline specs."
              : "Register a laptop or desktop computer into your corporate hardware fleet."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Form Factor Selection Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase text-muted-foreground">
            Computer Form Factor
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                type: DeviceType.LAPTOP,
                label: "Laptop",
                desc: "Portable notebook",
                icon: Laptop,
              },
              {
                type: DeviceType.DESKTOP_PC,
                label: "Desktop PC",
                desc: "Tower / SFF Workstation",
                icon: Monitor,
              },
              {
                type: DeviceType.WORKSTATION,
                label: "Workstation",
                desc: "High-spec Pro PC",
                icon: Server,
              },
              {
                type: DeviceType.SERVER,
                label: "Server Node",
                desc: "Rack / Micro Server",
                icon: Cpu,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = deviceType === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setDeviceType(item.type)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm shadow-primary/10 ring-1 ring-primary"
                      : "border-border/80 bg-background/50 hover:bg-muted/50 hover:border-border"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div
                      className={`text-sm font-bold ${
                        isSelected ? "text-foreground" : "text-foreground/80"
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand & Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
              Manufacturer / Brand
            </label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
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
              placeholder='e.g. EliteBook 840 G1 or OptiPlex 7000'
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
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
              placeholder="e.g. Intel Core i7-13700H, AMD Ryzen 7 7840HS, Apple M3 Max"
              value={cpu}
              onChange={(e) => setCpu(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
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
              <div className="space-y-4">
                {/* Explainer & Live Preview Banner */}
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                      <Sparkles className="w-4 h-4 shrink-0 text-purple-500" />
                      <span>Dynamic Live Hardware Tracking Active</span>
                    </div>
                    {stagedParts.length > 0 && (
                      <span className="text-[11px] font-bold text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/20">
                        {stagedParts.length} {stagedParts.length === 1 ? "part staged" : "parts staged"}
                      </span>
                    )}
                  </div>

                  {stagedParts.length > 0 ? (
                    <div className="p-2.5 rounded-lg bg-background/80 border border-purple-500/30 flex items-center gap-2 text-xs font-bold text-foreground">
                      <span className="text-purple-600 dark:text-purple-400">Live Preview:</span>
                      <span>{livePreview.ramSummary}</span>
                      <span>•</span>
                      <span>{livePreview.storageSummary}</span>
                      {livePreview.gpuSummary && (
                        <>
                          <span>•</span>
                          <span className="text-purple-500">{livePreview.gpuSummary}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Total RAM and Storage are automatically calculated in real-time from the physical modules (SO-DIMMs, M.2 SSDs) mounted in this machine. You can register/mount parts right below!
                    </p>
                  )}
                </div>

                {/* Staged Hardware Parts List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-500" />
                      Physical Hardware Parts in this Machine
                    </span>

                    <div className="flex items-center gap-2">
                      {inStockComponents.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsStockSelectOpen(!isStockSelectOpen)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-all"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>+ Mount from Stock Closet</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsAddPartModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add New Part</span>
                      </button>
                    </div>
                  </div>

                  {/* Picker dropdown for in-stock shelf items */}
                  {isStockSelectOpen && inStockComponents.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-background border border-purple-500/30 shadow-md space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          Select Spare Part from IT Closet Shelf
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsStockSelectOpen(false)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={selectedStockId}
                          onChange={(e) => setSelectedStockId(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs bg-muted/40 border border-input rounded-lg font-medium"
                        >
                          {inStockComponents.map((c) => (
                            <option key={c.id} value={c.id}>
                              [{c.type}] {c.brand} {c.model} ({c.capacity || "Std"} - SN: {c.serialNumber})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleMountStockPart}
                          className="px-3 py-2 text-xs font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all shrink-0"
                        >
                          Mount to Device
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render staged parts */}
                  {stagedParts.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-background/50 border border-dashed border-border/80">
                      <p className="text-xs text-muted-foreground">
                        No physical parts attached yet. Click <strong>+ Add New Part</strong> above to register RAM or SSD sticks directly inside this machine.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stagedParts.map((part) => {
                        const typeDef = COMPONENT_TYPES[part.type] || COMPONENT_TYPES.OTHER;
                        return (
                          <div
                            key={part.id}
                            className="p-3 rounded-xl bg-background/70 border border-border/80 flex items-center justify-between gap-3 hover:border-purple-500/30 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${typeDef.badge}`}
                              >
                                {typeDef.shortLabel}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-foreground text-xs truncate">
                                  {part.brand} {part.model}
                                  {part.capacity && (
                                    <span className="text-purple-600 dark:text-purple-400 font-semibold ml-1.5">
                                      ({part.capacity})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                  <span className="font-mono">{part.serialNumber}</span>
                                  {part.specs && <span>• {part.specs}</span>}
                                  {part.stockComponentId ? (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                      [From IT Stock]
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                      [Brand New Part]
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveStagedPart(part.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                              title="Remove part"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

        {/* Initial Employee Assignment (Only on creation) */}
        {!isEditing && employees.length > 0 && (
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <User className="w-4 h-4" />
              Employee Assignment (Optional)
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Assign this computer & its mounted parts immediately to an employee
              </label>
              <select
                value={assignedEmployeeId}
                onChange={(e) => setAssignedEmployeeId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              >
                <option value="">Keep in IT Inventory (In Stock / Unassigned)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    👤 {emp.name} — {emp.department} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-muted-foreground">
              When assigned, this computer and all staged modular components will immediately appear in that employee's hardware custody.
            </p>
          </div>
        )}

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

      {/* Inline Part Registration Modal */}
      {mounted && isAddPartModalOpen && (
        <InlineAddPartModal
          onClose={() => setIsAddPartModalOpen(false)}
          onAdd={handleAddStagedPart}
        />
      )}
    </div>
  );
}

// Sub-component: Clean modal for registering a brand new part inline
interface InlineAddPartModalProps {
  onClose: () => void;
  onAdd: (part: Omit<StagedComponent, "id">) => void;
}

function InlineAddPartModal({ onClose, onAdd }: InlineAddPartModalProps) {
  const [type, setType] = useState<ComponentType>(ComponentType.RAM);
  const [brand, setBrand] = useState<string>(COMPONENT_BRAND_OPTIONS[0]);
  const [model, setModel] = useState("");
  const [capacity, setCapacity] = useState("16 GB");
  const [specs, setSpecs] = useState("DDR4-3200MHz");
  const [serialNumber, setSerialNumber] = useState("");
  const [notes, setNotes] = useState("");

  const handleGenerateSerial = () => {
    const prefix = type === "RAM" ? "RAM" : type.startsWith("STORAGE") ? "SSD" : "CMP";
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSerialNumber(`SN-${prefix}-${randomHex}`);
  };

  const handleTypeChange = (newType: ComponentType) => {
    setType(newType);
    if (newType === "RAM") {
      setCapacity("16 GB");
      setSpecs("DDR4-3200MHz");
    } else if (newType === "STORAGE_SSD") {
      setCapacity("512 GB");
      setSpecs("PCIe 4.0 NVMe M.2");
    } else if (newType === "STORAGE_HDD") {
      setCapacity("1 TB");
      setSpecs("7200 RPM 2.5\"");
    } else if (newType === "GPU") {
      setCapacity("8 GB");
      setSpecs("GDDR6");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim()) {
      alert("Please select or enter a component brand.");
      return;
    }

    const isRamOrStorage = type === "RAM" || type.startsWith("STORAGE");
    if (isRamOrStorage && !capacity.trim()) {
      alert("Capacity is required for RAM and Storage components (e.g. 16 GB, 512 GB).");
      return;
    }

    const defaultModel =
      type === "RAM"
        ? "Memory Module"
        : type === "STORAGE_SSD"
        ? "Solid State Drive"
        : type === "STORAGE_HDD"
        ? "Hard Disk Drive"
        : type === "GPU"
        ? "Graphics Card"
        : type === "CPU"
        ? "Processor"
        : type === "POWER_SUPPLY"
        ? "Power Supply"
        : "Generic Module";

    const cleanModel = model.trim() || defaultModel;
    const cleanSerial =
      serialNumber.trim() ||
      `GEN-${(type || "CMP").substring(0, 3)}-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

    onAdd({
      type,
      brand: brand.trim(),
      model: cleanModel,
      capacity: capacity.trim() || undefined,
      specs: specs.trim() || undefined,
      serialNumber: cleanSerial,
      notes: notes.trim() || undefined,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg glass-card border border-border/80 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-sm">Add New Modular Component</h2>
              <p className="text-[11px] text-muted-foreground">
                Define a physical module to mount into this machine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Component Type Selector */}
          <div>
            <label className="block font-bold text-muted-foreground uppercase mb-1.5">
              Part Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {(
                [
                  ComponentType.RAM,
                  ComponentType.STORAGE_SSD,
                  ComponentType.STORAGE_HDD,
                  ComponentType.GPU,
                  ComponentType.CPU,
                  ComponentType.POWER_SUPPLY,
                  ComponentType.OTHER,
                ] as ComponentType[]
              ).map((t) => {
                const def = COMPONENT_TYPES[t] || COMPONENT_TYPES.OTHER;
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`px-2 py-1.5 rounded-lg border text-center font-bold text-[11px] transition-all ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {def.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-muted-foreground uppercase mb-1">Brand</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              >
                {COMPONENT_BRAND_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-muted-foreground uppercase mb-1">
                Model Name <span className="font-normal text-muted-foreground lowercase">(optional)</span>
              </label>
              <input
                type="text"
                placeholder={type === "RAM" ? "e.g. DDR4 SO-DIMM (or leave blank)" : "e.g. 980 PRO (or leave blank)"}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              />
            </div>
          </div>

          {/* Capacity & Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-muted-foreground uppercase mb-1">
                Capacity {type === "RAM" || type.startsWith("STORAGE") ? <span className="text-primary">*</span> : <span className="font-normal text-muted-foreground lowercase">(optional)</span>}
              </label>
              <input
                type="text"
                placeholder="e.g. 16 GB or 1 TB"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-mono font-medium"
              />
              <div className="flex gap-1 pt-1">
                {type === "RAM"
                  ? ["8 GB", "16 GB", "32 GB"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCapacity(c)}
                        className="px-1.5 py-0.5 rounded bg-muted/60 text-[10px] font-mono text-muted-foreground hover:text-foreground"
                      >
                        {c}
                      </button>
                    ))
                  : ["256 GB", "512 GB", "1 TB", "2 TB"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCapacity(c)}
                        className="px-1.5 py-0.5 rounded bg-muted/60 text-[10px] font-mono text-muted-foreground hover:text-foreground"
                      >
                        {c}
                      </button>
                    ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-muted-foreground uppercase mb-1">
                Technical Specs <span className="font-normal text-muted-foreground lowercase">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. DDR4-3200MHz CL16"
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              />
            </div>
          </div>

          {/* Serial Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-muted-foreground uppercase">
                Serial Number <span className="font-normal text-muted-foreground lowercase">(optional - auto-gen if blank)</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateSerial}
                className="inline-flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline"
              >
                <Shuffle className="w-3 h-3" />
                <span>Auto-Gen</span>
              </button>
            </div>
            <input
              type="text"
              placeholder="Leave blank to auto-generate or enter custom SN"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-mono font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-all shadow-md shadow-purple-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Part to Device</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
