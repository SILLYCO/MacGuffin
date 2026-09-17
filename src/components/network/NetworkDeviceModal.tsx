"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Network, Server, Wifi, Shield, Grid, HelpCircle, Loader2 } from "lucide-react";
import { NetworkDeviceType, NetworkDeviceStatus } from "@prisma/client";
import {
  NETWORK_DEVICE_TYPE_CONFIG,
  NETWORK_DEVICE_STATUS_CONFIG,
  NETWORK_BRAND_PRESETS,
  COMMON_SWITCH_PORT_PRESETS,
} from "@/lib/constants";
import { createNetworkDeviceAction, updateNetworkDeviceAction } from "@/lib/actions/network";

interface NetworkDeviceData {
  id?: string;
  name: string;
  deviceType: NetworkDeviceType;
  brand: string;
  model: string;
  totalPorts: number;
  ipAddress?: string | null;
  macAddress?: string | null;
  location?: string | null;
  status: NetworkDeviceStatus;
  notes?: string | null;
}

interface NetworkDeviceModalProps {
  device?: NetworkDeviceData | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NetworkDeviceModal({ device, onClose, onSuccess }: NetworkDeviceModalProps) {
  const [mounted, setMounted] = useState(false);
  const isEditing = !!device?.id;

  const [name, setName] = useState(device?.name || "");
  const [deviceType, setDeviceType] = useState<NetworkDeviceType>(device?.deviceType || NetworkDeviceType.SWITCH);
  const [brand, setBrand] = useState(device?.brand || "Cisco");
  const [customBrand, setCustomBrand] = useState("");
  const [isCustomBrand, setIsCustomBrand] = useState(
    device?.brand ? !NETWORK_BRAND_PRESETS.includes(device.brand as any) : false
  );
  const [model, setModel] = useState(device?.model || "");
  const [totalPorts, setTotalPorts] = useState<number>(device?.totalPorts || 24);
  const [ipAddress, setIpAddress] = useState(device?.ipAddress || "");
  const [macAddress, setMacAddress] = useState(device?.macAddress || "");
  const [location, setLocation] = useState(device?.location || "");
  const [status, setStatus] = useState<NetworkDeviceStatus>(device?.status || NetworkDeviceStatus.ONLINE);
  const [notes, setNotes] = useState(device?.notes || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (device?.brand && !NETWORK_BRAND_PRESETS.includes(device.brand as any)) {
      setIsCustomBrand(true);
      setCustomBrand(device.brand);
    }
  }, [device]);

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const finalBrand = isCustomBrand ? customBrand.trim() : brand;

    if (!name.trim()) {
      setError("Device name is required.");
      setLoading(false);
      return;
    }

    if (!finalBrand) {
      setError("Manufacturer / brand is required.");
      setLoading(false);
      return;
    }

    if (!model.trim()) {
      setError("Hardware model is required.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("deviceType", deviceType);
    formData.append("brand", finalBrand);
    formData.append("model", model.trim());
    formData.append("totalPorts", totalPorts.toString());
    formData.append("ipAddress", ipAddress.trim());
    formData.append("macAddress", macAddress.trim());
    formData.append("location", location.trim());
    formData.append("status", status);
    formData.append("notes", notes.trim());

    try {
      const res = isEditing
        ? await updateNetworkDeviceAction(device!.id!, formData)
        : await createNetworkDeviceAction(formData);

      if (res.error) {
        setError(res.error);
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (type: NetworkDeviceType) => {
    switch (type) {
      case NetworkDeviceType.ROUTER:
        return <Network className="w-5 h-5 text-indigo-400" />;
      case NetworkDeviceType.SWITCH:
        return <Server className="w-5 h-5 text-blue-400" />;
      case NetworkDeviceType.ACCESS_POINT:
        return <Wifi className="w-5 h-5 text-cyan-400" />;
      case NetworkDeviceType.FIREWALL:
        return <Shield className="w-5 h-5 text-rose-400" />;
      case NetworkDeviceType.PATCH_PANEL:
        return <Grid className="w-5 h-5 text-amber-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col glass-card border border-border/80 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="shrink-0 p-5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              {getDeviceIcon(deviceType)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {isEditing ? `Edit Network Device: ${device?.name}` : "Register Network Device"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Configure routers, switches, and patch panels for office network mapping
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="network-device-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          {/* Device Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Device Role / Hardware Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(NETWORK_DEVICE_TYPE_CONFIG) as NetworkDeviceType[]).map((type) => {
                const config = NETWORK_DEVICE_TYPE_CONFIG[type];
                const isSelected = deviceType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDeviceType(type)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary shadow-sm"
                        : "border-border/60 bg-card/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {getDeviceIcon(type)}
                    <span className="truncate">{config.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Device Name / Identifier *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Core Switch 1, Main Router"
                className="w-full px-3.5 py-2.5 bg-background border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Physical Location / Rack
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Server Rack A, Floor 2 Closet"
                className="w-full px-3.5 py-2.5 bg-background border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Brand / Manufacturer *
              </label>
              {!isCustomBrand ? (
                <div className="space-y-1.5">
                  <select
                    value={brand}
                    onChange={(e) => {
                      if (e.target.value === "Other") {
                        setIsCustomBrand(true);
                      } else {
                        setBrand(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-background border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {NETWORK_BRAND_PRESETS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="Enter custom brand..."
                    className="flex-1 px-3.5 py-2.5 bg-background border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomBrand(false)}
                    className="px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded-xl"
                  >
                    Presets
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Hardware Model *
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Catalyst 2960X, CCR2004"
                className="w-full px-3.5 py-2.5 bg-background border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Port Count Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-foreground">
                Total Physical Ports *
              </label>
              <span className="text-xs text-muted-foreground">{totalPorts} Ports Selected</span>
            </div>
            <div className="flex items-center gap-2">
              {COMMON_SWITCH_PORT_PRESETS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setTotalPorts(count)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    totalPorts === count
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "border-border/60 bg-card/40 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {count} Ports
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={96}
                value={totalPorts}
                onChange={(e) => setTotalPorts(parseInt(e.target.value, 10) || 1)}
                className="w-20 px-2.5 py-2 bg-background border border-border/80 rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                title="Custom port count"
              />
            </div>
          </div>

          {/* IP Address & MAC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Management IP Address
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g. 192.168.1.1"
                className="w-full px-3.5 py-2.5 bg-background border border-border/80 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                MAC Address
              </label>
              <input
                type="text"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                placeholder="e.g. 00:1A:2B:3C:4D:5E"
                className="w-full px-3.5 py-2.5 bg-background border border-border/80 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Operational Status */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Operational Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(NETWORK_DEVICE_STATUS_CONFIG) as NetworkDeviceStatus[]).map((st) => {
                const conf = NETWORK_DEVICE_STATUS_CONFIG[st];
                const isSelected = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-card border-primary text-foreground shadow-sm ring-1 ring-primary"
                        : "border-border/60 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                    <span>{conf.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Administrative Notes / Config
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. PoE budget 370W, Default VLAN 1, SFP+ trunk on Port 24"
              className="w-full px-3.5 py-2 bg-background border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="network-device-form"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-md shadow-primary/25 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEditing ? "Save Device" : "Register Device"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
