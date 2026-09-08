"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Filter,
  Cpu,
  HardDrive,
  Layers,
  ArrowRightLeft,
  Wrench,
  History,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Archive,
  Monitor,
  Laptop,
  User,
  X,
  Eye,
} from "lucide-react";
import { ComponentType, ComponentStatus, ComponentTransferAction } from "@prisma/client";
import {
  COMPONENT_TYPES,
  COMPONENT_STATUS_LABELS,
} from "@/lib/constants";
import { ComponentModal } from "./ComponentModal";
import { InstallComponentModal } from "./InstallComponentModal";
import { DetachOrTransferModal } from "./DetachOrTransferModal";
import { ComponentTransferHistoryModal } from "./ComponentTransferHistoryModal";
import { ComponentIconBadge } from "@/components/ui/ComponentIcon";
import { deleteComponentAction } from "@/lib/actions/components";

interface TransferRecord {
  id: string;
  fromDeviceName?: string | null;
  toDeviceName?: string | null;
  actionType: ComponentTransferAction;
  reason?: string | null;
  performedByEmail: string;
  transferredAt: Date | string;
}

interface ComponentItem {
  id: string;
  type: ComponentType;
  brand: string;
  model: string;
  capacity?: string | null;
  specs?: string | null;
  serialNumber: string;
  status: ComponentStatus;
  notes?: string | null;
  deviceId?: string | null;
  device?: {
    id: string;
    brand: string;
    model: string;
    serialNumber: string;
    deviceType?: string;
    assignments?: Array<{
      employee: {
        id: string;
        name: string;
        email: string;
        department: string;
      };
    }>;
  } | null;
  transfers: TransferRecord[];
}

interface DeviceOption {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  deviceType?: string;
}

interface ComponentTableProps {
  components: ComponentItem[];
  devices: DeviceOption[];
  userRole: string;
}

