"use client";

import React, { useState } from "react";
import {
  Server,
  Network,
  Wifi,
  Shield,
  Search,
  Plus,
  Edit2,
  Trash2,
  Layers,
  ExternalLink,
  Eye,
  Loader2,
} from "lucide-react";
import { NetworkDeviceType, NetworkDeviceStatus } from "@prisma/client";
import {
  NETWORK_DEVICE_TYPE_CONFIG,
  NETWORK_DEVICE_STATUS_CONFIG,
} from "@/lib/constants";
import { NetworkDeviceModal } from "./NetworkDeviceModal";
import { deleteNetworkDeviceAction } from "@/lib/actions/network";

interface NetworkDeviceTableProps {
  devices: any[];
  isIT: boolean;
  onSelectDeviceForMatrix?: (deviceId: string) => void;
  onRefresh?: () => void;
}

export function NetworkDeviceTable({
  devices,
  isIT,
  onSelectDeviceForMatrix,
  onRefresh,
}: NetworkDeviceTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredDevices = devices.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      d.name.toLowerCase().includes(q) ||
      d.brand.toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q) ||
      (d.ipAddress && d.ipAddress.toLowerCase().includes(q)) ||
      (d.location && d.location.toLowerCase().includes(q));

    const matchType = typeFilter === "ALL" || d.deviceType === typeFilter;
    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;

    return matchQuery && matchType && matchStatus;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete network device "${name}" and all its port connections?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await deleteNetworkDeviceAction(id);
      if (res.error) {
        alert(res.error);
      } else {
        onRefresh?.();
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete device.");
    } finally {
      setDeletingId(null);
    }
  };

  const getDeviceIcon = (type: NetworkDeviceType) => {
    switch (type) {
      case NetworkDeviceType.ROUTER:
        return <Network className="w-4 h-4 text-indigo-400" />;
      case NetworkDeviceType.SWITCH:
        return <Server className="w-4 h-4 text-blue-400" />;
      case NetworkDeviceType.ACCESS_POINT:
        return <Wifi className="w-4 h-4 text-cyan-400" />;
      case NetworkDeviceType.FIREWALL:
        return <Shield className="w-4 h-4 text-rose-400" />;
      default:
        return <Server className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Action Bar */}
      <div className="glass-card p-4 rounded-2xl border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64 lg:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, brand, IP, rack..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="ALL">All Hardware Types</option>
            {Object.entries(NETWORK_DEVICE_TYPE_CONFIG).map(([key, opt]) => (
              <option key={key} value={key}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(NETWORK_DEVICE_STATUS_CONFIG).map(([key, opt]) => (
              <option key={key} value={key}>
                {opt.label.split(" ")[0]}
              </option>
            ))}
          </select>
        </div>

        {isIT && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-md shadow-primary/20 shrink-0 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Register Switch / Router</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass-card border border-border/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground font-extrabold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 sm:p-4">Device</th>
                <th className="p-3.5 sm:p-4">Role / Type</th>
                <th className="p-3.5 sm:p-4">Management IP / MAC</th>
                <th className="p-3.5 sm:p-4">Location</th>
                <th className="p-3.5 sm:p-4">Port Capacity</th>
                <th className="p-3.5 sm:p-4">Status</th>
                <th className="p-3.5 sm:p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No matching network devices found.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((dev) => {
                  const typeConfig = NETWORK_DEVICE_TYPE_CONFIG[dev.deviceType] || NETWORK_DEVICE_TYPE_CONFIG.OTHER;
                  const statusConfig = NETWORK_DEVICE_STATUS_CONFIG[dev.status] || NETWORK_DEVICE_STATUS_CONFIG.ONLINE;
                  const occupiedPortNumbers = new Set<number>();
                  dev.outgoingConnections?.forEach((c: any) => occupiedPortNumbers.add(c.fromPort));
                  dev.incomingConnections?.forEach((c: any) => {
                    if (c.targetNetworkPort) occupiedPortNumbers.add(c.targetNetworkPort);
                  });
                  const usedPorts = occupiedPortNumbers.size;
                  const pct = Math.round((usedPorts / dev.totalPorts) * 100);

                  return (
                    <tr key={dev.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name & Model */}
                      <td className="p-3.5 sm:p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                            {getDeviceIcon(dev.deviceType)}
                          </div>
                          <div>
                            <span className="font-extrabold text-foreground block text-sm">
                              {dev.name}
                            </span>
                            <span className="text-muted-foreground text-[11px]">
                              {dev.brand} {dev.model}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-3.5 sm:p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${typeConfig.badge}`}>
                          {typeConfig.label.split(" ")[0]}
                        </span>
                      </td>

                      {/* IP & MAC */}
                      <td className="p-3.5 sm:p-4 font-mono text-[11px]">
                        <span className="text-foreground font-semibold block">
                          {dev.ipAddress || "—"}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          {dev.macAddress || ""}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="p-3.5 sm:p-4 text-muted-foreground">
                        {dev.location ? `📍 ${dev.location}` : "—"}
                      </td>

                      {/* Port Utilization */}
                      <td className="p-3.5 sm:p-4">
                        <div className="w-36 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-foreground">
                              {usedPorts} / {dev.totalPorts}
                            </span>
                            <span className="text-muted-foreground font-medium">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct > 90 ? "bg-rose-500" : pct > 70 ? "bg-amber-500" : "bg-primary"
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 sm:p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConfig.bg} ${statusConfig.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          <span>{statusConfig.label.split(" ")[0]}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 sm:p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onSelectDeviceForMatrix && (
                            <button
                              onClick={() => onSelectDeviceForMatrix(dev.id)}
                              className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-colors"
                              title="Inspect Switch Ports"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          {isIT && (
                            <button
                              onClick={() => setEditingDevice(dev)}
                              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                              title="Edit Device"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {isIT && (
                            <button
                              onClick={() => handleDelete(dev.id, dev.name)}
                              disabled={deletingId === dev.id}
                              className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                              title="Delete Device"
                            >
                              {deletingId === dev.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
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

      {/* Modals */}
      {isAddModalOpen && (
        <NetworkDeviceModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            onRefresh?.();
          }}
        />
      )}

      {editingDevice && (
        <NetworkDeviceModal
          device={editingDevice}
          onClose={() => setEditingDevice(null)}
          onSuccess={() => {
            setEditingDevice(null);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
