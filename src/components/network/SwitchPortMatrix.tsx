"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Server,
  Network,
  Wifi,
  Shield,
  Layers,
  ExternalLink,
  Plus,
  Settings,
  Unplug,
  Laptop,
  Printer as PrinterIcon,
  Cable,
  Trash2,
} from "lucide-react";
import { NetworkDeviceType, CableType } from "@prisma/client";
import {
  NETWORK_DEVICE_TYPE_CONFIG,
  CABLE_COLOR_PALETTE,
  CONNECTION_SPEED_OPTIONS,
} from "@/lib/constants";
import { PatchPortModal } from "./PatchPortModal";
import { NetworkDeviceModal } from "./NetworkDeviceModal";
import { unpatchNetworkPortAction } from "@/lib/actions/network";

interface SwitchPortMatrixProps {
  device: any;
  allNetworkDevices: any[];
  inventoryDevices: any[];
  printers: any[];
  onRefresh?: () => void;
  onSelectDevice?: (deviceId: string) => void;
  isIT: boolean;
}

export function SwitchPortMatrix({
  device,
  allNetworkDevices,
  inventoryDevices,
  printers,
  onRefresh,
  onSelectDevice,
  isIT,
}: SwitchPortMatrixProps) {
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [patchModalPort, setPatchModalPort] = useState<number | null>(null);
  const [isEditDeviceOpen, setIsEditDeviceOpen] = useState(false);
  const [unplugging, setUnplugging] = useState(false);

  // Map existing connections by port number (both outgoing cables and incoming trunks/uplinks)
  const connectionsByPort: Record<number, any> = {};

  // 1. Outgoing connections originating from this device's ports
  device.outgoingConnections?.forEach((c: any) => {
    connectionsByPort[c.fromPort] = {
      ...c,
      _direction: "OUTGOING",
      _isIncomingUplink: false,
    };
  });

  // 2. Incoming trunk connections targeting ports on this device
  device.incomingConnections?.forEach((c: any) => {
    if (c.targetNetworkPort) {
      connectionsByPort[c.targetNetworkPort] = {
        ...c,
        _direction: "INCOMING",
        _isIncomingUplink: true,
      };
    }
  });

  const usedPortsCount = Object.keys(connectionsByPort).length;
  const freePortsCount = Math.max(0, device.totalPorts - usedPortsCount);
  const utilizationPercent = Math.round((usedPortsCount / device.totalPorts) * 100);

  const firstFreePort =
    Array.from({ length: device.totalPorts }, (_, i) => i + 1).find(
      (p) => !connectionsByPort[p]
    ) || 1;

  const handleUnplug = async (connectionId: string, label: string) => {
    if (!confirm(`Are you sure you want to unplug ${label}?`)) return;

    setUnplugging(true);
    try {
      const res = await unpatchNetworkPortAction(connectionId);
      if (res.error) {
        alert(res.error);
      } else {
        setSelectedPort(null);
        onRefresh?.();
      }
    } catch (err: any) {
      alert(err.message || "Failed to unplug cable.");
    } finally {
      setUnplugging(false);
    }
  };

  // Split ports into upper row (odds) and lower row (evens) like physical enterprise switches
  const totalPorts = device.totalPorts;
  const oddPorts: number[] = [];
  const evenPorts: number[] = [];

  for (let i = 1; i <= totalPorts; i++) {
    if (i % 2 !== 0) {
      oddPorts.push(i);
    } else {
      evenPorts.push(i);
    }
  }

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
      default:
        return <Server className="w-5 h-5 text-slate-400" />;
    }
  };

  const selectedConn = selectedPort ? connectionsByPort[selectedPort] : null;

  const getCableHex = (colorName?: string | null) => {
    if (!colorName) return null;
    const match = CABLE_COLOR_PALETTE.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    );
    return match ? match.hex : null;
  };

  const renderPortButton = (p: number) => {
    const conn = connectionsByPort[p];
    const isSelected = selectedPort === p;
    const isIncomingUplink = !!conn?._isIncomingUplink;
    const isOutgoingUplink = !isIncomingUplink && !!conn?.targetNetworkDeviceId;
    const isUplink = isIncomingUplink || isOutgoingUplink;
    const isComputer = !isIncomingUplink && !!conn?.targetDeviceId;
    const isPrinter = !isIncomingUplink && !!conn?.targetPrinterId;
    const isEndpoint = !isIncomingUplink && !!conn?.endpointName;
    const isConnected = !!conn;

    // LED Status
    let ledColor = "bg-zinc-700/60";
    let portBorder = "border-border/60 hover:border-border";

    if (isConnected) {
      if (isUplink) {
        ledColor = "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]";
        portBorder = "border-purple-500/40 bg-purple-500/5";
      } else if (isComputer) {
        ledColor = "bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]";
        portBorder = "border-emerald-500/40 bg-emerald-500/5";
      } else if (isPrinter) {
        ledColor = "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]";
        portBorder = "border-orange-500/40 bg-orange-500/5";
      } else {
        ledColor = "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]";
        portBorder = "border-cyan-500/40 bg-cyan-500/5";
      }
    }

    const cableHex = getCableHex(conn?.cableColor);

    const portTitle = conn
      ? isIncomingUplink
        ? `Port ${p}: Uplink In from ${conn.fromDevice?.name || "Router/Switch"} (Port ${conn.fromPort})`
        : `Port ${p}: ${conn.targetNetworkDevice?.name ? `Uplink Out to ${conn.targetNetworkDevice.name}` : conn.targetDevice?.brand ? `${conn.targetDevice.brand} ${conn.targetDevice.model}` : conn.targetPrinter?.model ? `${conn.targetPrinter.brand} ${conn.targetPrinter.model}` : conn.endpointName || "Connected"}`
      : `Port ${p}: Available`;

    return (
      <button
        key={p}
        type="button"
        onClick={() => setSelectedPort(p === selectedPort ? null : p)}
        className={`relative flex flex-col items-center justify-between w-9 h-12 sm:w-10 sm:h-14 rounded-lg border text-center transition-all p-1 group shrink-0 ${portBorder} ${
          isSelected ? "ring-2 ring-primary border-primary bg-primary/10 shadow-lg scale-105 z-10" : ""
        }`}
        title={portTitle}
      >
        {/* Top RJ45 Notch & LED */}
        <div className="w-full flex items-center justify-between px-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${ledColor} transition-all`} />
          {cableHex && (
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: cableHex }}
              title={`Cable Color: ${conn.cableColor}`}
            />
          )}
        </div>

        {/* Port RJ45 Plastic Plug Representation */}
        <div className="w-5 h-4.5 sm:w-6 sm:h-5 rounded bg-zinc-950/80 dark:bg-black/90 border border-zinc-800 flex items-center justify-center relative overflow-hidden">
          <div className="w-3.5 h-1.5 bg-zinc-800 rounded-b-xs border-b border-zinc-700/80" />
          {isConnected && (
            <div className={`absolute inset-x-0 bottom-0 h-0.5 ${isUplink ? "bg-purple-500" : "bg-primary/80"}`} />
          )}
        </div>

        {/* Port Number */}
        <span className="text-[10px] font-mono font-extrabold text-foreground/80 leading-none">
          {p}
        </span>
      </button>
    );
  };

  return (
    <div className="glass-card border border-border/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Switch Header Bar */}
      <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            {getDeviceIcon(device.deviceType)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">{device.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border/60">
                {device.brand} {device.model}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
              {device.ipAddress && (
                <span className="font-mono text-foreground/90 font-medium">
                  IP: {device.ipAddress}
                </span>
              )}
              {device.location && <span>📍 {device.location}</span>}
              <span className="font-semibold text-foreground">
                {usedPortsCount}/{device.totalPorts} ports used ({utilizationPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isIT && (
            <button
              onClick={() => setIsEditDeviceOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl border border-border/60 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Config</span>
            </button>
          )}

          {isIT && (
            <button
              onClick={() =>
                setPatchModalPort(
                  selectedConn?._isIncomingUplink ? firstFreePort : (selectedPort || firstFreePort)
                )
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-md shadow-primary/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Patch Port</span>
            </button>
          )}
        </div>
      </div>

      {/* Switch Rackmount Chassis Front Panel */}
      <div className="p-4 sm:p-6 bg-gradient-to-b from-zinc-950/80 via-zinc-900/90 to-zinc-950/90 border-y border-zinc-800">
        <div className="max-w-full overflow-x-auto pb-3 pt-1 scrollbar-thin">
          <div className="inline-block min-w-full">
            {/* Port Matrix Chassis Wrapper */}
            <div className="p-3 sm:p-4 rounded-xl bg-zinc-950 border-2 border-zinc-800/90 shadow-2xl space-y-2">
              {/* Row 1: Odd Ports (1, 3, 5, 7...) */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="w-6 text-[10px] font-mono text-zinc-500 font-bold text-right pr-1 select-none">
                  Odd
                </span>
                {oddPorts.map(renderPortButton)}
              </div>

              {/* Row 2: Even Ports (2, 4, 6, 8...) */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="w-6 text-[10px] font-mono text-zinc-500 font-bold text-right pr-1 select-none">
                  Even
                </span>
                {evenPorts.map(renderPortButton)}
              </div>
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pt-3 px-1 border-t border-zinc-800/80 mt-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
              <span>Computer / PC</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]" />
              <span>Printer</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
              <span>Switch Trunk / Uplink</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
              <span>Wall Jack / Outlet</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-700" />
              <span>Available</span>
            </span>
          </div>

          <div className="text-[11px] text-zinc-400">
            Click any port to view connected asset or patch a cable
          </div>
        </div>
      </div>

      {/* Selected Port Inspector Panel */}
      {selectedPort && (
        <div className="p-4 sm:p-5 bg-card/60 border-t border-border/70 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary font-mono text-xs font-bold">
                  Port {selectedPort}
                </span>

                {selectedConn?._isIncomingUplink && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <span>⬇ Uplink In</span>
                  </span>
                )}

                {selectedConn && !selectedConn._isIncomingUplink && selectedConn.targetNetworkDeviceId && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <span>⬆ Uplink Out</span>
                  </span>
                )}

                <h4 className="text-sm font-bold text-foreground">
                  {selectedConn ? (
                    <span>
                      {selectedConn._isIncomingUplink
                        ? `Uplink In from ${selectedConn.fromDevice?.name || "Router/Switch"} (Port ${selectedConn.fromPort})`
                        : selectedConn.targetNetworkDevice?.name
                        ? `${selectedConn.targetNetworkDevice.name} ${selectedConn.targetNetworkPort ? `(Port ${selectedConn.targetNetworkPort})` : ""}`
                        : selectedConn.targetDevice
                        ? `${selectedConn.targetDevice.brand} ${selectedConn.targetDevice.model}`
                        : selectedConn.targetPrinter
                        ? `${selectedConn.targetPrinter.brand} ${selectedConn.targetPrinter.model}`
                        : selectedConn.endpointName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground font-normal">
                      Empty / Available for Patching
                    </span>
                  )}
                </h4>
              </div>

              {selectedConn && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
                  <span>
                    Cable: <strong className="text-foreground">{selectedConn.cableType}</strong>
                  </span>
                  {selectedConn.cableColor && (
                    <span className="flex items-center gap-1">
                      <span>Color:</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block border border-border/80"
                        style={{ backgroundColor: getCableHex(selectedConn.cableColor) || "currentColor" }}
                      />
                      <strong className="text-foreground">{selectedConn.cableColor}</strong>
                    </span>
                  )}
                  <span>
                    Speed: <strong className="text-foreground">{CONNECTION_SPEED_OPTIONS[selectedConn.speed]?.short || "1G"}</strong>
                  </span>
                  {selectedConn.vlan && (
                    <span>
                      VLAN: <strong className="text-foreground">{selectedConn.vlan}</strong>
                    </span>
                  )}
                  {selectedConn.wallOutlet && (
                    <span>
                      Outlet: <strong className="text-foreground">{selectedConn.wallOutlet}</strong>
                    </span>
                  )}
                  {selectedConn.notes && (
                    <span className="italic text-foreground/80">"{selectedConn.notes}"</span>
                  )}
                </div>
              )}
            </div>

            {/* Actions for Selected Port */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* If incoming uplink: allow jump to source switch or unplug */}
              {selectedConn?._isIncomingUplink && (
                <>
                  {onSelectDevice && selectedConn.fromDeviceId && (
                    <button
                      type="button"
                      onClick={() => onSelectDevice(selectedConn.fromDeviceId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:text-primary-foreground hover:bg-primary/90 border border-primary/30 rounded-xl transition-all"
                    >
                      <Server className="w-3.5 h-3.5" />
                      <span>View {selectedConn.fromDevice?.name || "Source Device"}</span>
                    </button>
                  )}

                  {isIT && (
                    <button
                      type="button"
                      onClick={() =>
                        handleUnplug(
                          selectedConn.id,
                          `Uplink cable from ${selectedConn.fromDevice?.name || "Device"} (Port ${selectedConn.fromPort})`
                        )
                      }
                      disabled={unplugging}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 border border-destructive/30 rounded-xl transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Unplug Link</span>
                    </button>
                  )}
                </>
              )}

              {/* If outgoing target device */}
              {selectedConn && !selectedConn._isIncomingUplink && selectedConn.targetDeviceId && (
                <Link
                  href={`/devices/${selectedConn.targetDeviceId}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:text-primary-foreground hover:bg-primary/90 border border-primary/30 rounded-xl transition-all"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>View Computer</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              )}

              {/* If outgoing target printer */}
              {selectedConn && !selectedConn._isIncomingUplink && selectedConn.targetPrinterId && (
                <Link
                  href={`/printers/${selectedConn.targetPrinterId}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:text-primary-foreground hover:bg-primary/90 border border-primary/30 rounded-xl transition-all"
                >
                  <PrinterIcon className="w-3.5 h-3.5" />
                  <span>View Printer</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              )}

              {/* If outgoing trunk to another switch */}
              {selectedConn && !selectedConn._isIncomingUplink && selectedConn.targetNetworkDeviceId && onSelectDevice && (
                <button
                  type="button"
                  onClick={() => onSelectDevice(selectedConn.targetNetworkDeviceId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:text-primary-foreground hover:bg-primary/90 border border-primary/30 rounded-xl transition-all"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>View {selectedConn.targetNetworkDevice?.name || "Target Switch"}</span>
                </button>
              )}

              {/* Outgoing Edit Patch or Plug Cable */}
              {isIT && !selectedConn?._isIncomingUplink && (
                <button
                  onClick={() => setPatchModalPort(selectedPort)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-sm"
                >
                  <Cable className="w-3.5 h-3.5" />
                  <span>{selectedConn ? "Edit Patch" : "Plug Cable"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {patchModalPort !== null && (
        <PatchPortModal
          fromDevice={device}
          initialPort={patchModalPort}
          existingConnection={connectionsByPort[patchModalPort]}
          networkDevices={allNetworkDevices}
          inventoryDevices={inventoryDevices}
          printers={printers}
          onClose={() => setPatchModalPort(null)}
          onSuccess={() => {
            setPatchModalPort(null);
            onRefresh?.();
          }}
        />
      )}

      {isEditDeviceOpen && (
        <NetworkDeviceModal
          device={device}
          onClose={() => setIsEditDeviceOpen(false)}
          onSuccess={() => {
            setIsEditDeviceOpen(false);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