export function ComponentTable({ components, devices, userRole }: ComponentTableProps) {
  const [localComponents, setLocalComponents] = useState<ComponentItem[]>(components);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const router = useRouter();
  const isIT = userRole === "IT";

  // Sync state if server revalidates props
  useEffect(() => {
    setLocalComponents(components);
  }, [components]);

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ComponentItem | null>(null);
  const [installingComponent, setInstallingComponent] = useState<ComponentItem | null>(null);
  const [swappingComponent, setSwappingComponent] = useState<ComponentItem | null>(null);
  const [historyComponent, setHistoryComponent] = useState<ComponentItem | null>(null);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete component "${name}" from inventory?`)) {
      return;
    }
    setDeletingId(id);
    const res = await deleteComponentAction(id);
    setDeletingId(null);
    if (res?.error) {
      alert(`Could not delete component: ${res.error}`);
    } else {
      setLocalComponents((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    }
  };

  // Metrics counts
  const totalCount = localComponents.length;
  const inStockCount = localComponents.filter((c) => c.status === "IN_STOCK").length;
  const installedCount = localComponents.filter((c) => c.status === "INSTALLED").length;
  const defectiveCount = localComponents.filter((c) => c.status === "DEFECTIVE").length;

  const ramCount = localComponents.filter((c) => c.type === "RAM").length;
  const ssdCount = localComponents.filter((c) => c.type === "STORAGE_SSD").length;
  const gpuCount = localComponents.filter((c) => c.type === "GPU").length;

  // Filter components
  const filteredComponents = localComponents.filter((c) => {
    const searchLower = search.toLowerCase();
    const mountedDev = c.device ? `${c.device.brand} ${c.device.model} ${c.device.serialNumber}`.toLowerCase() : "";
    const assignedEmp = c.device?.assignments?.[0]?.employee;
    const employeeText = assignedEmp ? `${assignedEmp.name} ${assignedEmp.email} ${assignedEmp.department}`.toLowerCase() : "";

    const matchesSearch =
      c.brand.toLowerCase().includes(searchLower) ||
      c.model.toLowerCase().includes(searchLower) ||
      c.serialNumber.toLowerCase().includes(searchLower) ||
      (c.capacity && c.capacity.toLowerCase().includes(searchLower)) ||
      (c.specs && c.specs.toLowerCase().includes(searchLower)) ||
      mountedDev.includes(searchLower) ||
      employeeText.includes(searchLower);

    const matchesType = typeFilter === "ALL" || c.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Modular Hardware Components & Parts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track individual RAM sticks, SSDs, GPUs, swappable PC modules, and transfer history
          </p>
        </div>

        {isIT && (
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Stock New Component
          </button>
        )}
      </div>

      {/* Mini Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{totalCount}</div>
            <div className="text-[11px] font-semibold text-muted-foreground">Total Parts Tracked</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3.5 border-emerald-500/30">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{inStockCount}</div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Ready on Stock Shelf
            </div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3.5 border-blue-500/30">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{installedCount}</div>
            <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              Mounted in Computers
            </div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3.5 border-rose-500/30">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{defectiveCount}</div>
            <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              Defective / In Repair
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 md:p-5 space-y-4">
        {/* Search & Category Pills */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by part, brand, model, serial number, or PC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-background/80 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Segmented Type Tabs */}
          <div className="inline-flex flex-wrap p-1 bg-muted/60 border border-border/80 rounded-xl text-xs font-semibold gap-0.5">
            <button
              type="button"
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === "ALL"
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Types ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("RAM")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === "RAM"
                  ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              RAM ({ramCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("STORAGE_SSD")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === "STORAGE_SSD"
                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              SSD ({ssdCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("GPU")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === "GPU"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              GPU ({gpuCount})
            </button>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-primary" />
              Filters:
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-background/80 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              <option value="ALL">All Hardware Types</option>
              {Object.keys(COMPONENT_TYPES).map((k) => (
                <option key={k} value={k}>
                  {COMPONENT_TYPES[k as ComponentType]?.label || k}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-background/80 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            >
              <option value="ALL">All Statuses</option>
              {Object.keys(COMPONENT_STATUS_LABELS).map((s) => (
                <option key={s} value={s}>
                  {COMPONENT_STATUS_LABELS[s].label}
                </option>
              ))}
            </select>
          </div>

          {(search || typeFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTypeFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Components Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1140px]">
            <thead className="bg-muted/50 border-b border-border/80 text-[11px] uppercase font-extrabold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap min-w-[240px]">Component & Model</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[180px]">Capacity & Specs</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[150px]">Serial Number</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[230px]">Current Placement</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[120px]">Status</th>
                <th className="px-6 py-4 text-right whitespace-nowrap min-w-[220px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredComponents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    <Cpu className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-base text-foreground">No components found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try adjusting your filter or search query.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredComponents.map((c) => {
                  const typeDef = COMPONENT_TYPES[c.type] || COMPONENT_TYPES.OTHER;
                  const statusDef = COMPONENT_STATUS_LABELS[c.status] || COMPONENT_STATUS_LABELS.IN_STOCK;

                  return (
                    <tr key={c.id} className="hover:bg-muted/40 transition-colors group">
                      {/* Component info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <ComponentIconBadge type={c.type} size="md" hoverScale />
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/components/${c.id}`}
                                className="font-bold text-foreground text-sm hover:text-primary transition-colors hover:underline"
                              >
                                {c.brand} {c.model}
                              </Link>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${typeDef.badge}`}
                              >
                                {typeDef.shortLabel}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                              Brand: {c.brand}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Capacity & Specs */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          {c.capacity ? (
                            <span className="font-bold text-foreground text-xs inline-block">
                              {c.capacity}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Standard</span>
                          )}
                          {c.specs && (
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {c.specs}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Serial Number */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/80 font-mono text-xs text-muted-foreground inline-block">
                          {c.serialNumber}
                        </span>
                      </td>

                      {/* Current Placement & Employee Custody */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {c.device ? (
                          <div className="space-y-1">
                            <Link
                              href={`/devices/${c.device.id}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors hover:underline"
                            >
                              <Monitor className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{c.device.brand} {c.device.model}</span>
                            </Link>

                            {c.device.assignments && c.device.assignments[0]?.employee ? (
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <span className="text-muted-foreground">In custody:</span>
                                <Link
                                  href={`/employees/${c.device.assignments[0].employee.id}`}
                                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  <User className="w-3 h-3 shrink-0" />
                                  <span>{c.device.assignments[0].employee.name}</span>
                                </Link>
                              </div>
                            ) : (
                              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                <span>In Stock (Machine unassigned)</span>
                              </div>
                            )}
                          </div>
                        ) : c.status === "DEFECTIVE" ? (
                          <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Quarantine Bin
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> IT Storage Shelf
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusDef.bg} ${statusDef.text} ${statusDef.border}`}
                        >
                          {statusDef.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap min-w-[220px]">
                        <div className="flex items-center justify-end gap-1.5 shrink-0">
                          {/* Swap / Mount actions */}
                          {isIT && c.status === "IN_STOCK" && (
                            <button
                              type="button"
                              onClick={() => setInstallingComponent(c)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 shrink-0"
                              title="Mount into computer"
                            >
                              <Wrench className="w-3.5 h-3.5 shrink-0" />
                              <span>Install</span>
                            </button>
                          )}

                          {isIT && c.status === "INSTALLED" && (
                            <button
                              type="button"
                              onClick={() => setSwappingComponent(c)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-all border border-purple-500/20 shrink-0"
                              title="Detach to shelf or hot-swap to another PC"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                              <span>Swap</span>
                            </button>
                          )}

                          {/* View Details Screen */}
                          <Link
                            href={`/components/${c.id}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                            title="View component details & assignment"
                          >
                            <Eye className="w-4 h-4 shrink-0" />
                          </Link>

                          {/* Audit History Trail */}
                          <button
                            type="button"
                            onClick={() => setHistoryComponent(c)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                            title="View transfer audit history"
                          >
                            <History className="w-4 h-4 shrink-0" />
                          </button>

                          {/* Edit / Delete */}
                          {isIT && (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditingComponent(c)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                                title="Edit component"
                              >
                                <Edit2 className="w-3.5 h-3.5 shrink-0" />
                              </button>
                              <button
                                type="button"
                                disabled={deletingId === c.id}
                                onClick={() => handleDelete(c.id, `${c.brand} ${c.model}`)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 shrink-0"
                                title="Delete component"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              </button>
                            </>
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

        <div className="p-4 border-t border-border/60 bg-muted/20 text-xs font-semibold text-muted-foreground flex justify-between items-center">
          <span>
            Showing <strong className="text-foreground">{filteredComponents.length}</strong> of{" "}
            <strong className="text-foreground">{localComponents.length}</strong> hardware components
          </span>
        </div>
      </div>

      {/* Register / Edit Component Modal */}
      {(isNewModalOpen || editingComponent) && (
        <ComponentModal
          initialComponent={editingComponent}
          devices={devices}
          onClose={() => {
            setIsNewModalOpen(false);
            setEditingComponent(null);
          }}
        />
      )}

      {/* Install Component Modal */}
      {installingComponent && (
        <InstallComponentModal
          componentId={installingComponent.id}
          componentTitle={`${installingComponent.brand} ${installingComponent.model}`}
          componentSerial={installingComponent.serialNumber}
          devices={devices}
          onClose={() => setInstallingComponent(null)}
        />
      )}

      {/* Detach / Hot-Swap Modal */}
      {swappingComponent && (
        <DetachOrTransferModal
          componentId={swappingComponent.id}
          componentTitle={`${swappingComponent.brand} ${swappingComponent.model}`}
          componentSerial={swappingComponent.serialNumber}
          currentDeviceName={
            swappingComponent.device
              ? `${swappingComponent.device.brand} ${swappingComponent.device.model} (${swappingComponent.device.serialNumber})`
              : "Computer Machine"
          }
          currentDeviceId={swappingComponent.deviceId}
          devices={devices}
          onClose={() => setSwappingComponent(null)}
        />
      )}

      {/* Audit History Modal */}
      {historyComponent && (
        <ComponentTransferHistoryModal
          componentTitle={`${historyComponent.brand} ${historyComponent.model}`}
          componentSerial={historyComponent.serialNumber}
          transfers={historyComponent.transfers}
          onClose={() => setHistoryComponent(null)}
        />
      )}
    </div>
  );
}
