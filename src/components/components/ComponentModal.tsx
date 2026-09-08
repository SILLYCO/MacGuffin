"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, Cpu, HardDrive, Zap, Layers, Sparkles, Hash } from "lucide-react";
import { ComponentType } from "@prisma/client";
import {
  COMPONENT_TYPES,
  COMPONENT_BRAND_OPTIONS,
} from "@/lib/constants";
import {
  createComponentAction,
  updateComponentAction,
} from "@/lib/actions/components";
import { ComponentIconBadge } from "@/components/ui/ComponentIcon";

interface DeviceOption {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  deviceType?: string;
}

interface ComponentItem {
  id: string;
  type: ComponentType;
  brand: string;
  model: string;
  capacity?: string | null;
  specs?: string | null;
  serialNumber: string;
  notes?: string | null;
  deviceId?: string | null;
}

interface ComponentModalProps {
  initialComponent?: ComponentItem | null;
  devices: DeviceOption[];
  preselectedDeviceId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ComponentModal({
  initialComponent,
  devices,
  preselectedDeviceId,
  onClose,
  onSuccess,
}: ComponentModalProps) {
  const [mounted, setMounted] = useState(false);
  const isEditing = !!initialComponent;

  useEffect(() => {
    setMounted(true);
  }, []);

  const [type, setType] = useState<ComponentType>(
    initialComponent?.type || ComponentType.RAM
  );
  const [brand, setBrand] = useState(initialComponent?.brand || COMPONENT_BRAND_OPTIONS[0]);
  const [isCustomBrand, setIsCustomBrand] = useState(
    initialComponent ? !COMPONENT_BRAND_OPTIONS.includes(initialComponent.brand as any) : false
  );
  const [customBrand, setCustomBrand] = useState(
    initialComponent && !COMPONENT_BRAND_OPTIONS.includes(initialComponent.brand as any)
      ? initialComponent.brand
      : ""
  );

  const [model, setModel] = useState(initialComponent?.model || "");
  const [capacity, setCapacity] = useState(initialComponent?.capacity || "");
  const [specs, setSpecs] = useState(initialComponent?.specs || "");
  const [serialNumber, setSerialNumber] = useState(initialComponent?.serialNumber || "");
  const [notes, setNotes] = useState(initialComponent?.notes || "");
  const [targetDeviceId, setTargetDeviceId] = useState(
    preselectedDeviceId || initialComponent?.deviceId || ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSerial = () => {
    const prefix = type === "RAM" ? "RAM" : type.startsWith("STORAGE") ? "DSK" : "CMP";
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSerialNumber(`${prefix}-${rand}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalBrand = isCustomBrand ? customBrand.trim() : brand;
    if (!finalBrand) {
      setError("Please specify a component brand.");
      return;
    }

    const isRamOrStorage = type === "RAM" || type.startsWith("STORAGE");
    if (isRamOrStorage && !capacity.trim()) {
      setError("Capacity is required for RAM and Storage components (e.g. 16 GB, 512 GB).");
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
        : "Standard Module";

    const cleanModel = model.trim() || defaultModel;
    const cleanSerial =
      serialNumber.trim() ||
      `GEN-${(type || "CMP").substring(0, 3)}-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

    setLoading(true);

    const formData = new FormData();
    formData.append("type", type);
    formData.append("brand", finalBrand);
    formData.append("model", cleanModel);
    formData.append("capacity", capacity.trim());
    formData.append("specs", specs.trim());
    formData.append("serialNumber", cleanSerial);
    formData.append("notes", notes.trim());
    if (!isEditing && targetDeviceId) {
      formData.append("deviceId", targetDeviceId);
    }

    let res;
    if (isEditing && initialComponent) {
      res = await updateComponentAction(initialComponent.id, formData);
    } else {
      res = await createComponentAction(formData);
    }

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg glass-card border-border shadow-2xl p-6 space-y-5 my-8 z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <ComponentIconBadge type={type} size="lg" />
            <div>
              <h2 className="text-lg font-extrabold text-foreground">
                {isEditing ? "Edit Component Specs" : "Register Hardware Component"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Update hardware metadata and serial number"
                  : "Add a modular swappable piece into IT inventory"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Component Category */}
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
              Part Type / Category
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ComponentType)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              required
            >
              {Object.keys(COMPONENT_TYPES).map((k) => (
                <option key={k} value={k}>
                  {COMPONENT_TYPES[k as ComponentType]?.label || k}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Manufacturer / Brand
              </label>
              <button
                type="button"
                onClick={() => setIsCustomBrand(!isCustomBrand)}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                {isCustomBrand ? "Select from list" : "Custom brand"}
              </button>
            </div>
            {isCustomBrand ? (
              <input
                type="text"
                placeholder="e.g. Kingston, Corsair, Micron, Nvidia"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            ) : (
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                required
              >
                {COMPONENT_BRAND_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Model Name & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                Model Name / Line <span className="font-normal text-muted-foreground lowercase">(optional)</span>
              </label>
              <input
                type="text"
                placeholder={type === "RAM" ? "e.g. DDR4 SO-DIMM (or leave blank)" : "e.g. 980 PRO (or leave blank)"}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                Capacity / Rating {type === "RAM" || type.startsWith("STORAGE") ? <span className="text-primary">*</span> : <span className="font-normal text-muted-foreground lowercase">(optional)</span>}
              </label>
              <input
                type="text"
                placeholder="e.g. 16 GB, 1 TB, 850 W"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Technical Specs & Clock/Form-Factor */}
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
              Technical Specifications <span className="font-normal text-muted-foreground lowercase">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. DDR4 3200MHz CL16, PCIe 4.0 NVMe M.2 2280, GDDR6"
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Serial Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-primary" />
                Serial Number / Barcode Tag <span className="font-normal text-muted-foreground lowercase">(optional - auto-gen if blank)</span>
              </label>
              <button
                type="button"
                onClick={generateSerial}
                className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Auto-gen SN
              </button>
            </div>
            <input
              type="text"
              placeholder="Leave blank to auto-generate or enter custom SN"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-background border border-input rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Target Device Installation (Only on creation) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                Initial Storage / Placement
              </label>
              <select
                value={targetDeviceId}
                onChange={(e) => setTargetDeviceId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              >
                <option value="">IT Storage Closet (Available in Stock Shelf)</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    Mount directly into: {d.brand} {d.model} ({d.serialNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
              Internal Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Salvaged from retired workstation, brand new in blister box..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Save into Inventory"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
