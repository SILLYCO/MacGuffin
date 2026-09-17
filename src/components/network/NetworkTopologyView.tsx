"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Network,
  Server,
  Laptop,
  Printer as PrinterIcon,
  Wifi,
  Shield,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Filter,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Cable,
  Plug,
} from "lucide-react";
import { NetworkDeviceType, CableType } from "@prisma/client";
import {
  NETWORK_DEVICE_TYPE_CONFIG,
  CABLE_COLOR_PALETTE,
  CONNECTION_SPEED_OPTIONS,
} from "@/lib/constants";

interface NetworkTopologyViewProps {
  networkDevices: any[];
  inventoryDevices: any[];
  printers: any[];
  isIT: boolean;
  onOpenDeviceModal?: () => void;
}

export function NetworkTopologyView({
  networkDevices,
  inventoryDevices,
  printers,
  isIT,
  onOpenDeviceModal,
}: NetworkTopologyViewProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [showEndpoints, setShowEndpoints] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const hasDraggedRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.4));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel non-passive zoom listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
      setZoom((prev) => Math.min(Math.max(prev + zoomDelta, 0.4), 2.2));
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  // Pointer drag panning with capture (works seamlessly for mouse and touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    // Don't drag if clicking buttons or input controls
    if (target.closest("button, a, input, select, textarea")) {
      return;
    }

    hasDraggedRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
    const dy = Math.abs(e.clientY - dragStartPosRef.current.y);
    if (dx > 4 || dy > 4) {
      hasDraggedRef.current = true;
    }

    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Identify root devices (Gateways/Routers or devices with no incoming trunks)
  const allTargetDeviceIds = new Set<string>();
  networkDevices.forEach((dev) => {
    dev.outgoingConnections?.forEach((c: any) => {
      if (c.targetNetworkDeviceId) {
        allTargetDeviceIds.add(c.targetNetworkDeviceId);
      }
    });
  });

  // Root devices: Routers first, or devices that are not targets of another device
  let rootDevices = networkDevices.filter(
    (dev) => dev.deviceType === NetworkDeviceType.ROUTER || !allTargetDeviceIds.has(dev.id)
  );

  if (rootDevices.length === 0 && networkDevices.length > 0) {
    rootDevices = [networkDevices[0]];
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

  const getCableHex = (colorName?: string | null) => {
    if (!colorName) return "#3b82f6"; // default blue
    const match = CABLE_COLOR_PALETTE.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    );
    return match ? match.hex : "#3b82f6";
  };

  // Render a network tree node recursively
  const renderDeviceTree = (dev: any, depth = 0, visited = new Set<string>()): React.ReactNode => {
    if (visited.has(dev.id)) return null;
    visited.add(dev.id);

    const isCollapsed = !!collapsedNodes[dev.id];
    const isSelected = selectedNode?.id === dev.id;

    // Outgoing uplinks to other switches
    const uplinks = (dev.outgoingConnections || []).filter(
      (c: any) => c.targetNetworkDevice && networkDevices.some((d) => d.id === c.targetNetworkDeviceId)
    );

    // Outgoing endpoint connections (PCs, printers, wall jacks)
    const endpoints = (dev.outgoingConnections || []).filter(
      (c: any) => !c.targetNetworkDeviceId
    );

    const isMatch =
      searchQuery &&
      (dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dev.ipAddress && dev.ipAddress.includes(searchQuery)) ||
        endpoints.some((e: any) =>
          (e.targetDevice?.brand || e.targetPrinter?.model || e.endpointName || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        ));

    const occupiedPortsCount = new Set([
      ...(dev.outgoingConnections || []).map((c: any) => c.fromPort),
      ...(dev.incomingConnections || [])
        .filter((c: any) => c.targetNetworkPort)
        .map((c: any) => c.targetNetworkPort),
    ]).size;

    return (
      <div key={dev.id} className="flex flex-col items-center">
        {/* Main Device Card */}
        <div
          onClick={() => {
            if (hasDraggedRef.current) return;
            setSelectedNode(dev);
          }}
          className={`relative group cursor-pointer transition-all duration-200 rounded-2xl p-4 w-72 glass-card border shadow-xl ${
            isSelected
              ? "ring-2 ring-primary border-primary bg-primary/10 shadow-primary/20 scale-102 z-20"
              : isMatch
              ? "border-amber-400 ring-2 ring-amber-400/50 bg-amber-500/10"
              : "border-border/80 hover:border-primary/60 hover:shadow-2xl"
          }`}
        >
          {/* Top Row: Icon + Type + Collapse Button */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                {getDeviceIcon(dev.deviceType)}
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                {dev.deviceType}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  dev.status === "ONLINE"
                    ? "bg-emerald-500 animate-pulse"
                    : dev.status === "MAINTENANCE"
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                title={`Status: ${dev.status}`}
              />

              {(uplinks.length > 0 || (showEndpoints && endpoints.length > 0)) && (
                <button
                  type="button"
                  onClick={(e) => toggleCollapse(dev.id, e)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title={isCollapsed ? "Expand Children" : "Collapse Children"}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Name & Model */}
          <h4 className="text-sm font-extrabold text-foreground truncate" title={dev.name}>
            {dev.name}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {dev.brand} {dev.model}
          </p>

          {/* IP & Port Badges */}
          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] font-medium text-foreground/90 bg-muted/60 px-2 py-0.5 rounded-md">
              {dev.ipAddress || "No IP set"}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {occupiedPortsCount} / {dev.totalPorts} ports
            </span>
          </div>

          {/* Location */}
          {dev.location && (
            <div className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
              <span>📍</span>
              <span className="truncate">{dev.location}</span>
            </div>
          )}
        </div>

        {/* Children (Uplink Switches + Endpoints) */}
        {!isCollapsed && (
          <div className="flex flex-col items-center">
            {/* Trunk Line Down */}
            {(uplinks.length > 0 || (showEndpoints && endpoints.length > 0)) && (
              <div className="w-0.5 h-8 bg-gradient-to-b from-primary/80 to-border/80" />
            )}

            {/* Downstream Connected Switches (Inter-Switch Trunks) */}
            {uplinks.length > 0 && (
              <div className="relative pt-4">
                {/* Horizontal branch line */}
                {uplinks.length > 1 && (
                  <div className="absolute top-0 inset-x-8 h-0.5 bg-border/80" />
                )}

                <div className="flex items-start justify-center gap-8 sm:gap-12">
                  {uplinks.map((up: any) => {
                    const targetDev = networkDevices.find(
                      (d) => d.id === up.targetNetworkDeviceId
                    );
                    if (!targetDev) return null;

                    const cableColorHex = getCableHex(up.cableColor);

                    return (
                      <div key={up.id} className="flex flex-col items-center">
                        {/* Link Label Tag */}
                        <div
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold mb-3 border shadow-sm flex items-center gap-1"
                          style={{ borderColor: cableColorHex, color: cableColorHex }}
                        >
                          <Cable className="w-3 h-3" />
                          <span>
                            P{up.fromPort} ➔ P{up.targetNetworkPort || 1} ({up.vlan || "Trunk"})
                          </span>
                        </div>

                        {/* Recurse on target switch */}
                        {renderDeviceTree(targetDev, depth + 1, visited)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Downstream Endpoints (Computers, Printers, Wall Jacks) */}
            {showEndpoints && endpoints.length > 0 && (
              <div className="mt-4 flex flex-col items-center">
                <div className="px-2.5 py-1 rounded-full bg-muted/60 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-border/50 mb-3 flex items-center gap-1.5">
                  <Plug className="w-3 h-3 text-primary" />
                  <span>{endpoints.length} Office Drops / Endpoints</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-w-2xl">
                  {endpoints.map((ep: any) => {
                    const cableHex = getCableHex(ep.cableColor);
                    const isComputer = !!ep.targetDevice;
                    const isPrinter = !!ep.targetPrinter;

                    return (
                      <div
                        key={ep.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasDraggedRef.current) return;
                          setSelectedNode({
                            ...ep,
                            isEndpoint: true,
                            parentDeviceName: dev.name,
                          });
                        }}
                        className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-border/70 bg-card/40 hover:bg-card hover:border-primary/50 transition-all text-xs cursor-pointer shadow-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded-lg bg-muted border border-border/60 shrink-0">
                            {isComputer ? (
                              <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                            ) : isPrinter ? (
                              <PrinterIcon className="w-3.5 h-3.5 text-orange-400" />
                            ) : (
                              <Layers className="w-3.5 h-3.5 text-cyan-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">
                              {isComputer
                                ? `${ep.targetDevice.brand} ${ep.targetDevice.model}`
                                : isPrinter
                                ? `${ep.targetPrinter.brand} ${ep.targetPrinter.model}`
                                : ep.endpointName}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              Port {ep.fromPort} • {ep.vlan ? `VLAN ${ep.vlan}` : ep.cableType}
                            </p>
                          </div>
                        </div>

                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cableHex }}
                          title={`Cable: ${ep.cableColor || "Standard"}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="glass-card p-3 sm:p-4 rounded-2xl border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search switches, PCs, printers..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* View Toggles & Zoom Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={() => setShowEndpoints(!showEndpoints)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              showEndpoints
                ? "bg-primary/10 border-primary text-primary"
                : "border-border/60 text-muted-foreground hover:bg-muted/40"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>{showEndpoints ? "Hide Endpoints" : "Show Endpoints"}</span>
          </button>

          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1.5 text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Topology Canvas */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-full h-[650px] rounded-2xl border border-border/80 bg-gradient-to-b from-background via-card/30 to-background overflow-hidden shadow-2xl touch-none select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Subtle grid background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Empty State */}
        {networkDevices.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-xl shadow-primary/10">
              <Network className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">No Network Hardware Registered</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Add your main office gateway router and core switch to generate the interactive office network map.
            </p>
            {isIT && (
              <button
                onClick={onOpenDeviceModal}
                className="px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-md shadow-primary/20"
              >
                + Register First Switch / Router
              </button>
            )}
          </div>
        ) : (
          /* Scalable & Pannable Viewport */
          <div
            className={`absolute inset-0 flex items-start justify-center pt-10 px-8 origin-top ${
              isDragging ? "transition-none" : "transition-transform duration-150 ease-out"
            }`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <div className="flex flex-wrap items-start justify-center gap-12 sm:gap-16">
              {rootDevices.map((root) => renderDeviceTree(root))}
            </div>
          </div>
        )}

        {/* Bottom Left Legend */}
        <div className="absolute bottom-4 left-4 p-3 rounded-xl glass-card border border-border/80 text-[11px] text-muted-foreground shadow-lg flex flex-col gap-1.5 pointer-events-none">
          <span className="font-extrabold text-foreground uppercase tracking-wider text-[10px]">
            Network Legend
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Switch Trunk / Uplink</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Connected Workstation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>Network Printer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>Wall Outlet / CCTV</span>
          </div>
        </div>
      </div>

      {/* Selected Node Details Drawer / Popover */}
      {selectedNode && (
        <div className="glass-card border border-border/80 rounded-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                {selectedNode.isEndpoint ? (
                  selectedNode.targetDevice ? (
                    <Laptop className="w-5 h-5 text-emerald-400" />
                  ) : selectedNode.targetPrinter ? (
                    <PrinterIcon className="w-5 h-5 text-orange-400" />
                  ) : (
                    <Layers className="w-5 h-5 text-cyan-400" />
                  )
                ) : (
                  getDeviceIcon(selectedNode.deviceType)
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {selectedNode.isEndpoint
                    ? selectedNode.targetDevice
                      ? `${selectedNode.targetDevice.brand} ${selectedNode.targetDevice.model}`
                      : selectedNode.targetPrinter
                      ? `${selectedNode.targetPrinter.brand} ${selectedNode.targetPrinter.model}`
                      : selectedNode.endpointName
                    : selectedNode.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedNode.isEndpoint
                    ? `Connected to ${selectedNode.parentDeviceName} (Port ${selectedNode.fromPort})`
                    : `${selectedNode.brand} ${selectedNode.model} • ${selectedNode.totalPorts} Ports`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedNode.targetDeviceId && (
                <Link
                  href={`/devices/${selectedNode.targetDeviceId}`}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary hover:text-primary-foreground hover:bg-primary/90 border border-primary/30 rounded-xl transition-all"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Open Computer Profile</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              )}

              {selectedNode.targetPrinterId && (
                <Link
                  href={`/printers/${selectedNode.targetPrinterId}`}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary hover:text-primary-foreground hover:bg-primary/90 border border-primary/30 rounded-xl transition-all"
                >
                  <PrinterIcon className="w-3.5 h-3.5" />
                  <span>Open Printer Profile</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              )}

              <button
                onClick={() => setSelectedNode(null)}
                className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {/* Quick Details Grid */}
          {!selectedNode.isEndpoint ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-muted-foreground block text-[11px]">Management IP</span>
                <span className="font-mono font-bold text-foreground">
                  {selectedNode.ipAddress || "None"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-muted-foreground block text-[11px]">MAC Address</span>
                <span className="font-mono font-bold text-foreground">
                  {selectedNode.macAddress || "None"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-muted-foreground block text-[11px]">Location / Rack</span>
                <span className="font-bold text-foreground">
                  {selectedNode.location || "Unspecified"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-muted-foreground block text-[11px]">Status</span>
                <span className="font-bold text-foreground">
                  {selectedNode.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-muted-foreground block text-[11px]">Cable Specification</span>
                <span className="font-bold text-foreground">{selectedNode.cableType}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-muted-foreground block text-[11px]">Link Speed</span>
                <span className="font-bold text-foreground">
                  {CONNECTION_SPEED_OPTIONS[selectedNode.speed]?.label || selectedNode.speed}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-muted-foreground block text-[11px]">VLAN Tag</span>
                <span className="font-bold text-foreground">{selectedNode.vlan || "Default (1)"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-muted-foreground block text-[11px]">Wall Outlet Plate</span>
                <span className="font-bold text-foreground">{selectedNode.wallOutlet || "Direct"}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
