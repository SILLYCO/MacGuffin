"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  ArrowRightLeft,
  History,
  HardDrive,
  Cpu,
  Zap,
  CheckCircle2,
  Wrench,
  Sparkles,
} from "lucide-react";
import { ComponentType, ComponentStatus, ComponentTransferAction } from "@prisma/client";
import { COMPONENT_TYPES } from "@/lib/constants";
import { DetachOrTransferModal } from "@/components/components/DetachOrTransferModal";
import { InstallComponentModal } from "@/components/components/InstallComponentModal";
import { ComponentModal } from "@/components/components/ComponentModal";
import { ComponentTransferHistoryModal } from "@/components/components/ComponentTransferHistoryModal";
import { ComponentIconBadge } from "@/components/ui/ComponentIcon";

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
  transfers: TransferRecord[];
}

interface DeviceOption {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  deviceType?: string;
}

interface DeviceInstalledComponentsCardProps {
  deviceId: string;
  deviceTitle: string;
  deviceType?: string;
  isIT: boolean;
  components: ComponentItem[];
  stockComponents: ComponentItem[];
  allDevices: DeviceOption[];
  assignedEmployee?: {
    id: string;
    name: string;
    email: string;
    department: string;
  } | null;
}

export function DeviceInstalledComponentsCard({
  deviceId,
  deviceTitle,
  deviceType,
  isIT,
  components,
  stockComponents,
  allDevices,
  assignedEmployee,
}: DeviceInstalledComponentsCardProps) {
  // Modal states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isInstallFromStockOpen, setIsInstallFromStockOpen] = useState(false);
  const [selectedStockComponentId, setSelectedStockComponentId] = useState<string>(
    stockComponents[0]?.id || ""
  );
  const [swappingComponent, setSwappingComponent] = useState<ComponentItem | null>(null);
  const [historyComponent, setHistoryComponent] = useState<ComponentItem | null>(null);

  const selectedStockPart = stockComponents.find((c) => c.id === selectedStockComponentId);

  return (
    <div className="glass-card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" />
              Installed Components & Modular Parts ({components.length})
            </h2>
            {assignedEmployee && (
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                👤 In Custody of {assignedEmployee.name}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Physical swappable pieces mounted inside this {deviceType === "DESKTOP_PC" ? "desktop PC" : "computer"} (RAM sticks, SSDs, GPUs)
          </p>
        </div>

        {isIT && (
          <div className="flex items-center gap-2">
            {stockComponents.length > 0 && (
              <button
                type="button"
                onClick={() => setIsInstallFromStockOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold text-xs hover:bg-purple-500/20 border border-purple-500/20 transition-all"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>+ Mount In-Stock Part ({stockComponents.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Part</span>
            </button>
          </div>
        )}
      </div>

      {/* Installed Parts Grid / List */}
      {components.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-muted/20 border border-dashed border-border/80 space-y-3">
          <Layers className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
          <div>
            <p className="font-bold text-foreground text-sm">No modular components tracked individually yet</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-md mx-auto">
              If you swap or upgrade RAM sticks, SSDs, or graphics cards in this machine, track them here for lifecycle and transfer audit trails.
            </p>
          </div>
          {isIT && (
            <div className="pt-2 flex justify-center gap-3">
              {stockComponents.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsInstallFromStockOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-500/20 border border-purple-500/20 transition-all"
                >
                  Mount from Stock Closet ({stockComponents.length} available)
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all"
              >
                Register & Mount Part
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {components.map((part) => {
            const typeDef = COMPONENT_TYPES[part.type] || COMPONENT_TYPES.OTHER;

            return (
              <div
                key={part.id}
                className="p-4 rounded-xl bg-background/60 border border-border/80 hover:border-purple-500/30 transition-all space-y-3 relative group"
              >
                {/* Header row: Type badge & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ComponentIconBadge type={part.type} size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground text-sm">
                          {part.brand} {part.model}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${typeDef.badge}`}
                        >
                          {typeDef.shortLabel}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {part.brand}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Transfer audit history button */}
                    <button
                      type="button"
                      onClick={() => setHistoryComponent(part)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="View component transfer history"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>

                    {/* Swap / Detach button */}
                    {isIT && (
                      <button
                        type="button"
                        onClick={() => setSwappingComponent(part)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-all border border-purple-500/20"
                        title="Detach to stock or hot-swap to another PC"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Swap / Detach</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Specs and Serial row */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Capacity / Specs
                    </span>
                    <span className="font-semibold text-foreground">
                      {part.capacity || "Standard"}
                    </span>
                    {part.specs && (
                      <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        {part.specs}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Serial Number
                    </span>
                    <span className="font-mono text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border/60 inline-block mt-0.5">
                      {part.serialNumber}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mount In-Stock Component Modal */}
      {isInstallFromStockOpen && stockComponents.length > 0 && (
        <InstallComponentModal
          componentId={selectedStockPart ? selectedStockPart.id : stockComponents[0].id}
          componentTitle={selectedStockPart ? `${selectedStockPart.brand} ${selectedStockPart.model}` : ""}
          componentSerial={selectedStockPart ? selectedStockPart.serialNumber : ""}
          devices={allDevices}
          preselectedDeviceId={deviceId}
          onClose={() => setIsInstallFromStockOpen(false)}
        />
      )}

      {/* Register New Component Modal directly mounted into this PC */}
      {isRegisterModalOpen && (
        <ComponentModal
          devices={allDevices}
          preselectedDeviceId={deviceId}
          onClose={() => setIsRegisterModalOpen(false)}
        />
      )}

      {/* Detach / Hot-Swap Modal */}
      {swappingComponent && (
        <DetachOrTransferModal
          componentId={swappingComponent.id}
          componentTitle={`${swappingComponent.brand} ${swappingComponent.model}`}
          componentSerial={swappingComponent.serialNumber}
          currentDeviceName={deviceTitle}
          currentDeviceId={deviceId}
          devices={allDevices}
          onClose={() => setSwappingComponent(null)}
        />
      )}

      {/* Transfer History Modal */}
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
