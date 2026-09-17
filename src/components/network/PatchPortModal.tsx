"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Cable,
  Server,
  Laptop,
  Printer as PrinterIcon,
  Layers,
  Trash2,
  Check,
  Search,
  Loader2,
  Plug,
} from "lucide-react";
import { CableType, ConnectionSpeed } from "@prisma/client";
import {
  CABLE_TYPE_OPTIONS,
  CONNECTION_SPEED_OPTIONS,
  CABLE_COLOR_PALETTE,
} from "@/lib/constants";
import {
  patchNetworkPortAction,
  unpatchNetworkPortAction,
} from "@/lib/actions/network";
import type { PatchPortInput } from "@/types/network";

interface PatchPortModalProps {
  fromDevice: {
    id: string;
    name: string;
    totalPorts: number;
  };
  initialPort: number;
  existingConnection?: any | null;
  networkDevices: any[];
  inventoryDevices: any[];
  printers: any[];
  onClose: () => void;
  onSuccess?: () => void;
}

export function PatchPortModal({
  fromDevice,
  initialPort,
  existingConnection,
  networkDevices,
  inventoryDevices,
  printers,
  onClose,
  onSuccess,
}: PatchPortModalProps) {
  const [mounted, setMounted] = useState(false);
  const [port, setPort] = useState<number>(initialPort);
  const [portLabel, setPortLabel] = useState<string>(
    existingConnection?.fromPortLabel || `Port ${initialPort}`
  );

  // Target Type
  const [targetType, setTargetType] = useState<"NETWORK_DEVICE" | "COMPUTER" | "PRINTER" | "ENDPOINT">(
    existingConnection?.targetNetworkDeviceId
      ? "NETWORK_DEVICE"
      : existingConnection?.targetDeviceId
      ? "COMPUTER"
      : existingConnection?.targetPrinterId
      ? "PRINTER"
      : "COMPUTER"
  );

  // Target selections
  const [targetNetworkDeviceId, setTargetNetworkDeviceId] = useState<string>(
    existingConnection?.targetNetworkDeviceId || ""
  );
  const [targetNetworkPort, setTargetNetworkPort] = useState<string>(
    existingConnection?.targetNetworkPort?.toString() || "1"
  );
  const [targetDeviceId, setTargetDeviceId] = useState<string>(
    existingConnection?.targetDeviceId || ""
  );
  const [targetPrinterId, setTargetPrinterId] = useState<string>(
    existingConnection?.targetPrinterId || ""
  );
  const [endpointName, setEndpointName] = useState<string>(
    existingConnection?.endpointName || ""
  );
  const [endpointType, setEndpointType] = useState<string>(
    existingConnection?.endpointType || "WALL_JACK"
  );

  // Link specs
  const [cableType, setCableType] = useState<CableType>(
    existingConnection?.cableType || CableType.CAT6
  );
  const [cableColor, setCableColor] = useState<string>(
    existingConnection?.cableColor || "Blue"
  );
  const [speed, setSpeed] = useState<ConnectionSpeed>(
    existingConnection?.speed || ConnectionSpeed.SPEED_1_GBPS
  );
  const [vlan, setVlan] = useState<string>(existingConnection?.vlan || "");
  const [wallOutlet, setWallOutlet] = useState<string>(
    existingConnection?.wallOutlet || ""
  );
  const [notes, setNotes] = useState<string>(existingConnection?.notes || "");

  // Search queries for picker dropdowns
  const [deviceSearch, setDeviceSearch] = useState("");
  const [printerSearch, setPrinterSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [unpatching, setUnpatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Filter other network devices (exclude current switch)
  const availableTargetSwitches = networkDevices.filter((d) => d.id !== fromDevice.id);

  // Filter inventory computers
  const filteredDevices = inventoryDevices.filter((d) => {
    const q = deviceSearch.toLowerCase();
    const assignedName = d.assignments?.[0]?.employee?.name?.toLowerCase() || "";
    return (
      d.brand.toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q) ||
      d.serialNumber.toLowerCase().includes(q) ||
      assignedName.includes(q)
    );
  });

  // Filter printers
  const filteredPrinters = printers.filter((p) => {
    const q = printerSearch.toLowerCase();
    return (
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      (p.ipAddress && p.ipAddress.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q))
    );
  });

  // Current source switch full data
  const currentFullDevice =
    networkDevices.find((d) => d.id === fromDevice.id) || fromDevice;

  const incomingByPort: Record<number, any> = {};
  currentFullDevice.incomingConnections?.forEach((c: any) => {
    if (c.targetNetworkPort) {
      incomingByPort[c.targetNetworkPort] = c;
    }
  });

  const outgoingByPort: Record<number, any> = {};
  currentFullDevice.outgoingConnections?.forEach((c: any) => {
    outgoingByPort[c.fromPort] = c;
  });

  const currentPortIncoming = incomingByPort[port];

  // Selected target switch
  const selectedTargetDevice = availableTargetSwitches.find(
    (d) => d.id === targetNetworkDeviceId
  );

  const targetOccupiedPorts = new Set<number>();
  if (selectedTargetDevice) {
    selectedTargetDevice.outgoingConnections?.forEach((c: any) =>
      targetOccupiedPorts.add(c.fromPort)
    );
    selectedTargetDevice.incomingConnections?.forEach((c: any) => {
      if (c.targetNetworkPort) targetOccupiedPorts.add(c.targetNetworkPort);
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: PatchPortInput = {
      fromDeviceId: fromDevice.id,
      fromPort: port,
      fromPortLabel: portLabel.trim() || `Port ${port}`,
      targetType,
      targetNetworkDeviceId: targetType === "NETWORK_DEVICE" ? targetNetworkDeviceId : null,
      targetNetworkPort:
        targetType === "NETWORK_DEVICE" && targetNetworkPort ? parseInt(targetNetworkPort, 10) : null,
      targetDeviceId: targetType === "COMPUTER" ? targetDeviceId : null,
      targetPrinterId: targetType === "PRINTER" ? targetPrinterId : null,
      endpointName: targetType === "ENDPOINT" ? endpointName.trim() : null,
      endpointType: targetType === "ENDPOINT" ? endpointType : null,
      cableType,
      cableColor,
      speed,
      vlan: vlan.trim() || null,
      wallOutlet: wallOutlet.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      const res = await patchNetworkPortAction(payload);
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

  const handleUnpatch = async () => {
    if (!existingConnection?.id) return;
    if (!confirm(`Are you sure you want to unplug Port ${port}?`)) return;

    setUnpatching(true);
    setError(null);
    try {
      const res = await unpatchNetworkPortAction(existingConnection.id);
      if (res.error) {
        setError(res.error);
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to unpatch port.");
    } finally {
      setUnpatching(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col glass-card border border-border/80 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="shrink-0 p-5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Plug className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>{existingConnection ? "Configure Port" : "Patch Port"}</span>
                <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary font-mono text-xs font-extrabold">
                  {fromDevice.name} : Port {port}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Connect an Ethernet or Fiber cable between this switch and an office endpoint
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

        {/* Body */}
        <form id="patch-port-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          {/* Port Number & Custom Label */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-muted/20 border border-border/50">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Port Number
              </label>
              <select
                value={port}
                onChange={(e) => {
                  const newPort = parseInt(e.target.value, 10);
                  setPort(newPort);
                  if (portLabel.startsWith("Port ")) {
                    setPortLabel(`Port ${newPort}`);
                  }
                }}
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {Array.from({ length: fromDevice.totalPorts }, (_, i) => i + 1).map((p) => {
                  const inc = incomingByPort[p];
                  const outg = outgoingByPort[p];
                  let label = `Port ${p}`;
                  if (inc) {
                    label += ` [Uplink In from ${inc.fromDevice?.name || "Device"} P${inc.fromPort}]`;
                  } else if (outg && outg.fromPort !== initialPort) {
                    const peer =
                      outg.targetNetworkDevice?.name ||
                      outg.targetDevice?.brand ||
                      outg.targetPrinter?.model ||
                      outg.endpointName ||
                      "Patched";
                    label += ` [In use: ${peer}]`;
                  }
                  return (
                    <option key={p} value={p} disabled={!!inc}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Port Faceplate Label
              </label>
              <input
                type="text"
                value={portLabel}
                onChange={(e) => setPortLabel(e.target.value)}
                placeholder="e.g. Port 1, SFP+ Uplink"
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {currentPortIncoming && (
              <div className="col-span-1 sm:col-span-2 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  Port {port} is occupied by an incoming uplink cable from <strong>{currentPortIncoming.fromDevice?.name || "Device"} (Port {currentPortIncoming.fromPort})</strong>. Unplug that cable first before patching an outgoing cable here.
                </span>
              </div>
            )}
          </div>

          {/* Target Type Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Connected Target Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTargetType("COMPUTER")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold gap-1.5 transition-all ${
                  targetType === "COMPUTER"
                    ? "bg-primary/10 border-primary text-primary shadow-sm"
                    : "border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <Laptop className="w-5 h-5" />
                <span>Computer / PC</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType("PRINTER")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold gap-1.5 transition-all ${
                  targetType === "PRINTER"
                    ? "bg-primary/10 border-primary text-primary shadow-sm"
                    : "border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <PrinterIcon className="w-5 h-5" />
                <span>Network Printer</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType("NETWORK_DEVICE")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold gap-1.5 transition-all ${
                  targetType === "NETWORK_DEVICE"
                    ? "bg-primary/10 border-primary text-primary shadow-sm"
                    : "border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <Server className="w-5 h-5" />
                <span>Switch / Uplink</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType("ENDPOINT")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold gap-1.5 transition-all ${
                  targetType === "ENDPOINT"
                    ? "bg-primary/10 border-primary text-primary shadow-sm"
                    : "border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <Layers className="w-5 h-5" />
                <span>Wall Jack / TV</span>
              </button>
            </div>
          </div>

          {/* Target Selection View */}
          <div className="p-4 rounded-xl border border-border/70 bg-card/40 space-y-3">
            {targetType === "COMPUTER" && (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Select Office Computer / Workstation *
                </label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={deviceSearch}
                    onChange={(e) => setDeviceSearch(e.target.value)}
                    placeholder="Search by brand, model, employee name..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto space-y-1 border border-border/60 rounded-xl p-1.5 bg-background/50">
                  {filteredDevices.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No matching devices found
                    </div>
                  ) : (
                    filteredDevices.map((dev) => {
                      const isSelected = targetDeviceId === dev.id;
                      const emp = dev.assignments?.[0]?.employee;
                      return (
                        <button
                          key={dev.id}
                          type="button"
                          onClick={() => setTargetDeviceId(dev.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-bold shadow-sm"
                              : "hover:bg-muted/60 text-foreground"
                          }`}
                        >
                          <div>
                            <span className="font-semibold">
                              {dev.brand} {dev.model}
                            </span>
                            <span className={`ml-2 text-[11px] font-mono ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                              S/N: {dev.serialNumber}
                            </span>
                          </div>
                          {emp && (
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                            }`}>
                              {emp.name} ({emp.department})
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {targetType === "PRINTER" && (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Select Network Printer *
                </label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={printerSearch}
                    onChange={(e) => setPrinterSearch(e.target.value)}
                    placeholder="Search by brand, IP address, location..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto space-y-1 border border-border/60 rounded-xl p-1.5 bg-background/50">
                  {filteredPrinters.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No matching network printers found
                    </div>
                  ) : (
                    filteredPrinters.map((p) => {
                      const isSelected = targetPrinterId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setTargetPrinterId(p.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-bold shadow-sm"
                              : "hover:bg-muted/60 text-foreground"
                          }`}
                        >
                          <div>
                            <span className="font-semibold">
                              {p.brand} {p.model}
                            </span>
                            <span className={`ml-2 text-[11px] font-mono ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                              IP: {p.ipAddress}
                            </span>
                          </div>
                          {p.location && (
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                            }`}>
                              {p.location}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {targetType === "NETWORK_DEVICE" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Target Switch / Router (Trunk / Uplink) *
                  </label>
                  {availableTargetSwitches.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 border border-border/60 rounded-lg">
                      No other network switches registered yet. Register a second switch first to connect them.
                    </p>
                  ) : (
                    <select
                      value={targetNetworkDeviceId}
                      onChange={(e) => {
                        setTargetNetworkDeviceId(e.target.value);
                        setTargetNetworkPort("");
                      }}
                      className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">-- Choose Target Switch / Router --</option>
                      {availableTargetSwitches.map((dev) => (
                        <option key={dev.id} value={dev.id}>
                          {dev.name} ({dev.brand} {dev.model} - {dev.totalPorts} ports)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Destination Port on Target Device
                  </label>
                  {selectedTargetDevice ? (
                    <select
                      value={targetNetworkPort || ""}
                      onChange={(e) => setTargetNetworkPort(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">-- Choose Target Port --</option>
                      {Array.from({ length: selectedTargetDevice.totalPorts }, (_, i) => i + 1).map((p) => {
                        const isOccupied = targetOccupiedPorts.has(p);
                        const isCurrentConn =
                          existingConnection?.targetNetworkDeviceId === targetNetworkDeviceId &&
                          existingConnection?.targetNetworkPort === p;
                        return (
                          <option key={p} value={p} disabled={isOccupied && !isCurrentConn}>
                            Port {p} {isOccupied && !isCurrentConn ? "(Occupied)" : "(Available)"}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      max={96}
                      value={targetNetworkPort}
                      onChange={(e) => setTargetNetworkPort(e.target.value)}
                      placeholder="Choose target switch first"
                      disabled={!targetNetworkDeviceId}
                      className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                    />
                  )}
                </div>
              </div>
            )}

            {targetType === "ENDPOINT" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Endpoint Label / Destination *
                  </label>
                  <input
                    type="text"
                    required
                    value={endpointName}
                    onChange={(e) => setEndpointName(e.target.value)}
                    placeholder="e.g. Wall Jack 3B, Meeting Room TV"
                    className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Endpoint Category
                  </label>
                  <select
                    value={endpointType}
                    onChange={(e) => setEndpointType(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="WALL_JACK">Wall Plate / RJ45 Jack</option>
                    <option value="SMART_TV">Smart TV / Conference Polycom</option>
                    <option value="CCTV">Security Camera (CCTV)</option>
                    <option value="VOIP_PHONE">VoIP IP Phone</option>
                    <option value="ACCESS_POINT">WiFi Access Point</option>
                    <option value="SERVER">Standalone Baremetal Server</option>
                    <option value="OTHER">Other Custom Hardware</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Cable & Link Specifications */}
          <div className="space-y-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Physical Cable & Port Configuration
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Cable Type *
                </label>
                <select
                  value={cableType}
                  onChange={(e) => setCableType(e.target.value as CableType)}
                  className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {Object.entries(CABLE_TYPE_OPTIONS).map(([key, opt]) => (
                    <option key={key} value={key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Link Speed *
                </label>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value as ConnectionSpeed)}
                  className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {Object.entries(CONNECTION_SPEED_OPTIONS).map(([key, opt]) => (
                    <option key={key} value={key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cable Color Picker */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Patch Cable Color Coding
              </label>
              <div className="flex flex-wrap gap-2">
                {CABLE_COLOR_PALETTE.map((col) => {
                  const isSelected = cableColor === col.name;
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => setCableColor(col.name)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-foreground/80 bg-foreground/10 ring-1 ring-foreground/40 text-foreground"
                          : "border-border/60 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${col.bg} shrink-0`} />
                      <span>{col.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* VLAN & Wall Outlet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  VLAN ID / Tag
                </label>
                <input
                  type="text"
                  value={vlan}
                  onChange={(e) => setVlan(e.target.value)}
                  placeholder="e.g. 10 (Corporate), 20 (Voice), Trunk"
                  className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Office Wall Outlet Tag
                </label>
                <input
                  type="text"
                  value={wallOutlet}
                  onChange={(e) => setWallOutlet(e.target.value)}
                  placeholder="e.g. Plate 2A - Room 204"
                  className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Patch Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Dropped through ceiling tray, PoE enabled"
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
          {existingConnection ? (
            <button
              type="button"
              onClick={handleUnpatch}
              disabled={loading || unpatching}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-colors border border-destructive/20 disabled:opacity-50"
            >
              {unpatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Unplug Port</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || unpatching}
              className="px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="patch-port-form"
              disabled={loading || unpatching || !!currentPortIncoming}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-md shadow-primary/25 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{existingConnection ? "Update Port Connection" : "Plug Cable"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
