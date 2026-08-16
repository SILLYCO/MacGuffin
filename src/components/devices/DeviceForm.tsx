"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import {
  CPU_OPTIONS,
  RAM_OPTIONS,
  STORAGE_OPTIONS,
  BRAND_OPTIONS,
} from "@/lib/constants";
import { createDeviceAction, updateDeviceAction } from "@/lib/actions/devices";

interface DeviceFormProps {
  initialData?: {
    id: string;
    brand: string;
    model: string;
    cpu: string;
    ram: string;
    storage: string;
    serialNumber: string;
    purchaseDate: Date | string;
    warrantyExpiry: Date | string;
  };
}

export function DeviceForm({ initialData }: DeviceFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form field states
  const [brand, setBrand] = useState(initialData?.brand || BRAND_OPTIONS[0]);
  const [model, setModel] = useState(initialData?.model || "");
  const [cpu, setCpu] = useState(initialData?.cpu || "");
  const [ram, setRam] = useState(initialData?.ram || RAM_OPTIONS[1]); // Default 16GB
  const [storage, setStorage] = useState(initialData?.storage || STORAGE_OPTIONS[1]); // Default 512GB SSD
  const [serialNumber, setSerialNumber] = useState(initialData?.serialNumber || "");

  const formatDateForInput = (d: Date | string | undefined) => {
    if (!d) return new Date().toISOString().split("T")[0];
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toISOString().split("T")[0];
  };

  const [purchaseDate, setPurchaseDate] = useState(
    formatDateForInput(initialData?.purchaseDate)
  );
  const [warrantyExpiry, setWarrantyExpiry] = useState(
    formatDateForInput(
      initialData?.warrantyExpiry ||
        new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000)
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("brand", brand);
    formData.append("model", model);
    formData.append("cpu", cpu);
    formData.append("ram", ram);
    formData.append("storage", storage);
    formData.append("serialNumber", serialNumber);
    formData.append("purchaseDate", purchaseDate);
    formData.append("warrantyExpiry", warrantyExpiry);

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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={isEditing ? `/devices/${initialData.id}` : "/devices"}
          className="p-2 rounded-lg bg-card border border-border hover:bg-muted text-muted-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "Edit Device Specs" : "Add New Device"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Update device specs or warranty details"
              : "Register a new laptop device into inventory"}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
        {/* Device Brand & Model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Brand
            </label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
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
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Model Name / Series
            </label>
            <input
              type="text"
              placeholder='e.g. MacBook Pro 16" or XPS 15'
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </div>

        {/* Hardware Specs Dropdowns */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Hardware Specifications (Dropdown Selects)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                CPU / Processor
              </label>
              <input
                type="text"
                placeholder="e.g. Apple M3 Max or Intel i7-13700H"
                value={cpu}
                onChange={(e) => setCpu(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                RAM
              </label>
              <select
                value={ram}
                onChange={(e) => setRam(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {RAM_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Storage
              </label>
              <select
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {STORAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Serial Number */}
        <div>
          <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
            Serial Number (Unique Identifier)
          </label>
          <input
            type="text"
            placeholder="e.g. C02G1234MD6R"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm font-mono bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        {/* Purchase & Warranty Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Purchase Date
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Warranty Expiration Date
            </label>
            <input
              type="date"
              value={warrantyExpiry}
              onChange={(e) => setWarrantyExpiry(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Link
            href={isEditing ? `/devices/${initialData.id}` : "/devices"}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : isEditing ? "Update Device" : "Add Device"}
          </button>
        </div>
      </form>
    </div>
  );
}
