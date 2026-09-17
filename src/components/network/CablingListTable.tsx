"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Cable,
  Search,
  Laptop,
  Printer as PrinterIcon,
  Server,
  Layers,
  ExternalLink,
  Trash2,
  Loader2,
  Plug,
} from "lucide-react";
import {
  CABLE_COLOR_PALETTE,
  CONNECTION_SPEED_OPTIONS,
} from "@/lib/constants";
import { unpatchNetworkPortAction } from "@/lib/actions/network";

interface CablingListTableProps {
  devices: any[];
  isIT: boolean;
  onRefresh?: () => void;
}

export function CablingListTable({ devices, isIT, onRefresh }: CablingListTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [vlanFilter, setVlanFilter] = useState<string>("ALL");
  const [unpluggingId, setUnpluggingId] = useState<string | null>(null);

  // Flatten all outgoing connections across all devices
  const allCables: any[] = [];
  devices.forEach((dev) => {
    (dev.outgoingConnections || []).forEach((conn: any) => {
      allCables.push({
        ...conn,
        originDevice: dev,
      });
    });
  });

  // Extract unique VLAN tags
  const uniqueVlans = Array.from(
    new Set(allCables.map((c) => c.vlan).filter(Boolean))
  ) as string[];

  const filteredCables = allCables.filter((c) => {
    const q = searchQuery.toLowerCase();
    const originMatch = c.originDevice.name.toLowerCase().includes(q);
    const targetName = (
      c.targetNetworkDevice?.name ||
      (c.targetDevice ? `${c.targetDevice.brand} ${c.targetDevice.model}` : "") ||
      (c.targetPrinter ? `${c.targetPrinter.brand} ${c.targetPrinter.model}` : "") ||
      c.endpointName ||
      ""
    ).toLowerCase();

    const outletMatch = (c.wallOutlet || "").toLowerCase().includes(q);
    const vlanMatch = vlanFilter === "ALL" || c.vlan === vlanFilter;

    return (originMatch || targetName.includes(q) || outletMatch) && vlanMatch;
  });

  const handleUnplug = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to unplug cable "${label}"?`)) return;

    setUnpluggingId(id);
    try {
      const res = await unpatchNetworkPortAction(id);
      if (res.error) {
        alert(res.error);
      } else {
        onRefresh?.();
      }
    } catch (err: any) {
      alert(err.message || "Failed to unplug cable.");
    } finally {
      setUnpluggingId(null);
    }
  };

  const getCableHex = (colorName?: string | null) => {
    if (!colorName) return null;
    const match = CABLE_COLOR_PALETTE.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    );
    return match ? match.hex : null;
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64 lg:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by switch, port, endpoint, or wall outlet..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <select
            value={vlanFilter}
            onChange={(e) => setVlanFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="ALL">All VLANs ({allCables.length} cables)</option>
            {uniqueVlans.map((v) => (
              <option key={v} value={v}>
                VLAN: {v}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-muted-foreground font-semibold">
          Showing {filteredCables.length} of {allCables.length} patched cables
        </div>
      </div>

      {/* Cabling Table */}
      <div className="glass-card border border-border/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground font-extrabold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 sm:p-4">Switch & Port</th>
                <th className="p-3.5 sm:p-4">Target Connected Asset</th>
                <th className="p-3.5 sm:p-4">Target Type</th>
                <th className="p-3.5 sm:p-4">Cable / Speed</th>
                <th className="p-3.5 sm:p-4">VLAN</th>
                <th className="p-3.5 sm:p-4">Wall Outlet Plate</th>
                <th className="p-3.5 sm:p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredCables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No cable connections found.
                  </td>
                </tr>
              ) : (
                filteredCables.map((c) => {
                  const cableHex = getCableHex(c.cableColor);
                  const isUplink = !!c.targetNetworkDeviceId;
                  const isComputer = !!c.targetDeviceId;
                  const isPrinter = !!c.targetPrinterId;

                  const targetName = isUplink
                    ? `${c.targetNetworkDevice?.name || "Target Switch"}${c.targetNetworkPort ? ` (Port ${c.targetNetworkPort})` : ""}`
                    : isComputer
                    ? `${c.targetDevice.brand} ${c.targetDevice.model}`
                    : isPrinter
                    ? `${c.targetPrinter.brand} ${c.targetPrinter.model}`
                    : c.endpointName;

                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      {/* Origin Port */}
                      <td className="p-3.5 sm:p-4 font-mono text-[11px]">
                        <span className="font-extrabold text-foreground block">
                          {c.originDevice.name}
                        </span>
                        <span className="text-primary font-bold">
                          Port {c.fromPort} {c.fromPortLabel ? `(${c.fromPortLabel})` : ""}
                        </span>
                      </td>

                      {/* Target Connected Asset */}
                      <td className="p-3.5 sm:p-4">
                        <div className="flex items-center gap-2.5">
                          {cableHex && (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: cableHex }}
                              title={`Cable Color: ${c.cableColor}`}
                            />
                          )}
                          <span className="font-bold text-foreground block truncate max-w-xs">
                            {targetName}
                          </span>
                        </div>
                        {isUplink && c.targetNetworkPort && (
                          <span className="text-[10px] text-purple-400 font-mono pl-5">
                            ➔ Connected to Port {c.targetNetworkPort}
                          </span>
                        )}
                      </td>

                      {/* Target Type Badge */}
                      <td className="p-3.5 sm:p-4">
                        {isUplink ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Switch Trunk
                          </span>
                        ) : isComputer ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Workstation
                          </span>
                        ) : isPrinter ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            Printer
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {c.endpointType || "Wall Outlet"}
                          </span>
                        )}
                      </td>

                      {/* Cable & Speed */}
                      <td className="p-3.5 sm:p-4">
                        <span className="font-bold text-foreground block">{c.cableType}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {CONNECTION_SPEED_OPTIONS[c.speed]?.label || c.speed}
                        </span>
                      </td>

                      {/* VLAN */}
                      <td className="p-3.5 sm:p-4">
                        <span className="px-2 py-0.5 rounded bg-muted/60 text-foreground font-mono text-[11px] font-bold">
                          {c.vlan || "Default (1)"}
                        </span>
                      </td>

                      {/* Wall Outlet */}
                      <td className="p-3.5 sm:p-4 text-muted-foreground font-mono text-[11px]">
                        {c.wallOutlet ? `📍 ${c.wallOutlet}` : "—"}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 sm:p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.targetDeviceId && (
                            <Link
                              href={`/devices/${c.targetDeviceId}`}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors"
                              title="View Computer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          {c.targetPrinterId && (
                            <Link
                              href={`/printers/${c.targetPrinterId}`}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors"
                              title="View Printer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          {isIT && (
                            <button
                              onClick={() =>
                                handleUnplug(c.id, `${c.originDevice.name} P${c.fromPort} ➔ ${targetName}`)
                              }
                              disabled={unpluggingId === c.id}
                              className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                              title="Unplug Cable"
                            >
                              {unpluggingId === c.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
